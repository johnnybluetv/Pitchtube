import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export type InteractionType = 'view' | 'save';
export type ItemType = 'pitch' | 'intrestor';

export async function trackInteraction(
  userId: string, 
  itemId: string, 
  type: InteractionType, 
  itemType: ItemType
) {
  if (!userId || !itemId) return;

  try {
    // For 'save', we might want to check if it already exists to toggle it
    if (type === 'save') {
      const q = query(
        collection(db, 'user_interactions'),
        where('userId', '==', userId),
        where('itemId', '==', itemId),
        where('type', '==', 'save')
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // If it exists, delete it (unsave)
        const docToDelete = snapshot.docs[0];
        await deleteDoc(docToDelete.ref);
        return false; // Unsaved
      }
    } else if (type === 'view') {
      // For views, maybe we only want to count unique views per session?
      // For now, let's just record it.
    }

    await addDoc(collection(db, 'user_interactions'), {
      userId,
      itemId,
      type,
      itemType,
      timestamp: serverTimestamp()
    });
    return true; // Saved or viewed
  } catch (error) {
    console.error('Error tracking interaction:', error);
    return null;
  }
}
