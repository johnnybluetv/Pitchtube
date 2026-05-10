import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Send, X, MessageSquare, Loader2, User, StopCircle } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

interface Comment {
  id: string;
  itemId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  userRole: string;
  content: string;
  parentId?: string; // Threading support
  voiceUrl?: string;
  imageUrl?: string;
  gifUrl?: string;
  createdAt: any;
  reactions?: {
    endorse: number;
    counter: number;
  };
}

interface CommentSectionProps {
  itemId: string;
  onClose?: () => void;
  standalone?: boolean;
}

import { Mic, Image as ImageIcon, Gift, Play, Pause } from 'lucide-react';

import { triggerEffect } from '../shared/StarEffect';

export function CommentSection({ itemId, onClose, standalone }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null); // State for replying
  const [loading, setLoading] = useState(true);
  const [issubmitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedGif, setAttachedGif] = useState<string | null>(null);
  const [attachedVoice, setAttachedVoice] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const { user, profile } = useAuth();

  const MOCK_GIFS = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJieHkzM2R4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHgmZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/3o7TKSjPkbKInICSEU/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJieHkzM2R4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHgmZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/l0HlMGoxSi9R8K9Tq/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJieHkzM2R4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHgmZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/xT9IgzoKnwFNmISR8I/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJieHkzM2R4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHgmZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/3o7TKMGpxPvc79DpqM/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJieHkzM2R4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHgmZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/l4FGpPki5v2705coo/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJieHkzM2R4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHgmZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/3o7TKVUn7iM8FMEU24/giphy.gif'
  ];

  const [gifSearch, setGifSearch] = useState('');
  const filteredGifs = MOCK_GIFS; // Simplified for now since URLs don't have tags

  const [attachedVoiceBlob, setAttachedVoiceBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('itemId', '==', itemId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(docs);
      setLoading(false);
    }, (error) => {
      console.error("Comments subscription error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [itemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && !attachedVoice && !attachedImage && !attachedGif) return;
    if (!auth.currentUser) return;

    setSubmitting(true);
    try {
      let voiceUrl = attachedVoice;
      
      await addDoc(collection(db, 'comments'), {
        itemId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Venture User',
        userPhoto: auth.currentUser.photoURL || '',
        userRole: profile?.role || 'member',
        content: newComment.trim(),
        parentId: replyTo?.id || null, // Link to parent if replying
        voiceUrl,
        imageUrl: attachedImage,
        gifUrl: attachedGif,
        createdAt: serverTimestamp(),
        reactions: { endorse: 0, counter: 0 }
      });
      triggerEffect('shooting-star', 10);
      setNewComment('');
      setReplyTo(null); // Clear reply state
      setAttachedVoice(null);
      setAttachedVoiceBlob(null);
      setAttachedImage(null);
      setAttachedGif(null);
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const startVoiceRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAttachedVoiceBlob(blob);
        const url = URL.createObjectURL(blob);
        setAttachedVoice(url);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access failed:", err);
    }
  };

  const stopVoiceRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Recursive component to render threaded comments
  const CommentItem: React.FC<{ comment: Comment; depth?: number }> = ({ comment, depth = 0 }) => {
    const replies = comments.filter(c => c.parentId === comment.id);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const isOwner = auth.currentUser?.uid === comment.userId;

    const handleUpdate = async () => {
      if (!editedContent.trim()) return;
      try {
        await updateDoc(doc(db, 'comments', comment.id), {
          content: editedContent.trim(),
          updatedAt: serverTimestamp()
        });
        setIsEditing(false);
      } catch (err) {
        console.error("Update failed:", err);
      }
    };

    const handleReaction = async (type: 'endorse' | 'counter') => {
      try {
        await updateDoc(doc(db, 'comments', comment.id), {
          [`reactions.${type}`]: increment(1)
        });
        triggerEffect('shooting-star', 5);
      } catch (err) {
        console.error("Reaction failed:", err);
      }
    };
    
    return (
      <div className={`space-y-4 ${depth > 0 ? 'ml-6 border-l border-white/5 pl-4' : ''}`}>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <Link to={`/profile/${comment.userId}`} className="rounded-lg bg-zinc-900 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center hover:border-orange-500/50 transition-all cursor-pointer group/avatar">
            <div className={`w-full h-full flex items-center justify-center ${depth > 0 ? 'w-6 h-6' : 'w-8 h-8'}`}>
              {comment.userPhoto ? (
                <img src={comment.userPhoto} alt={comment.userName} className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110" />
              ) : (
                <User className={depth > 0 ? 'w-3 h-3 text-zinc-700' : 'w-4 h-4 text-zinc-700'} />
              )}
            </div>
          </Link>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${comment.userId}`} className="text-[10px] font-black text-white/90 uppercase tracking-tight hover:text-orange-500 transition-colors cursor-pointer">
                  {comment.userName}
                </Link>
                {comment.userRole && (
                  <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md border ${
                    comment.userRole === 'admin' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
                    comment.userRole === 'founder' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-500'
                  }`}>
                    {comment.userRole}
                  </span>
                )}
                {isOwner && (
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-[8px] font-bold text-orange-500/50 hover:text-orange-500 uppercase tracking-tighter transition-colors"
                  >
                    [EDIT_MODE]
                  </button>
                )}
              </div>
              <span className="text-[8px] font-mono text-zinc-600 uppercase">
                {comment.createdAt?.toDate() ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(comment.createdAt.toDate()) : 'Recent'}
              </span>
            </div>
            
            {isEditing ? (
              <div className="space-y-2 mt-2">
                <textarea 
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full bg-zinc-900 border border-orange-500/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/60 font-medium resize-none h-20"
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 bg-zinc-800 rounded-lg text-[8px] font-black uppercase text-zinc-500 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdate}
                    className="px-3 py-1 bg-orange-500 rounded-lg text-[8px] font-black uppercase text-white hover:bg-orange-400 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                {comment.content && (
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                    {comment.content}
                  </p>
                )}
              </>
            )}

            {comment.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-white/10">
                <img src={comment.imageUrl} alt="Attached" className="w-full h-auto" />
              </div>
            )}

            {comment.gifUrl && (
              <div className="rounded-xl overflow-hidden border border-white/10">
                <img src={comment.gifUrl} alt="GIF" className="w-full h-auto" />
              </div>
            )}

            {comment.voiceUrl && (
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                <button className="p-1.5 bg-orange-500 rounded-lg text-white">
                  <Play className="w-3 h-3 fill-current" />
                </button>
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-orange-500" />
                </div>
                <span className="text-[8px] font-mono text-zinc-500 italic uppercase">VOICE_MEMO</span>
              </div>
            )}

            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => handleReaction('endorse')}
                className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-emerald-500 transition-all group/btn"
              >
                <span className="group-hover/btn:scale-110 transition-transform">ENDORSE</span>
                <span className="text-[10px] text-emerald-500/50">{comment.reactions?.endorse || 0}</span>
                <div className="w-1 h-1 rounded-full bg-zinc-800 group-hover/btn:bg-emerald-500" />
              </button>
              <button 
                onClick={() => setReplyTo(comment)}
                className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-orange-500 transition-all group/btn"
              >
                <span className="group-hover/btn:scale-110 transition-transform">REPLY</span>
                <div className="w-1 h-1 rounded-full bg-zinc-800 group-hover/btn:bg-orange-500" />
              </button>
              <button 
                onClick={() => handleReaction('counter')}
                className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-500 transition-all group/btn"
              >
                <span className="group-hover/btn:scale-110 transition-transform">COUNTER</span>
                <span className="text-[10px] text-red-500/50">{comment.reactions?.counter || 0}</span>
                <div className="w-1 h-1 rounded-full bg-zinc-800 group-hover/btn:bg-red-500" />
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Render nested replies */}
        <div className="space-y-4">
          {replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  };

  if (standalone) {
    return (
      <div className="flex flex-col h-full bg-transparent">
        <div className="flex-1 overflow-y-auto p-0 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <div className="w-20 h-2 bg-zinc-900 rounded" />
                      <div className="w-12 h-2 bg-zinc-900 rounded" />
                    </div>
                    <div className="w-full h-3 bg-zinc-900 rounded" />
                    <div className="w-2/3 h-3 bg-zinc-900 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <MessageSquare className="w-6 h-6 text-zinc-700" />
              </div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">No boardroom insights yet.</p>
            </div>
          ) : (
            comments.filter(c => !c.parentId).map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Post boardroom intel..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pr-12 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 transition-all resize-none h-24 font-medium"
            />
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <button
                type="submit"
                disabled={issubmitting || (!newComment.trim() && !attachedVoice && !attachedImage && !attachedGif)}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-50"
              >
                {issubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      className="absolute inset-y-0 right-0 w-80 bg-zinc-950/95 backdrop-blur-2xl border-l border-white/10 z-[150] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)]"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-orange-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-white">Boardroom Intel</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <div className="w-20 h-2 bg-zinc-900 rounded" />
                    <div className="w-12 h-2 bg-zinc-900 rounded" />
                  </div>
                  <div className="w-full h-3 bg-zinc-900 rounded" />
                  <div className="w-2/3 h-3 bg-zinc-900 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <MessageSquare className="w-6 h-6 text-zinc-700" />
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">No strategic insights broadcasted yet.</p>
            <p className="text-[8px] text-zinc-700 mt-2 uppercase tracking-widest italic">Secure the perimeter and initiate first analysis.</p>
          </div>
        ) : (
          comments.filter(c => !c.parentId).map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>

      <div className="p-4 bg-zinc-900/80 border-t border-white/5 space-y-3">
        {/* Reply Indicator */}
        <AnimatePresence>
          {replyTo && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-between bg-orange-500/10 border-l-2 border-orange-500 px-3 py-2 rounded-r-xl mb-2"
            >
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Replying to {replyTo.userName}</span>
                <p className="text-[10px] text-zinc-400 truncate max-w-[200px] italic">"{replyTo.content}"</p>
              </div>
              <button 
                onClick={() => setReplyTo(null)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-zinc-500" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment Previews */}
        <AnimatePresence>
          {(attachedImage || attachedGif || attachedVoice) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex gap-2 mb-2 overflow-x-auto pb-1"
            >
              {attachedImage && (
                <div className="relative w-20 h-20 rounded-lg border border-orange-500/50 overflow-hidden shrink-0">
                  <img src={attachedImage} className="w-full h-full object-cover" />
                  <button onClick={() => setAttachedImage(null)} className="absolute top-1 right-1 p-1 bg-black/80 rounded-full"><X className="w-2 h-2 text-white" /></button>
                </div>
              )}
              {attachedGif && (
                <div className="relative w-20 h-20 rounded-lg border border-blue-500/50 overflow-hidden shrink-0">
                  <img src={attachedGif} className="w-full h-full object-cover" />
                  <button onClick={() => setAttachedGif(null)} className="absolute top-1 right-1 p-1 bg-black/80 rounded-full"><X className="w-2 h-2 text-white" /></button>
                </div>
              )}
              {attachedVoice && (
                <div className="relative w-32 h-10 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center px-3 gap-2 shrink-0">
                   <div className="flex-1 flex gap-0.5">
                      {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="flex-1 h-2 bg-orange-500/50 rounded-full" />)}
                   </div>
                   <button onClick={() => setAttachedVoice(null)} className="p-1 bg-black/80 rounded-full"><X className="w-2 h-2 text-white" /></button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Broadcast strategic insight..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pr-12 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all resize-none h-24 font-medium"
          />
          
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button
              type="submit"
              disabled={issubmitting || (!newComment.trim() && !attachedVoice && !attachedImage && !attachedGif)}
              className="p-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-orange-950/20"
            >
              {issubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
             <button 
               type="button" 
               onClick={isRecording ? stopVoiceRecord : startVoiceRecord}
               className={`p-2 rounded-xl border transition-all ${isRecording ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white'}`}
               title="Voice Broadcast"
             >
               {isRecording ? (
                 <div className="flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                   <StopCircle className="w-4 h-4" />
                 </div>
               ) : <Mic className="w-4 h-4" />}
             </button>
             
             <label className="p-2 bg-white/5 border border-white/5 rounded-xl text-zinc-500 hover:text-white transition-all cursor-pointer">
                <ImageIcon className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
             </label>

             <div className="relative">
               <button 
                 type="button" 
                 onClick={() => setShowGifPicker(!showGifPicker)}
                 className={`p-2 rounded-xl border transition-all ${showGifPicker ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white'}`}
               >
                 <Gift className="w-4 h-4" />
               </button>

               <AnimatePresence>
                 {showGifPicker && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 10 }}
                     className="absolute bottom-full left-0 mb-3 w-48 bg-zinc-950 border border-white/10 rounded-2xl p-2 grid grid-cols-2 gap-2 shadow-2xl z-[160]"
                   >
                     {MOCK_GIFS.map((gif, idx) => (
                       <button 
                        key={idx} 
                        type="button"
                        onClick={() => { setAttachedGif(gif); setShowGifPicker(false); }}
                        className="aspect-square rounded-lg overflow-hidden border border-white/5 hover:border-orange-500 transition-colors"
                       >
                         <img src={gif} className="w-full h-full object-cover" />
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>

             <div className="flex-1" />
             <span className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest hidden sm:block">Boardroom Encrypted Uplink</span>
          </div>
        </form>
        <p className="text-[7px] font-mono text-zinc-800 mt-4 text-center uppercase tracking-[0.4em]">Node ID: VR-042 // Integrity: SECURE // Latency: 4ms</p>
      </div>
    </motion.div>
  );
}
