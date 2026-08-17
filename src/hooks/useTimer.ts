import { useState, useEffect } from 'react';

export const useTimer = (startTime: number, endTime: number, pausedAt?: number) => {
  const calculateRemaining = () => {
    const now = pausedAt || Date.now();
    return Math.max(0, endTime - now);
  };

  const [remainingTime, setRemainingTime] = useState(calculateRemaining());

  useEffect(() => {
    setRemainingTime(calculateRemaining());
    
    if (pausedAt) return; // Don't run interval if paused

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingTime(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, pausedAt]);

  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isFinished = remainingTime <= 0;

  return { remainingTime, formattedTime, isFinished };
};
