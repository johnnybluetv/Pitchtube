import React, { useState, useCallback } from 'react';
import { X, Upload, FileText, Image as ImageIcon, MessageSquare, Video, Loader2, Link as LinkIcon, Camera, LayoutPanelTop, CheckCircle2, ChevronRight, ChevronLeft, Scissors, Cloud, Globe, AlertCircle, Linkedin, Mic, StopCircle, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { VideoEditor } from './VideoEditor';
import { notifyNewPitch } from '../../services/emailService';
import { triggerEffect } from '../shared/StarEffect';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'videos' | 'documents' | 'posts' | 'images' | 'need' | 'audio' | 'thesis';
  userId: string;
  userRole?: 'founder' | 'investor';
}

type Step = 'source' | 'cloud-picker' | 'recording' | 'edit' | 'details' | 'uploading' | 'success';

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, type, userId, userRole }) => {
  const [step, setStep] = useState<Step>('source');
  const [isRecordingLive, setIsRecordingLive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const videoPreviewRef = React.useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [uploadRetryCount, setUploadRetryCount] = useState(0);
  const [isWatermarking, setIsWatermarking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'drive' | 'dropbox' | 'instagram' | 'linkedin' | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [currentUploadingIndex, setCurrentUploadingIndex] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: '',
    fileType: 'pdf',
    caption: '',
    funding_goal: '',
    investor_name: '',
    firm_name: '',
    min_check: '',
    max_check: '',
    focus_industries: '',
  });

  const generateThumbnail = (videoFile: File | string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      const isUrl = typeof videoFile === 'string';
      if (isUrl) {
        video.crossOrigin = 'anonymous';
      }

      const videoUrl = isUrl ? videoFile as string : URL.createObjectURL(videoFile as File);
      
      let timeoutId: NodeJS.Timeout;
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        if (!isUrl) URL.revokeObjectURL(videoUrl);
        video.onloadedmetadata = null;
        video.onseeked = null;
        video.onerror = null;
      };

      video.onloadedmetadata = () => {
        // Try to capture at 1 second, or midpoint
        video.currentTime = Math.min(1, video.duration / 2 || 0);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          if (canvas.width === 0 || canvas.height === 0) {
             // Sometimes dimensions aren't ready even after seeked on some browsers
             setTimeout(() => {
               if (video.videoWidth > 0) {
                 canvas.width = video.videoWidth;
                 canvas.height = video.videoHeight;
                 const ctx = canvas.getContext('2d');
                 if (ctx) {
                   ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                   const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                   cleanup();
                   resolve(dataUrl);
                 }
               }
             }, 500);
             return;
          }
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cleanup();
            reject('Could not get canvas context');
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          cleanup();
          resolve(dataUrl);
        } catch (err) {
          console.error("Canvas capture error:", err);
          cleanup();
          reject('Canvas capture failed');
        }
      };

      video.onerror = (e) => {
        console.error("Video thumbnail error for source:", isUrl ? videoUrl : "Local File", e);
        cleanup();
        reject('Error loading video for thumbnail');
      };

      video.src = videoUrl;
      video.load(); // Explicit load call

      timeoutId = setTimeout(() => {
        cleanup();
        reject('Thumbnail generation timeout');
      }, 10000);
    });
  };

  const startRecording = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'audio' ? false : { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      if (videoPreviewRef.current && type !== 'audio') {
        videoPreviewRef.current.srcObject = stream;
      }

      const recorderOptions = type === 'audio' 
        ? { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 }
        : {
            mimeType: 'video/webm;codecs=vp9,opus',
            videoBitsPerSecond: 8000000, 
            audioBitsPerSecond: 128000
          };

      const recorder = new MediaRecorder(stream, recorderOptions);

      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: type === 'audio' ? 'audio/webm' : 'video/webm' });
        const extension = type === 'audio' ? 'webm' : 'webm'; // webm is fine for both
        const file = new File([blob], `recorded-${type}-${Date.now()}.${extension}`, { type: blob.type });
        setFiles([file]);
        
        if (type === 'videos' || type === 'need' || type === 'thesis') {
          try {
            const thumb = await generateThumbnail(file);
            setThumbnailUrl(thumb);
          } catch (err) {
            console.error("Failed to generate thumb for recording:", err);
            setThumbnailUrl('https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=400');
          }
          setStep('edit');
        } else {
          setStep('details');
        }
        
        stopStream();
      };

      recorder.start();
      setIsRecordingLive(true);
      setRecordingTime(0);
      setStep('recording');
      
      // Timer setup
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setUrlError("Could not access camera or microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingLive(false);
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    stopStream();
    setStep('source');
    setIsRecordingLive(false);
    setFiles([]);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles(acceptedFiles);
      
      if (type === 'videos' || type === 'need' || type === 'thesis') {
        setStep('edit');
        try {
          const thumb = await generateThumbnail(acceptedFiles[0]);
          setThumbnailUrl(thumb);
        } catch (err) {
          console.error("Failed to generate thumbnail:", err);
          setThumbnailUrl('https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=400');
        }
      } else if (type === 'audio') {
        setStep('details');
      } else {
        setStep('details');
      }
    }
  }, [type]);

  const dropzoneOptions: any = {
    onDrop,
    accept: type === 'videos' || type === 'need' || type === 'thesis'
      ? { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] } 
      : type === 'images' 
        ? { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] } 
        : type === 'audio'
          ? { 'audio/*': ['.mp3', '.wav', '.m4a', '.webm'] }
          : type === 'documents' 
            ? { 
                'application/pdf': ['.pdf'], 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] 
              }
            : undefined,
    multiple: true
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  const [uploadTitle, setUploadTitle] = useState(''); // Separate state for easier validation if needed
  
  const handleUpload = async () => {
    if (!auth.currentUser) return;
    
    // Advanced Input Validation
    if ((type === 'videos' || type === 'need' || type === 'documents') && formData.title.trim().length < 5) {
      setUrlError("IDENT_FAIL: Title must be at least 5 characters for neural indexing.");
      return;
    }
    if (type === 'posts' && formData.content.trim().length < 20) {
      setUrlError("INTEL_THIN: Analysis must be at least 20 characters for strategic depth.");
      return;
    }

    setLoading(true);
    setStep('uploading');
    setUploadProgress(0);
    setUploadRetryCount(0);
    setIsWatermarking(true);

    const itemsToUpload = files.length > 0 ? files : [null];
    let totalSuccessCount = 0;

    for (let i = 0; i < itemsToUpload.length; i++) {
      setCurrentUploadingIndex(i);
      const currentFile = itemsToUpload[i];
      setUploadProgress(0);
      setUploadRetryCount(0);
      setIsWatermarking(true);

      // Simulate Watermarking phase per file
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsWatermarking(false);

      const performUploadAttempt = async (attempt: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
              clearInterval(interval);
              setUploadProgress(100);
              resolve();
              return;
            }
            
            // Artificial transient failure for demo
            if (attempt < 1 && progress > 50 && progress < 80 && Math.random() > 0.7) {
              clearInterval(interval);
              reject(new Error("Transient Uplink Interruption (E_NODE_STALE)"));
              return;
            }
            
            setUploadProgress(Math.min(progress, 100));
          }, 300);
        });
      };

      const maxRetries = 3;
      let fileSuccess = false;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          await performUploadAttempt(attempt);
          fileSuccess = true;
          break;
        } catch (err) {
          if (attempt === maxRetries - 1) {
            console.error("Critical upload failure:", err);
            setUrlError(`Critical transmission failure for item ${i + 1} after 3 attempts.`);
            setStep('details');
            setLoading(false);
            return;
          } else {
            setUploadRetryCount(attempt + 1);
            setUploadProgress(0);
            const backoffTime = Math.pow(2, attempt + 1);
            setRetryCountdown(backoffTime);
            
            // Check for manual retry via a promise racer or similar
            // Simple version: just use the countdown
            const countdownTimer = setInterval(() => {
              setRetryCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(countdownTimer);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);

            await new Promise(r => {
              const checkInterval = setInterval(() => {
                if (retryCountdown === 0) {
                  clearInterval(checkInterval);
                  r(null);
                }
              }, 100);
              // Fallback safety
              setTimeout(() => {
                clearInterval(checkInterval);
                r(null);
              }, (backoffTime + 1) * 1000);
            });
            
            setRetryCountdown(0);
          }
        }
      }

      if (fileSuccess) {
        totalSuccessCount++;
        try {
          let colName = '';
          let data: any = {
            userId,
            createdAt: serverTimestamp(),
            source: selectedProvider || (currentFile ? 'local_uplink' : formData.url ? 'external_node' : 'native_cam'),
            watermarkId: `AIS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          };

          switch (type) {
            case 'posts':
              colName = 'posts';
              data.content = formData.content;
              break;
            case 'documents':
              colName = 'documents';
              data.name = formData.title || currentFile?.name || 'Untitled Document';
              data.fileURL = formData.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
              data.fileType = formData.fileType || 'pdf';
              break;
            case 'images':
              colName = 'images';
              data.imageURL = formData.url || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800';
              data.caption = formData.caption;
              break;
            case 'audio':
              colName = 'pitches';
              data.founderId = userId;
              data.founder_name = auth.currentUser?.displayName || 'Founder';
              data.company_name = formData.title || 'New Audio Pitch';
              data.audio_url = formData.url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
              data.tier = 'Audio';
              data.mediaType = 'audio';
              data.thumbnail_url = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400';
              if (formData.funding_goal) {
                data.funding_goal = Number(formData.funding_goal);
              }
              break;
            case 'thesis':
              colName = 'intrestors';
              data.investor_name = formData.investor_name || auth.currentUser?.displayName || 'Investor';
              data.firm_name = formData.firm_name || 'Venture Partners';
              data.video_url = formData.url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
              data.thumbnail_url = thumbnailUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800';
              data.min_check = formData.min_check || '100k';
              data.max_check = formData.max_check || '5M';
              data.focus_industries = formData.focus_industries.split(',').map(s => s.trim()) || ['SaaS', 'AI', 'Fintech'];
              data.id = userId;
              break;
            case 'videos':
            case 'need':
              colName = userRole === 'investor' ? 'intrestors' : 'pitches';
              if (userRole === 'investor') {
                data.investor_name = auth.currentUser?.displayName || 'Investor';
                data.firm_name = formData.title || 'Venture Partners';
                data.video_url = formData.url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
                data.thumbnail_url = thumbnailUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800';
                data.min_check = '100k';
                data.max_check = '5M';
                data.focus_industries = ['SaaS', 'AI', 'Fintech'];
                data.id = userId;
              } else {
                data.founderId = userId;
                data.founder_name = auth.currentUser?.displayName || 'Founder';
                data.company_name = formData.title || 'New Startup';
                data.video_url = formData.url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
                data.thumbnail_url = thumbnailUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800';
                data.tier = '1m';
                data.burn_count = 0;
                if (formData.funding_goal) {
                  data.funding_goal = Number(formData.funding_goal);
                }
              }
              break;
          }

          // In multiple upload, if we are in videos mode, we already merge them in the editor
          // So technically for videos it's still 1 doc, but for docs/images it's multiple.
          await addDoc(collection(db, colName), data);
          
          // If we're not doing docs/images, we only have 1 item in itemsToUpload anyway
          // so break after first if it's not multiple-compatible type
          if (type !== 'documents' && type !== 'images') {
             // Notify the user they successfully uploaded a pitch
             if (type === 'videos' || type === 'need') {
                const userSnap = await getDoc(doc(db, 'users', userId));
                if (userSnap.exists()) {
                   const userData = userSnap.data();
                   if (userData.notificationSettings?.emailNewPitches !== false) {
                      await notifyNewPitch(
                        userData.displayName || 'Founder',
                        formData.title || 'Your Startup',
                        userData.email
                      );
                   }
                }
             }
             break;
          }
        } catch (error) {
          console.error("Error finalizing upload subset:", error);
          setUrlError("Mainframe metadata sync rejected for one or more items.");
        }
      }
    }

    if (totalSuccessCount > 0) {
      setStep('success');
      triggerEffect('shooting-star', 12);
    } else {
      setStep('details');
    }
    setLoading(false);
  };

  const urlInputRef = React.useRef<HTMLInputElement>(null);

  const handleEditorComplete = async (processedVideo: Blob | string) => {
    // In real app, store this blob
    if (typeof processedVideo !== 'string') {
      try {
        const thumb = await generateThumbnail(processedVideo as File);
        setThumbnailUrl(thumb);
      } catch (err) {
        console.error("Failed to update thumbnail after edit:", err);
      }
    }
    setStep('details');
  };

  const handleUrlSubmit = async () => {
    setUrlError(null);
    if (!formData.url) {
      setUrlError("Uplink address required.");
      return;
    }

    setLoading(true);
    try {
      // Simulate Deep Link Inspection
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const url = formData.url.toLowerCase();
      const isDirectVideo = url.match(/\.(mp4|webm|ogg|mov|m4v)$/i);
      const isCloud = url.includes('drive.google.com') || url.includes('dropbox.com') || url.includes('box.com') || url.includes('icloud.com');
      const isSocial = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('instagram.com') || url.includes('tiktok.com') || url.includes('linkedin.com');
      const isSaaS = url.includes('loom.com') || url.includes('wistia.com') || url.includes('vidyard.com');

      if (type === 'videos' || type === 'need' || type === 'thesis') {
        if (!isDirectVideo && !isCloud && !isSocial && !isSaaS) {
          throw new Error("UNRECOGNIZED SOURCE: Please provide a verified video link or cloud repository URL.");
        }
        
        // If it's a direct video or recognizable platform, we're good
        if (isDirectVideo) {
          try {
            const thumb = await generateThumbnail(formData.url);
            setThumbnailUrl(thumb);
          } catch (e) {
            setThumbnailUrl('https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=400');
          }
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
          // Mock thumb for YT
          setThumbnailUrl(`https://img.youtube.com/vi/${url.split('v=')[1]?.split('&')[0] || 'dQw4w9WgXcQ'}/hqdefault.jpg`);
        }
        
        setStep('details');
      } else {
        setStep('details');
      }
    } catch (err: any) {
      setUrlError(err.message || "UPLINK FAILURE: Source is non-responsive or unauthorized.");
    } finally {
      setLoading(false);
    }
  };

  const [retryCountdown, setRetryCountdown] = useState(0);
  const [cloudConnectionStep, setCloudConnectionStep] = useState<string | null>(null);

  const initiateCloudImport = (provider: 'drive' | 'dropbox' | 'instagram' | 'linkedin') => {
    setSelectedProvider(provider);
    setLoading(true);
    setUrlError(null);
    
    // Detailed Cloud Handshake Sequence
    const steps = [
      "Initiating OAuth 2.1 Handshake...",
      "Validating Scopes & Permissions...",
      "Exchanging Temp tokens for Session ID...",
      "Synchronizing Repository Nodes...",
      "Connecting to Cloud Core..."
    ];
    
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      if (stepIdx < steps.length) {
        setCloudConnectionStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 450);

    setTimeout(() => {
      clearInterval(stepInterval);
      setLoading(false);
      setCloudConnectionStep(null);
      setStep('cloud-picker');
    }, 2500);
  };

  const selectCloudFile = async (item: { name: string, url: string }) => {
    setLoading(true);
    try {
      setFormData(prev => ({ ...prev, url: item.url, title: item.name.split('.')[0] }));
      setFiles([]);
      
      if (type === 'videos' || type === 'need' || type === 'thesis') {
        try {
          const thumb = await generateThumbnail(item.url);
          setThumbnailUrl(thumb);
        } catch (e) {
          setThumbnailUrl('https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=400');
        }
      }
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  const MOCK_CLOUD_FILES = {
    drive: [
      { name: 'Seed_Round_Pitch_V3.mp4', size: '42MB', date: '2026-05-01', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
      { name: 'Product_Demo_Final.mp4', size: '128MB', date: '2026-04-28', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
      { name: 'User_Testimonials.mov', size: '15MB', date: '2026-04-15', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }
    ],
    dropbox: [
      { name: 'Pitch_Deck_Video.mp4', size: '38MB', date: '2026-05-02', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
      { name: 'Technical_Deep_Dive.mp4', size: '240MB', date: '2026-04-30', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' }
    ],
    instagram: [
      { name: 'Founder_Story_Reel.mp4', size: '12MB', date: '2026-05-07', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
      { name: 'Office_Tour_Snap.mp4', size: '8MB', date: '2026-05-05', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
      { name: 'Team_Lunch_Loop.mp4', size: '5MB', date: '2026-05-03', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }
    ],
    linkedin: [
      { name: 'Series_A_Announcement.mp4', size: '24MB', date: '2026-05-06', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
      { name: 'Industry_Keynote_Excerpts.mp4', size: '45MB', date: '2026-05-04', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
      { name: 'Hiring_Brand_Ad.mp4', size: '18MB', date: '2026-05-02', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' }
    ]
  };

  const closeAndReset = () => {
    stopStream();
    onClose();
    setTimeout(() => {
      setStep('source');
      setFiles([]);
      setIsRecordingLive(false);
      setRecordingTime(0);
      setFormData({ title: '', content: '', url: '', fileType: 'pdf', caption: '' });
    }, 500);
  };

  const getStepTitle = () => {
    switch (step) {
      case 'source': return `Select ${type === 'audio' ? 'Audio' : type === 'thesis' ? 'Thesis' : type.slice(0, -1)} Source`;
      case 'recording': return type === 'audio' ? "Native Voice Recording" : "Native Pitch Cam Recording";
      case 'edit': return "Video Studio Editor";
      case 'details': return "Finalize Details";
      case 'uploading': return "Broadcasting to PitchTube...";
      case 'success': return "Transmission Complete";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAndReset}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full ${step === 'edit' ? 'max-w-4xl' : 'max-w-xl'} bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-500`}
          >
            {/* Modal Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/40">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl transition-colors ${
                  step === 'success' ? 'bg-emerald-500/20' : 'bg-orange-500/10'
                }`}>
                  {step === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Upload className="w-6 h-6 text-orange-500" />}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">
                    {getStepTitle()}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {['source', 'recording', 'edit', 'details', 'success'].map((s, i) => {
                        if (type !== 'videos' && type !== 'need' && type !== 'thesis' && (s === 'edit' || s === 'recording')) return null;
                        const steps = type === 'videos' || type === 'need' || type === 'thesis' ? ['source', 'cloud-picker', 'recording', 'edit', 'details', 'success'] : ['source', 'cloud-picker', 'details', 'success'];
                        const index = steps.indexOf(step as any);
                        const selfIndex = steps.indexOf(s as any);
                        return (
                          <div 
                            key={s} 
                            className={`h-1 rounded-full transition-all duration-500 ${
                              selfIndex <= index ? 'w-4 bg-orange-500' : 'w-2 bg-white/10'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none translate-y-0.5">Pitch-Net // V2.4</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={closeAndReset}
                className="p-3 hover:bg-white/10 rounded-2xl transition-all hover:rotate-90"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="p-8 relative">
              <AnimatePresence>
                {loading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-8"
                  >
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                        <div className="absolute inset-0 bg-orange-500/20 blur-xl animate-pulse rounded-full" />
                      </div>
                      <div className="space-y-4">
                        <p className="text-sm font-black uppercase italic tracking-tighter text-white">
                          {cloudConnectionStep || "Establishing Secure Link"}
                        </p>
                        <div className="flex justify-center gap-2">
                          {[1,2,3].map(i => (
                            <motion.div 
                              key={i}
                              animate={{ 
                                scale: [1, 1.5, 1], 
                                opacity: [0.3, 1, 0.3],
                                backgroundColor: ['#52525b', '#f97316', '#52525b']
                              }}
                              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                              className="w-1.5 h-1.5 rounded-full"
                            />
                          ))}
                        </div>
                        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em]">
                          Phase: {cloudConnectionStep ? "AUTH_HANDSHAKE" : "IO_SYNC"} // Region: AIS-CORE
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {step === 'source' && (
                  <motion.div
                    key="source"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div 
                      {...getRootProps()} 
                      className={`relative border-2 border-dashed rounded-[2rem] p-12 text-center transition-all cursor-pointer group ${
                        isDragActive ? 'border-orange-500 bg-orange-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-orange-500 transition-all duration-500">
                          {type === 'audio' ? (
                            <Mic className="w-10 h-10 text-zinc-500 group-hover:text-orange-500" />
                          ) : (
                            <Upload className="w-10 h-10 text-zinc-500 group-hover:text-orange-500" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xl font-bold text-white tracking-tight">Drop your {type === 'audio' ? 'Audio' : type.slice(0, -1)} here</p>
                          <p className="text-zinc-500 text-sm max-w-[240px] mx-auto">Selected files will be optimized for Pitch-Net distribution.</p>
                        </div>
                        <button className="px-8 py-3 bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-zinc-200 transition-all">
                          Select Manually
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                      <div className="relative flex justify-center"><span className="bg-zinc-950 px-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Or External Link</span></div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <button 
                          onClick={() => initiateCloudImport('drive')}
                          className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-blue-500/50 transition-all group relative overflow-hidden flex flex-col items-center text-center"
                        >
                          <Cloud className="w-6 h-6 text-zinc-500 mb-2 group-hover:text-blue-500 group-hover:scale-110 transition-transform" />
                          <p className="font-bold text-[10px] text-white/50 uppercase tracking-widest group-hover:text-white">Google Drive</p>
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100" />
                        </button>

                        <button 
                          onClick={() => initiateCloudImport('dropbox')}
                          className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-sky-500/50 transition-all group flex flex-col items-center text-center"
                        >
                          <Globe className="w-6 h-6 text-zinc-500 mb-2 group-hover:text-sky-500 group-hover:scale-110 transition-transform" />
                          <p className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest group-hover:text-white">Dropbox</p>
                        </button>
                        
                        <button 
                          onClick={() => initiateCloudImport('instagram')}
                          className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-pink-500/50 transition-all group flex flex-col items-center text-center"
                        >
                          <Camera className="w-6 h-6 text-zinc-500 mb-2 group-hover:text-pink-500 group-hover:scale-110 transition-transform" />
                          <p className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest group-hover:text-white">Instagram</p>
                        </button>

                        <button 
                          onClick={() => initiateCloudImport('linkedin')}
                          className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-blue-600/50 transition-all group flex flex-col items-center text-center"
                        >
                          <Linkedin className="w-6 h-6 text-zinc-500 mb-2 group-hover:text-blue-600 group-hover:scale-110 transition-transform" />
                          <p className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest group-hover:text-white">LinkedIn</p>
                        </button>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => urlInputRef.current?.focus()}
                          className="flex-1 p-5 bg-zinc-900/50 border border-white/5 rounded-3xl hover:border-orange-500/50 transition-all group flex items-center gap-4"
                        >
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-orange-500/10">
                            <LinkIcon className="w-5 h-5 text-zinc-500 group-hover:text-orange-500" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-xs">Direct Link</p>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">Paste Source URL</p>
                          </div>
                        </button>

                        <button 
                          onClick={startRecording}
                          className="flex-1 p-5 bg-zinc-900/50 border border-white/5 rounded-3xl hover:border-emerald-500/50 transition-all group flex items-center gap-4"
                        >
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10">
                            {type === 'audio' ? (
                              <Mic className="w-5 h-5 text-zinc-500 group-hover:text-emerald-500" />
                            ) : (
                              <Video className="w-5 h-5 text-zinc-500 group-hover:text-emerald-500" />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-xs">{type === 'audio' ? 'Record Voice' : 'Record Live'}</p>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">{type === 'audio' ? 'Native Voice Comm' : 'Native Pitch Cam'}</p>
                          </div>
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="relative group">
                          <input 
                            ref={urlInputRef}
                            type="url"
                            placeholder="Enter media source URL (Direct link, YouTube, etc.)"
                            value={formData.url}
                            onChange={(e) => {
                              setFormData({ ...formData, url: e.target.value });
                              setUrlError(null);
                            }}
                            className={`w-full bg-zinc-900/30 border ${urlError ? 'border-red-500/50' : 'border-white/5'} rounded-2xl p-5 pl-14 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all`}
                          />
                          <Globe className={`absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors ${urlError ? 'text-red-500' : 'text-zinc-600 group-focus-within:text-orange-500'}`} />
                          
                          {formData.url && (
                            <button 
                              onClick={handleUrlSubmit}
                              disabled={loading}
                              className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-orange-600/20 disabled:opacity-50"
                            >
                              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify"}
                            </button>
                          )}
                        </div>
                        
                        <AnimatePresence>
                          {urlError && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                            >
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{urlError}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button 
                        onClick={() => setStep('details')}
                        className="flex items-center gap-4 text-xs font-black uppercase tracking-widest group hover:text-orange-500 transition-colors"
                      >
                        Skip to Details <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                )}

                 {step === 'recording' && (
                  <motion.div
                    key="recording"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-6"
                  >
                    <div className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/10 group">
                      <video 
                        ref={videoPreviewRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Recording Stats Overlay */}
                      <div className="absolute top-6 left-6 flex items-center gap-4 z-20">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                          <div className={`w-2 h-2 rounded-full bg-red-500 ${isRecordingLive ? 'animate-pulse' : ''}`} />
                          <span className="text-[10px] font-black font-mono text-white tracking-widest">{isRecordingLive ? 'REC' : 'STANDBY'}</span>
                        </div>
                        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 font-mono text-[10px] font-black text-white/90">
                          {formatRecordingTime(recordingTime)}
                        </div>
                      </div>

                      <div className="absolute top-6 right-6 z-20">
                        <div className="px-3 py-1.5 bg-orange-500/20 backdrop-blur-md rounded-full border border-orange-500/20 text-[8px] font-black uppercase text-orange-500 tracking-[0.2em]">
                          Node: Pitch-Cam_Beta
                        </div>
                      </div>

                      {/* Viewfinder corners */}
                      <div className="absolute inset-0 pointer-events-none border-[20px] border-transparent">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-xl" />
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-6">
                      <button 
                        onClick={cancelRecording}
                        className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-zinc-500 hover:text-white group"
                      >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                      </button>

                      <div className="relative">
                        <button 
                          onClick={isRecordingLive ? stopRecording : startRecording}
                          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                            isRecordingLive 
                              ? 'bg-red-500/20 border-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' 
                              : 'bg-orange-600 border-4 border-white/10 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:bg-orange-500'
                          }`}
                        >
                          {isRecordingLive ? (
                            <StopCircle className="w-10 h-10 text-red-500" />
                          ) : (
                            <div className="w-8 h-8 bg-white rounded-full" />
                          )}
                        </button>
                        
                        {isRecordingLive && (
                           <motion.div 
                             animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                             transition={{ repeat: Infinity, duration: 1.5 }}
                             className="absolute -inset-4 border-2 border-red-500 rounded-full pointer-events-none"
                           />
                        )}
                      </div>

                      <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 grayscale opacity-20 cursor-not-allowed">
                        <Mic className="w-6 h-6 text-zinc-500" />
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                        {isRecordingLive ? "Recording Stream to Local Buffer..." : "Secure Optical Sensor Ready"}
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === 'edit' && (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <VideoEditor 
                      files={files} 
                      onComplete={handleEditorComplete}
                      onCancel={() => setStep('source')}
                    />
                  </motion.div>
                )}

                {step === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {type === 'posts' ? (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Write your update</label>
                        <textarea
                          required
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          placeholder="Share what's on your mind..."
                          className="w-full bg-zinc-900 border border-white/5 rounded-[2rem] p-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-colors min-h-[200px] resize-none text-lg"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                            {type === 'images' ? 'Caption' : 'Core Identification'}
                          </label>
                          <div className="flex gap-4 items-start">
                            {(type === 'videos' || type === 'need' || type === 'thesis') && thumbnailUrl && (
                              <div className="w-24 aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden border border-white/10 shrink-0 relative group">
                                <img src={thumbnailUrl} className="w-full h-full object-cover" alt="Thumb" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Video className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            )}
                            <input
                              required
                              type="text"
                              value={type === 'images' ? formData.caption : formData.title}
                              onChange={(e) => setFormData({ ...formData, [type === 'images' ? 'caption' : 'title']: e.target.value })}
                              placeholder={type === 'images' ? "Add a descriptive caption..." : "Enter a catchy title..."}
                              className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all self-center"
                            />
                          </div>
                        </div>

                        {(type === 'videos' || type === 'need') && userRole === 'founder' && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Funding Target (Signal)</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-mono text-xs">$</span>
                              <input
                                type="number"
                                value={formData.funding_goal}
                                onChange={(e) => setFormData({ ...formData, funding_goal: e.target.value })}
                                placeholder="E.g. 500000"
                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 pl-8 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all"
                              />
                            </div>
                            <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest px-1">Neural capital solicitation for node scaling.</p>
                          </div>
                        )}

                        {type === 'thesis' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Investor Name</label>
                                <input
                                  type="text"
                                  value={formData.investor_name}
                                  onChange={(e) => setFormData({ ...formData, investor_name: e.target.value })}
                                  placeholder="Your Name"
                                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Firm Name</label>
                                <input
                                  type="text"
                                  value={formData.firm_name}
                                  onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                                  placeholder="Venture Capital Firm"
                                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Min Check Size</label>
                                <input
                                  type="text"
                                  value={formData.min_check}
                                  onChange={(e) => setFormData({ ...formData, min_check: e.target.value })}
                                  placeholder="e.g. 100k"
                                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Max Check Size</label>
                                <input
                                  type="text"
                                  value={formData.max_check}
                                  onChange={(e) => setFormData({ ...formData, max_check: e.target.value })}
                                  placeholder="e.g. 5M"
                                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Focus Industries</label>
                              <input
                                type="text"
                                value={formData.focus_industries}
                                onChange={(e) => setFormData({ ...formData, focus_industries: e.target.value })}
                                placeholder="SaaS, AI, Fintech (comma separated)"
                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all"
                              />
                            </div>
                          </div>
                        )}

                        {type === 'documents' && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Category Protocol</label>
                            <div className="grid grid-cols-2 gap-4">
                              {['pdf', 'docx', 'pptx', 'xlsx'].map((fmt) => (
                                <button
                                  key={fmt}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, fileType: fmt })}
                                  className={`p-4 rounded-xl border font-black uppercase text-[10px] tracking-widest transition-all ${
                                    formData.fileType === fmt 
                                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                                      : 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/10'
                                  }`}
                                >
                                  {fmt} Format
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-3xl">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Pitch-Check System</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">By confirming, you agree that this {type.slice(0, -1)} will be visible to the PITCHTUBE network. All data is securely stored on Pitch-Net.</p>
                        </div>
                      </>
                    )}

                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => setStep('source')}
                        className="p-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-all"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => handleUpload()}
                        disabled={loading}
                        className="flex-1 bg-white text-black font-black uppercase text-xs tracking-widest py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Finalize Upload <ChevronRight className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 'cloud-picker' && (
                  <motion.div
                    key="cloud-picker"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                          selectedProvider === 'drive' ? 'bg-blue-500/10 text-blue-500' :
                          selectedProvider === 'dropbox' ? 'bg-sky-500/10 text-sky-500' :
                          selectedProvider === 'instagram' ? 'bg-pink-500/10 text-pink-500' :
                          'bg-blue-600/10 text-blue-600'
                        }`}>
                          {selectedProvider === 'drive' && <Cloud className="w-5 h-5" />}
                          {selectedProvider === 'dropbox' && <Globe className="w-5 h-5" />}
                          {selectedProvider === 'instagram' && <Camera className="w-5 h-5" />}
                          {selectedProvider === 'linkedin' && <Linkedin className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-widest text-white">Select Transmission</h4>
                          <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.2em]">{selectedProvider} Repository // Access Granted</p>
                        </div>
                      </div>
                      <button 
                         onClick={() => setStep('source')}
                         className="px-4 py-2 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5"
                      >
                        Reset Source
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                       {selectedProvider && (MOCK_CLOUD_FILES as any)[selectedProvider].map((file: any, idx: number) => (
                         <button 
                           key={idx}
                           onClick={() => selectCloudFile(file)}
                           className="w-full p-4 bg-zinc-900/30 border border-white/5 rounded-2xl hover:border-orange-500/50 hover:bg-zinc-900/50 transition-all flex items-center justify-between group"
                         >
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 group-hover:border-orange-500/20">
                                  <Video className="w-4 h-4 text-zinc-500 group-hover:text-orange-500" />
                               </div>
                               <div className="text-left">
                                  <p className="text-xs font-bold text-white mb-0.5">{file.name}</p>
                                  <div className="flex gap-3">
                                    <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">{file.size}</span>
                                    <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">{file.date}</span>
                                  </div>
                               </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-orange-500 transition-colors" />
                         </button>
                       ))}
                    </div>

                    <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Globe className="w-4 h-4 text-orange-500" />
                      </div>
                      <p className="text-[9px] font-bold text-orange-200/50 uppercase leading-relaxed tracking-wider">
                        Files are streamed directly via secure uplink. No data is cached on secondary nodes.
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === 'uploading' && (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 flex flex-col items-center text-center"
                  >
                    <div className="relative mb-12">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-orange-500/10 border border-orange-500/20 flex items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.1)]">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-2 border-2 border-dashed border-orange-500/20 rounded-full"
                        />
                        {isWatermarking ? (
                          <div className="relative flex flex-col items-center gap-1">
                            <Scissors className="w-10 h-10 text-orange-500 animate-bounce" />
                            <span className="text-[8px] font-black text-orange-500/50 uppercase tracking-widest animate-pulse">Encoding</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                             <Upload className={`w-10 h-10 text-orange-500 ${uploadRetryCount > 0 ? 'animate-pulse' : 'animate-bounce'}`} />
                             {files.length > 1 && (
                               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                 File {currentUploadingIndex + 1} / {files.length}
                               </span>
                             )}
                          </div>
                        )}
                      </div>
                      
                      <div className="absolute -bottom-4 inset-x-0 flex flex-col items-center gap-2">
                        <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${
                          uploadRetryCount > 0 
                            ? 'bg-red-500/20 border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                            : 'bg-orange-500 border-white/10 text-white shadow-lg'
                        }`}>
                          {uploadRetryCount > 0 
                            ? `RETRYING ATTEMPT ${uploadRetryCount}/3 ${retryCountdown > 0 ? `IN ${retryCountdown}S` : '(RESUMING...)'}` 
                            : `${Math.round(uploadProgress)}% UPLINKED`}
                        </div>
                        
                        {uploadRetryCount > 0 && retryCountdown > 0 && (
                          <button 
                            onClick={() => setRetryCountdown(0)}
                            className="text-[8px] font-black text-orange-500 hover:text-orange-400 uppercase tracking-widest animate-pulse"
                          >
                            Force Manual Reconnect
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 max-w-sm">
                      <h4 className="text-xl font-black uppercase italic tracking-tighter text-white">
                        {isWatermarking ? "Regulatory Watermarking" : 
                         uploadRetryCount > 0 ? "Transient Node Recovery" : 
                         files.length > 1 ? `Broadcasting Batch (${currentUploadingIndex + 1}/${files.length})` :
                         "Broadcasting to Neural Net"}
                      </h4>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] leading-relaxed">
                        {isWatermarking ? "Injecting [PITCH-ID: AIS-X7R4] into transport stream..." :
                         uploadRetryCount > 0 ? "Packet synchronization failed. Re-establishing secure node bridge..." :
                         files.length > 1 ? `Synchronizing file ${currentUploadingIndex + 1} with regional backbone...` :
                         "Your vision is being fragmented and distributed across the PitchTube backbone."}
                      </p>
                      
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mt-8 border border-white/5 relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${uploadProgress}%`,
                            backgroundColor: uploadRetryCount > 0 ? '#ef4444' : '#f97316'
                          }}
                          className={`h-full transition-colors duration-500 ${uploadRetryCount > 0 ? 'shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'shadow-[0_0_15px_rgba(249,115,22,0.5)]'}`}
                        />
                        {uploadRetryCount > 0 && (
                          <motion.div 
                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="absolute inset-0 bg-red-500/10"
                          />
                        )}
                      </div>

                      <div className="flex items-center justify-between font-mono text-[8px] text-zinc-600 uppercase tracking-widest mt-6 pt-6 border-t border-white/5">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-zinc-800">Status Protocol</span>
                          <span className={uploadRetryCount > 0 ? 'text-red-500' : isWatermarking ? 'text-orange-300' : 'text-orange-500'}>
                            {uploadRetryCount > 0 ? 'FALLBACK_RECOVERY' : isWatermarking ? 'SECURE_STAMPING' : 'ACTIVE_BROADCAST'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-right">
                          <span className="text-zinc-800">Uplink Zone</span>
                          <span className="text-white/80">AIS-STATION-01</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-24 text-center space-y-8"
                  >
                    <div className="w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-3xl font-black uppercase italic tracking-tight">Deployment Success</h4>
                      <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">ID: {Math.random().toString(36).substr(2, 9)} // NODE: {userId.slice(0, 4)}</p>
                    </div>
                    <button 
                      onClick={closeAndReset}
                      className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-600/20"
                    >
                      Return to Feed
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

