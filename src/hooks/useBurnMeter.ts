import { useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export const useBurnMeter = (pitchId: string, initialBurns: number) => {
  const [burns, setBurns] = useState(initialBurns);
  const [isBurning, setIsBurning] = useState(false);

  const triggerBurn = async () => {
    setIsBurning(true);
    
    // Optimistic UI Update
    setBurns(prev => prev + 1);

    try {
      // In a real app, this would be a Supabase RPC call
      // const { error } = await supabase.rpc('increment_burn_count', { pitch_row_id: pitchId });
      // if (error) throw error;
      
      // For demo, we just simulate the success
      console.log(`Burned pitch: ${pitchId}`);
    } catch (err) {
      console.error("Burn failed:", err);
      setBurns(prev => prev - 1); // Rollback on error
    } finally {
      setTimeout(() => setIsBurning(false), 500); // Animation duration
    }
  };

  return { burns, triggerBurn, isBurning };
};
