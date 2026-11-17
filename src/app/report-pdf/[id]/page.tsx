'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  DEFAULT_PRESET_MAPPING,
  ASPECT_DESCRIPTIONS,
  calculateComputerScores,
  resolveFinalAspectScore,
  resolveTargetScore,
  getPapiNorm,
  getPapiNumericNorm,
  checkAnswerMatch
} from '@/lib/psychographScoring';
import PsychographPrintableDocument from '@/components/PsychographPrintableDocument';

export { DEFAULT_PRESET_MAPPING, checkAnswerMatch, getPapiNorm, getPapiNumericNorm };

export default function ReportPdfPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const id = params.id as string;
  const [participant, setParticipant] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/?callbackUrl=/report-pdf/${id}`);
    } else if (session?.user) {
      const userRole = (session.user as any)?.role;
      if (!['superadmin', 'psikolog', 'client'].includes(userRole)) {
        router.replace('/');
      }
    }
  }, [session, status, router, id]);

  useEffect(() => {
    fetch(`/api/superadmin/reports/${id}`)
      .then(res => res.json())
      .then(data => setParticipant(data));
  }, [id]);

  if (!participant) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Memuat dokumen cetak...</div>;

  const candidateName = participant.user?.name || '-';
  const candidatePosition = participant.test?.title?.split('-')[0]?.trim() || participant.jobPosition?.name || participant.test?.jobPosition?.name || '-';

  return (
    <div className="report-wrapper" style={{ background: '#F1F5F9', minHeight: '100vh', padding: '24px 16px', fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif' }}>
      
      {/* Top Action Toolbar (No-Print) */}
      <div className="no-print" style={{ background: '#0F172A', padding: '14px 24px', borderRadius: '10px', marginBottom: '16px', maxWidth: '920px', margin: '0 auto 16px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', color: 'white', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '15px', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Laporan Hasil Evaluasi Psikologis
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
            {candidateName} &bull; {candidatePosition} &bull; Format Standar HVS (2 Halaman)
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a 
            href={`/api/superadmin/reports/${id}/export-docx`}
            download={`Laporan_Psikotes_${candidateName.replace(/\s+/g, '_')}.docx`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: '#1D4ED8', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #3B82F6', transition: 'all 0.2s' }}
          >
            Unduh Word (.docx)
          </a>
          <button 
            onClick={() => window.print()} 
            style={{ background: '#059669', color: 'white', padding: '8px 16px', border: '1px solid #10B981', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(5,150,105,0.3)' }}
          >
            Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Tips Cetak Banner (No-Print) */}
      <div className="no-print" style={{ maxWidth: '920px', margin: '-8px auto 16px auto', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', fontSize: '12px', color: '#1E40AF', gap: '8px' }}>
        <span>
          <strong>Panduan Cetak PDF:</strong> Pilih <em>Tujuan: Simpan sebagai PDF</em> dan pastikan centang <strong>"Grafik latar belakang" (Background graphics)</strong> agar warna target dan skor tercetak tajam.
        </span>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 210mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-wrapper {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }
          .no-print, .page-divider {
            display: none !important;
          }
          .a4-page {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 10mm 14mm 8mm 14mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .a4-page:first-of-type {
            page-break-after: always !important;
            break-after: page !important;
          }
          .a4-page:last-of-type {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }

        @media screen {
          .a4-page {
            background: white;
            width: 210mm;
            min-height: 297mm;
            height: 297mm;
            margin: 0 auto;
            box-shadow: 0 4px 25px rgba(0,0,0,0.1);
            padding: 10mm 14mm 8mm 14mm;
            box-sizing: border-box;
            color: #1E293B;
            position: relative;
            border-radius: 3px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .page-divider {
            max-width: 210mm;
            margin: 16px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            font-size: 11px;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .page-divider::before, .page-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #CBD5E1;
          }
        }
      `}} />

      {/* Page 1 Badge */}
      <div className="page-divider no-print">
        <span>Halaman 1 dari 2 &bull; Psikogram & Standar Kompetensi</span>
      </div>

      {/* Shared Unified Printable Psychograph Document */}
      <PsychographPrintableDocument participant={participant} />

    </div>
  );
}
