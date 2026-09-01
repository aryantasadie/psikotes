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
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    setTimeLeft(durationSeconds);
    setIsExpired(false);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isActive) return;

    if (timeLeft <= 0) {
      if (!isExpired) {
        setIsExpired(true);
        if (autoSubmit && onTimeUp) {
          onTimeUp();
        }
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!isExpired) {
            setIsExpired(true);
            if (autoSubmit && onTimeUp) {
              onTimeUp();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft, isExpired, autoSubmit, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLowTime = timeLeft <= 60 && timeLeft > 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 9999,
        background: isExpired
          ? '#FEF2F2'
          : isLowTime
          ? '#FFFBEB'
          : '#FFFFFF',
        color: isExpired
          ? '#DC2626'
          : isLowTime
          ? '#D97706'
          : '#0F172A',
        border: isExpired
          ? '2px solid #EF4444'
          : isLowTime
          ? '2px solid #F59E0B'
          : '2px solid #CBD5E1',
        borderRadius: '16px',
        padding: '10px 18px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: '"Inter", system-ui, sans-serif',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ fontSize: '20px' }}>
        {isExpired ? '⚠️' : isLowTime ? '⏳' : '⏱️'}
      </div>
      <div>
        <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
          {testName ? `${testName} • ` : ''}
          {isExpired ? (autoSubmit ? 'Waktu Habis!' : 'Waktu Habis (Wajib Selesai)') : 'Sisa Waktu'}
        </div>
        <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
          {timeFormatted}
        </div>
      </div>
    </div>
  );
}
