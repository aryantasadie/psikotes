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
    let initialLeft = durationSeconds;
    if (timerStorageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(timerStorageKey);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= durationSeconds) {
          initialLeft = parsed;
        }
      }
    }
    setTimeLeft(initialLeft);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cbt_active_timer_left', String(initialLeft));
      if (testName) localStorage.setItem('cbt_active_test', testName);
    }
    setIsExpired(false);
  }, [durationSeconds, timerStorageKey, testName]);

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
      // Freeze countdown if test is paused or stopped by proctor
      if (typeof window !== 'undefined') {
        const isPaused = Boolean((window as any).__CBT_IS_PAUSED__);
        const isStopped = Boolean((window as any).__CBT_IS_STOPPED__);
        if (isPaused || isStopped) {
          return;
        }
      }

      setTimeLeft(prev => {
        const next = prev - 1;
        if (timerStorageKey && typeof window !== 'undefined') {
          if (next > 0) {
            localStorage.setItem(timerStorageKey, String(next));
            localStorage.setItem('cbt_active_timer_left', String(next));
            if (testName) localStorage.setItem('cbt_active_test', testName);
          } else {
            localStorage.removeItem(timerStorageKey);
            localStorage.removeItem('cbt_active_timer_left');
            localStorage.removeItem('cbt_active_test');
          }
        }
        if (next <= 0) {
          clearInterval(interval);
          if (!isExpired) {
            setIsExpired(true);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('cbt_active_timer_left');
              localStorage.removeItem('cbt_active_test');
            }
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
  }, [isActive, timeLeft, isExpired, autoSubmit, onTimeUp, timerStorageKey, testName]);

  // Timer runs silently in background (UI hidden per requirement)
  return null;
}
