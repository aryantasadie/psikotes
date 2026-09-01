'use client';
import React from 'react';

interface UnansweredModalProps {
  isOpen: boolean;
  unansweredList: number[]; // Array of 1-based question numbers
  onSelectQuestion?: (questionNumber: number) => void;
  onClose: () => void;
  testTitle?: string;
}

export default function UnansweredModal({
  isOpen,
  unansweredList,
  onSelectQuestion,
  onClose,
  testTitle
}: UnansweredModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '"Inter", system-ui, sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          border: '2px solid #EF4444',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            background: '#FEE2E2',
            color: '#DC2626',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 16px',
            border: '2px solid #FECACA'
          }}
        >
          📝
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
          Soal Belum Lengkap Terisi!
        </h2>

        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: '0 0 20px' }}>
          {testTitle ? <strong>{testTitle}: </strong> : ''}
          Terdapat <strong style={{ color: '#DC2626' }}>{unansweredList.length} nomor soal</strong> yang belum Anda jawab. Silakan lengkapi seluruh soal sebelum mengumpulkan.
        </p>

        {/* List of unanswered question numbers */}
        <div style={{ flex: '1 1 auto', overflowY: 'auto', marginBottom: '24px', padding: '4px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Klik nomor di bawah untuk langsung menuju soal:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {unansweredList.map(num => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (onSelectQuestion) {
                    onSelectQuestion(num);
                  }
                  onClose();
                }}
                style={{
                  minWidth: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#FEF2F2',
                  border: '1.5px solid #FCA5A5',
                  color: '#B91C1C',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 10px',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#DC2626';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#FEF2F2';
                  e.currentTarget.style.color = '#B91C1C';
                }}
              >
                No. {num}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            transition: 'all 0.15s ease'
          }}
        >
          Lengkapi Jawaban (Kembali ke Soal)
        </button>
      </div>
    </div>
  );
}
