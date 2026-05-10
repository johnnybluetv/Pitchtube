import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, increment, serverTimestamp, collection, addDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { notifyTransactionSuccess } from '../services/emailService';
import { getDoc } from 'firebase/firestore';

export interface Transaction {
  id: string;
  userId: string;
  targetUserId?: string;
  amount: number;
  type: 'purchase' | 'gift' | 'withdrawal';
  method: 'system' | 'bitcoin' | 'paypal' | 'bank';
  status: 'pending' | 'completed' | 'failed';
  createdAt: any;
}

export interface Wallet {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }

    const walletRef = doc(db, 'wallets', user.uid);
    const unsubscribe = onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        setWallet(docSnap.data() as Wallet);
      } else {
        // Initialize wallet if it doesn't exist
        setDoc(walletRef, {
          userId: user.uid,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          updatedAt: serverTimestamp()
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const purchaseCoins = async (amount: number) => {
    if (!user) return;
    
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          userId: user.uid,
        }),
      });

      const session = await response.json();

      if (session.url) {
        // Direct redirect to Stripe Checkout
        window.location.href = session.url;
      } else {
        throw new Error(session.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Payment initiation failed:", error);
      throw error;
    }
  };

  const sendGift = async (targetUserId: string, amount: number) => {
    if (!user || !wallet || wallet.balance < amount) throw new Error("Insufficient neural credits");

    const senderWalletRef = doc(db, 'wallets', user.uid);
    const receiverWalletRef = doc(db, 'wallets', targetUserId);
    const transactionRef = doc(collection(db, 'transactions'));

    try {
      await runTransaction(db, async (transaction) => {
        // Update sender
        transaction.update(senderWalletRef, {
          balance: increment(-amount),
          totalSpent: increment(amount),
          updatedAt: serverTimestamp()
        });

        // Update receiver (create if not exists)
        transaction.set(receiverWalletRef, {
          balance: increment(amount),
          totalEarned: increment(amount),
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Create transaction record
        transaction.set(transactionRef, {
          id: transactionRef.id,
          userId: user.uid,
          targetUserId,
          amount,
          type: 'gift',
          method: 'system',
          status: 'completed',
          createdAt: serverTimestamp()
        });
      });

      // Notify receiver of the gift
      try {
        const receiverSnap = await getDoc(doc(db, 'users', targetUserId));
        if (receiverSnap.exists()) {
          const receiverData = receiverSnap.data();
          if (receiverData?.notificationSettings?.emailTransactions !== false) {
             await notifyTransactionSuccess(
               amount,
               receiverData.email
             );
          }
        }
      } catch (notifyErr) {
        console.error("Failed to send transaction notification:", notifyErr);
      }

      return true;
    } catch (error) {
      console.error("Gift transmission failed:", error);
      throw error;
    }
  };

  const withdraw = async (amount: number, method: 'bitcoin' | 'paypal' | 'bank', details: any) => {
    if (!user || !wallet || wallet.balance < amount) throw new Error("Insufficient funds for withdrawal");

    const walletRef = doc(db, 'wallets', user.uid);
    
    await updateDoc(walletRef, {
      balance: increment(-amount),
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'transactions'), {
      userId: user.uid,
      amount,
      type: 'withdrawal',
      method,
      status: 'pending',
      metadata: details,
      createdAt: serverTimestamp()
    });
  };

  return { wallet, loading, purchaseCoins, sendGift, withdraw };
}
