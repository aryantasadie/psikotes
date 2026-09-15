'use client';
import React, { useEffect, useState } from 'react';

interface TestTimerProps {
  durationSeconds: number;
  onTimeUp?: () => void;
  autoSubmit?: boolean;
  isActive?: boolean;
  testName?: string;
}

export default function TestTimer({
  durationSeconds,
  onTimeUp,
  autoSubmit = true,
  isActive = true,
  testName
}: TestTimerProps) {
  const timerStorageKey = testName
    ? `test_timer_left_${testName.toLowerCase().replace(/[\s\-_]+/g, '')}`
    : null;

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window !== 'undefined' && timerStorageKey) {
      const saved = localStorage.getItem(timerStorageKey);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= durationSeconds) {
          return parsed;
        }
      }
    }
    return durationSeconds;
  });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (timerStorageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(timerStorageKey);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= durationSeconds) {
          setTimeLeft(parsed);
          setIsExpired(false);
          return;
        }
      }
    }
    setTimeLeft(durationSeconds);
    setIsExpired(false);
  }, [durationSeconds, timerStorageKey]);

  useEffect(() => {
    if (!isActive) return;

    if (timeLeft <= 0) {
      if (!isExpired) {
        setIsExpired(true);
        if (timerStorageKey && typeof window !== 'undefined') {
          localStorage.removeItem(timerStorageKey);
        }
        if (autoSubmit && onTimeUp) {
          onTimeUp();
        }
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (timerStorageKey && typeof window !== 'undefined') {
          if (next > 0) {
            localStorage.setItem(timerStorageKey, String(next));
          } else {
            localStorage.removeItem(timerStorageKey);
          }
        }
        if (next <= 0) {
          clearInterval(interval);
          if (!isExpired) {
            setIsExpired(true);
            if (autoSubmit && onTimeUp) {
              onTimeUp();
            }
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft, isExpired, autoSubmit, onTimeUp, timerStorageKey]);

  // Timer runs silently in background (UI hidden per requirement)
  return null;
}

