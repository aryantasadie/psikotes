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
      if (!['superadmin', 'psikolog'].includes(userRole)) {
        router.replace('/');
      }
    }
  }, [session, status, router, id]);

  useEffect(() => {
    fetch(`/api/superadmin/reports/${id}`)
      .then(res => res.json())
      .then(data => setParticipant(data));
  }, [id]);

  const computerScores = React.useMemo(() => {
    return calculateComputerScores(participant);
  }, [participant]);

  if (!participant) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Memuat dokumen cetak...</div>;

  const jobPosition = participant.test?.jobPosition || participant.jobPosition;
  const psychoResults = participant.psychoResults || {};
  let dinamika: {
    intelegensi: string;
    kepribadian: string;
    sikapKerja: string;
    kepemimpinan: string;
    kesimpulan: string;
    psychologistName?: string;
    psychologistSipp?: string;
    signatureUrl?: string;
  } = { 
    intelegensi: '', 
    kepribadian: '', 
    sikapKerja: '', 
    kepemimpinan: '', 
    kesimpulan: '',
    psychologistName: '',
    psychologistSipp: '',
    signatureUrl: ''
  };
  if (psychoResults.dinamika) {
    try {
      const parsed = JSON.parse(psychoResults.dinamika);
      dinamika = { ...dinamika, ...parsed };
    } catch(e){}
  }
  let modifiedScores: Record<string, number> = {};
  if (psychoResults.modifiedScores) {
    try { modifiedScores = JSON.parse(psychoResults.modifiedScores); } catch(e){}
  }

  const defaultAspectList = [
    "Inteligensi Umum", "Daya Analisa", "Logika Berpikir", "Daya Abstraksi", "Problem Solving",
    "Stabilitas Emosi", "Kepekaan", "Kepercayaan Diri", "Sosiabilitas", "Kerjasama",
    "Motivasi Kerja", "Ketelitian", "Daya Tahan Kerja", "Kepemimpinan", "Daya Pimpin",
    "Pengambilan Keputusan", "Kemampuan Kognitif", "Pemahaman Verbal", "Kemampuan Numerik", "Daya Tangkap"
  ];

  let grayAreas = jobPosition?.grayAreas || [];
  if (grayAreas.length === 0) {
    grayAreas = defaultAspectList.map(name => ({ parameter: name, targetScore: 3 }));
  }

  const preset = jobPosition?.psychographPreset || participant.test?.psychographPreset;
  let mapping = [];
  if (preset?.mapping) {
    try { mapping = JSON.parse(preset.mapping); } catch(e){}
  }
  if (!Array.isArray(mapping) || mapping.length === 0) {
    mapping = DEFAULT_PRESET_MAPPING;
  }

  const grayAreasMap = grayAreas.reduce((acc: any, ga: any) => {
    acc[ga.parameter] = ga.targetScore;
    return acc;
  }, {});

  const descriptions: Record<string, string> = {
    "Inteligensi Umum": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
    "Daya Analisa": "Mampu mengolah dan mengidentifikasi topik-topik serta keterkaitan dari informasi-informasi tersebut; menghubungkan & membandingkan data-data dari berbagai sumber, mengidentifikasi hubungan sebab akibat.",
    "Logika Berpikir": "Kemampuan untuk berpikir runtut, terarah, praktis dan logis dengan penalaran yang masuk akal.",
    "Daya Abstraksi": "Kemampuan untuk menelaah persoalan dari beberapa sudut pandang, memprediksi dan berpikir antisipatif.",
    "Problem Solving": "Kemampuan untuk membuat keputusan terhadap suatu permasalahan dengan mempertimbangkan alternatif solusi.",
    "Stabilitas Emosi": "Kemampuan untuk mengendalikan diri, bersikap tenang dalam situasi tegang, tidak mudah terpengaruh emosi.",
    "Kepekaan": "Mampu memahami perasaan orang lain, dan mampu menempatkan diri pada situasi yang dihadapi orang lain (berempati).",
    "Kepercayaan Diri": "Yakin pada kapasitas dirinya, bisa bersikap tegas, asertif dan mandiri.",
    "Sosiabilitas": "Memiliki minat dan perhatian terhadap orang lain, mampu menciptakan relasi positif dalam berbagai situasi.",
    "Orientasi Berprestasi": "Dorongan kuat untuk mencapai standar keunggulan, target kerja yang tinggi dan hasil kerja optimal.",
    "Daya Juang": "Kegigihan dan persistensi dalam menyelesaikan tugas meski menghadapi rintangan.",
    "Kedetailan": "Kecermatan dalam menangani detail pekerjaan secara terstruktur dan teratur.",
    "Sistematika Kerja": "Kemampuan merencanakan, mengorganisasi, dan menyelesaikan tugas secara teratur dan metodis.",
    "Kecepatan Kerja": "Tempo penyelesaian pekerjaan secara tepat waktu dengan efisiensi tinggi.",
    "Ketelitian Kerja": "Akurasi tinggi dan minim kesalahan dalam menyelesaikan tugas operasional.",
    "Daya Tahan Stress": "Kemampuan mempertahankan performa kerja yang optimal di bawah tekanan atau beban kerja tinggi.",
    "Kepemimpinan": "Kapasitas mengarahkan, mempengaruhi, dan menggerakkan orang lain menuju pencapaian tujuan bersama.",
    "Inisiatif": "Tindakan proaktif untuk mengambil peluang atau menyelesaikan masalah tanpa harus selalu diarahkan.",
    "Tanggung Jawab": "Komitmen penuh terhadap tugas, wewenang, dan integritas kerja.",
    "Kerjasama": "Kemampuan bersinergi dan berkontribusi secara konstruktif dalam tim kerja.",
    "Pengambilan Keputusan": "Ketegasan dalam menentukan pilihan dan solusi terbaik secara efektif dan bertanggung jawab."
  };

  const candidateName = participant.user?.name || '-';
  const candidatePosition = participant.test?.title?.split('-')[0]?.trim() || jobPosition?.name || '-';
  const rawTestDate = participant.startTime 
    || (participant.answers && participant.answers.find((a: any) => a.answeredAt)?.answeredAt)
    || (participant.logs && participant.logs.find((l: any) => l.createdAt)?.createdAt)
    || participant.endTime
    || participant.test?.startDate 
    || participant.user?.createdAt;
  const testDate = rawTestDate ? new Date(rawTestDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
  const recommendation = psychoResults.recommendation || 'DIPERTIMBANGKAN';

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

      {/* Page 1: Kop, Biodata & Psychogram Table */}
      <div className="a4-page">
        {/* Header / Kop Surat Resmi */}
        <div style={{ paddingBottom: '4px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/logo.png" alt="HR Publik Logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} onError={(e) => { (e.target as any).style.display = 'none'; }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  HR PUBLIK CONSULTING & ASSESSMENT CENTER
                </div>
                <div style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>
                  Lembaga Layanan Psikologi Terapan & Evaluasi Potensi SDM
                </div>
                <div style={{ fontSize: '8px', color: '#64748B', marginTop: '1px' }}>
                  Assessment Center &bull; Rekrutmen & Seleksi &bull; Konsultasi Pengembangan SDM
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', border: '1px solid #94A3B8', background: '#F8FAFC', padding: '2px 8px', fontSize: '8.5px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#334155', borderRadius: '3px' }}>
                CONFIDENTIAL
              </div>
              <div style={{ fontSize: '8px', color: '#64748B', marginTop: '3px' }}>
                Ref: HRP/EVA/{participant.id?.toString().padStart(4, '0')}/{new Date().getFullYear()}
              </div>
            </div>
          </div>

          {/* Garis Ganda Kop Surat Resmi */}
          <div style={{ marginTop: '6px', borderBottom: '1.5px solid #0F172A' }}></div>
          <div style={{ marginTop: '1.5px', borderBottom: '0.5px solid #94A3B8' }}></div>
        </div>

        {/* Document Title */}
        <div style={{ textAlign: 'center', margin: '4px 0 6px 0' }}>
          <h1 style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            LAPORAN HASIL EVALUASI PSIKOLOGIS
          </h1>
          <div style={{ fontSize: '8.5px', color: '#475569', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '1px' }}>
            INDIVIDUAL PSYCHOLOGICAL DIAGNOSTIC & COMPETENCY MATRIX
          </div>
        </div>

        {/* Candidate Information Table (Tabel Biodata Resmi) */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '9px', border: '1px solid #CBD5E1' }}>
          <tbody>
            <tr>
              <td style={{ width: '17%', padding: '3px 8px', background: '#F8FAFC', fontWeight: 700, color: '#475569', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1' }}>
                Nama Lengkap
              </td>
              <td style={{ width: '33%', padding: '3px 8px', fontWeight: 800, color: '#0F172A', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1' }}>
                {candidateName}
              </td>
              <td style={{ width: '18%', padding: '3px 8px', background: '#F8FAFC', fontWeight: 700, color: '#475569', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1' }}>
                Posisi / Jabatan
              </td>
              <td style={{ width: '32%', padding: '3px 8px', fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #CBD5E1' }}>
                {candidatePosition}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '3px 8px', background: '#F8FAFC', fontWeight: 700, color: '#475569', borderRight: '1px solid #CBD5E1' }}>
                Tanggal Evaluasi
              </td>
              <td style={{ padding: '3px 8px', color: '#0F172A', fontWeight: 600, borderRight: '1px solid #CBD5E1' }}>
                {testDate}
              </td>
              <td style={{ padding: '3px 8px', background: '#F8FAFC', fontWeight: 700, color: '#475569', borderRight: '1px solid #CBD5E1' }}>
                Status Laporan
              </td>
              <td style={{ padding: '3px 8px', color: '#0F172A', fontWeight: 700 }}>
                {psychoResults.status === 'RELEASED' ? 'RELEASED (RESMI / FINAL)' : 'CONFIDENTIAL REVIEW (INTERNAL)'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Psychogram Matrix Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', lineHeight: '1.2', border: '1px solid #0F172A', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: '#1E293B', color: 'white' }}>
              <th style={{ padding: '5px 6px', textAlign: 'left', width: '27%', fontWeight: 800, border: '1px solid #1E293B', fontSize: '9px' }}>ASPEK & DIMENSI</th>
              <th style={{ padding: '5px 6px', textAlign: 'left', width: '43%', fontWeight: 800, border: '1px solid #1E293B', fontSize: '9px' }}>DEFINISI OPERASIONAL</th>
              <th style={{ padding: '5px 2px', textAlign: 'center', width: '6%', fontWeight: 800, border: '1px solid #334155', fontSize: '8.5px', whiteSpace: 'nowrap' }}>KS&nbsp;(1)</th>
              <th style={{ padding: '5px 2px', textAlign: 'center', width: '6%', fontWeight: 800, border: '1px solid #334155', fontSize: '8.5px', whiteSpace: 'nowrap' }}>K&nbsp;(2)</th>
              <th style={{ padding: '5px 2px', textAlign: 'center', width: '6%', fontWeight: 800, border: '1px solid #334155', fontSize: '8.5px', whiteSpace: 'nowrap' }}>C&nbsp;(3)</th>
              <th style={{ padding: '5px 2px', textAlign: 'center', width: '6%', fontWeight: 800, border: '1px solid #334155', fontSize: '8.5px', whiteSpace: 'nowrap' }}>B&nbsp;(4)</th>
              <th style={{ padding: '5px 2px', textAlign: 'center', width: '6%', fontWeight: 800, border: '1px solid #334155', fontSize: '8.5px', whiteSpace: 'nowrap' }}>BS&nbsp;(5)</th>
            </tr>
          </thead>
          <tbody>
            {mapping.map((cat: any, cIdx: number) => {
              const activeAsps = cat.aspects ? cat.aspects.filter((a: any) => a.checked) : [];
              if (activeAsps.length === 0) return null;

              return (
                <React.Fragment key={cIdx}>
                  <tr style={{ background: '#F1F5F9', borderTop: '1px solid #0F172A', borderBottom: '1px solid #94A3B8' }}>
                    <td colSpan={7} style={{ padding: '4px 6px', fontWeight: 800, color: '#0F172A', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {cat.category}
                    </td>
                  </tr>
                  {activeAsps.map((asp: any, aIdx: number) => {
                    const aspectName = asp.name;
                    const targetScore = resolveTargetScore(aspectName, grayAreasMap, 3);
                    const finalScore = resolveFinalAspectScore(aspectName, modifiedScores, computerScores, 3);
                    const isLast = aIdx === activeAsps.length - 1;

                    return (
                      <tr key={aspectName} style={{ borderBottom: isLast ? '1px solid #94A3B8' : '1px solid #E2E8F0' }}>
                        <td style={{ padding: '3px 6px', fontWeight: 700, color: '#0F172A', verticalAlign: 'middle', borderRight: '1px solid #CBD5E1', fontSize: '9px' }}>
                          {aspectName}
                        </td>
                        <td style={{ padding: '3px 6px', color: '#475569', verticalAlign: 'middle', borderRight: '1px solid #CBD5E1', fontSize: '8px', lineHeight: '1.25' }}>
                          {asp.description || descriptions[aspectName] || ASPECT_DESCRIPTIONS[aspectName] || '-'}
                        </td>
                        {[1, 2, 3, 4, 5].map(score => {
                          const isTarget = score === targetScore;
                          const isPlot = finalScore === score;
                          return (
                            <td 
                              key={score} 
                              style={{ 
                                width: '6%',
                                padding: '0', 
                                textAlign: 'center', 
                                verticalAlign: 'middle', 
                                background: isTarget ? '#E2E8F0' : 'transparent', 
                                borderLeft: '1px solid #CBD5E1', 
                                borderRight: '1px solid #CBD5E1' 
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '18px' }}>
                                {isPlot ? (
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0F172A' }}></div>
                                ) : null}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* Legend */}
        <div style={{ marginTop: '8px', padding: '5px 8px', background: '#F8FAFC', border: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '9px', background: '#E2E8F0', border: '1px solid #94A3B8' }}></span>
              <strong style={{ color: '#334155' }}>Standar Profil Jabatan (Target)</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#0F172A' }}></span>
              <strong style={{ color: '#0F172A' }}>Skor Capaian Individu Peserta</strong>
            </span>
          </div>
          <div>
            <span>1: Kurang Sekali &bull; 2: Kurang &bull; 3: Cukup &bull; 4: Baik &bull; 5: Baik Sekali</span>
          </div>
        </div>
      </div>

      {/* Page 2 Badge */}
      <div className="page-divider no-print">
        <span>Halaman 2 dari 2 &bull; Kesimpulan, Dinamika & Pengesahan</span>
      </div>

      {/* Page 2: Rekomendasi, Dinamika, Kelebihan/Kelemahan & Tanda Tangan */}
      <div className="a4-page">
        
        {/* Page 2 Mini Header Resmi */}
        <div style={{ borderBottom: '1.5px solid #0F172A', paddingBottom: '5px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8.5px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <div>
            <strong style={{ color: '#0F172A' }}>HR PUBLIK ASSESSMENT CENTER</strong> &bull; Laporan Evaluasi Psikologis
          </div>
          <div>
            Kandidat: <strong style={{ color: '#0F172A' }}>{candidateName}</strong> &bull; Jabatan: <strong style={{ color: '#0F172A' }}>{candidatePosition}</strong>
          </div>
        </div>

        {/* 1. Rekomendasi Box (Clean Corporate Executive) */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0F172A', letterSpacing: '0.03em', marginBottom: '6px' }}>
            I. KESIMPULAN REKOMENDASI JABATAN
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {/* DISARANKAN */}
            <div style={{ 
              padding: '11px 10px', 
              borderRadius: '4px',
              border: recommendation === 'DISARANKAN' ? '1.5px solid #0F172A' : '1px solid #CBD5E1', 
              background: '#FFFFFF',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', fontWeight: recommendation === 'DISARANKAN' ? 800 : 600, color: recommendation === 'DISARANKAN' ? '#0F172A' : '#94A3B8' }}>
                {recommendation === 'DISARANKAN' ? '✔ DISARANKAN' : 'DISARANKAN'}
              </div>
              <div style={{ fontSize: '8.5px', color: recommendation === 'DISARANKAN' ? '#475569' : '#94A3B8', marginTop: '3px', lineHeight: '1.3' }}>
                Memenuhi seluruh kompetensi psikologis yang dipersyaratkan.
              </div>
            </div>

            {/* DIPERTIMBANGKAN */}
            <div style={{ 
              padding: '11px 10px', 
              borderRadius: '4px',
              border: recommendation === 'DIPERTIMBANGKAN' ? '1.5px solid #0F172A' : '1px solid #CBD5E1', 
              background: '#FFFFFF',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', fontWeight: recommendation === 'DIPERTIMBANGKAN' ? 800 : 600, color: recommendation === 'DIPERTIMBANGKAN' ? '#0F172A' : '#94A3B8' }}>
                {recommendation === 'DIPERTIMBANGKAN' ? '✔ DIPERTIMBANGKAN' : 'DIPERTIMBANGKAN'}
              </div>
              <div style={{ fontSize: '8.5px', color: recommendation === 'DIPERTIMBANGKAN' ? '#475569' : '#94A3B8', marginTop: '3px', lineHeight: '1.3' }}>
                Memenuhi kualifikasi dasar dengan beberapa catatan pengembangan.
              </div>
            </div>

            {/* TIDAK DISARANKAN */}
            <div style={{ 
              padding: '11px 10px', 
              borderRadius: '4px',
              border: recommendation === 'TIDAK DISARANKAN' ? '1.5px solid #0F172A' : '1px solid #CBD5E1', 
              background: '#FFFFFF',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', fontWeight: recommendation === 'TIDAK DISARANKAN' ? 800 : 600, color: recommendation === 'TIDAK DISARANKAN' ? '#0F172A' : '#94A3B8' }}>
                {recommendation === 'TIDAK DISARANKAN' ? '✔ TIDAK DISARANKAN' : 'TIDAK DISARANKAN'}
              </div>
              <div style={{ fontSize: '8.5px', color: recommendation === 'TIDAK DISARANKAN' ? '#475569' : '#94A3B8', marginTop: '3px', lineHeight: '1.3' }}>
                Belum memenuhi standar kompetensi minimal posisi jabatan.
              </div>
            </div>
          </div>
        </div>

        {/* 2. Dinamika Psikologis (Formal Diagnostic Evaluation) */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0F172A', letterSpacing: '0.03em', marginBottom: '6px' }}>
            II. DINAMIKA PSIKOLOGIS & DESKRIPSI KOMPETENSI
          </div>
          
          <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', padding: '11px 14px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '9px', color: '#1E293B', lineHeight: '1.45', textAlign: 'justify' }}>
            <div>
              <strong style={{ color: '#0F172A' }}>A. Kapasitas Inteligensi & Kemampuan Kognitif:</strong>{' '}
              <span>{dinamika.intelegensi || '-'}</span>
            </div>

            <div>
              <strong style={{ color: '#0F172A' }}>B. Dinamika Kepribadian & Relasi Sosial:</strong>{' '}
              <span>{dinamika.kepribadian || '-'}</span>
            </div>

            <div>
              <strong style={{ color: '#0F172A' }}>C. Sikap & Pola Kerja Operasional:</strong>{' '}
              <span>{dinamika.sikapKerja || '-'}</span>
            </div>

            <div>
              <strong style={{ color: '#0F172A' }}>D. Potensi Kepemimpinan & Pengambilan Keputusan:</strong>{' '}
              <span>{dinamika.kepemimpinan || '-'}</span>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '6px', marginTop: '2px' }}>
              <strong style={{ color: '#0F172A' }}>E. Kesimpulan Profil Keseluruhan:</strong>{' '}
              <span style={{ fontWeight: 600 }}>{dinamika.kesimpulan || '-'}</span>
            </div>
          </div>
        </div>

        {/* 3. Kelebihan & Kelemahan (Formal 2-Column Table) */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#0F172A', letterSpacing: '0.03em', marginBottom: '6px' }}>
            III. RINGKASAN KOMPETENSI (STRENGTHS & DEVELOPMENT AREAS)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ border: '1px solid #A7F3D0', borderTop: '3px solid #059669', background: '#F0FDF4', borderRadius: '4px', padding: '8px 12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#047857', letterSpacing: '0.02em', marginBottom: '4px' }}>
                POIN KEKUATAN UTAMA (KEY STRENGTHS)
              </div>
              <div style={{ fontSize: '8.5px', color: '#1E293B', whiteSpace: 'pre-line', lineHeight: '1.45' }}>
                {psychoResults.kelebihan || '-'}
              </div>
            </div>

            <div style={{ border: '1px solid #FED7AA', borderTop: '3px solid #D97706', background: '#FFFBEB', borderRadius: '4px', padding: '8px 12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#B45309', letterSpacing: '0.02em', marginBottom: '4px' }}>
                AREA PENGEMBANGAN (DEVELOPMENT AREAS)
              </div>
              <div style={{ fontSize: '8.5px', color: '#1E293B', whiteSpace: 'pre-line', lineHeight: '1.45' }}>
                {psychoResults.kelemahan || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Pengesahan & Tanda Tangan Psikolog Assessor */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '16px' }}>
          <div style={{ fontSize: '8px', color: '#64748B', maxWidth: '360px', lineHeight: '1.4' }}>
            <em>*Dokumen ini merupakan hasil evaluasi psikologis yang bersifat RAHASIA (CONFIDENTIAL). Interpretasi hasil asesmen hanya dapat dilakukan oleh Psikolog yang berwenang untuk tujuan seleksi dan penempatan SDM.</em>
          </div>

          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ fontSize: '9px', color: '#334155', marginBottom: '2px' }}>
              Semarang, {testDate !== '-' ? testDate : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
              Psikolog Pemeriksa / Assessor,
            </div>

            {/* Signature Slot */}
            <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px 0' }}>
              {dinamika.signatureUrl ? (
                <img 
                  src={dinamika.signatureUrl} 
                  alt="Tanda Tangan Digital" 
                  style={{ maxHeight: '54px', maxWidth: '160px', objectFit: 'contain' }} 
                />
              ) : (
                <div style={{ height: '50px' }}></div>
              )}
            </div>

            <div style={{ borderBottom: '1px solid #0F172A', paddingBottom: '1px', marginBottom: '2px', fontSize: '10.5px', fontWeight: 800, color: '#0F172A' }}>
              <u>{dinamika.psychologistName || '( Nama Lengkap Psikolog Pemeriksa )'}</u>
            </div>
            <div style={{ fontSize: '8.5px', color: '#475569', fontWeight: 600 }}>
              No. SIPP: {dinamika.psychologistSipp || '-'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
