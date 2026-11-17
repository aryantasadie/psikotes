'use client';

import React from 'react';
import {
  DEFAULT_PRESET_MAPPING,
  ASPECT_DESCRIPTIONS,
  calculateComputerScores,
  resolveFinalAspectScore,
  resolveTargetScore,
} from '@/lib/psychographScoring';

export interface PsychographPrintableDocumentProps {
  participant: any;
  modifiedScoresOverride?: Record<string, number>;
  dinamikaOverride?: {
    intelegensi?: string;
    kepribadian?: string;
    sikapKerja?: string;
    kepemimpinan?: string;
    kesimpulan?: string;
    psychologistName?: string;
    psychologistSipp?: string;
    signatureUrl?: string;
  };
  recommendationOverride?: string;
  kelebihanOverride?: string;
  kelemahanOverride?: string;
  psychologistNameOverride?: string;
  psychologistSippOverride?: string;
  signatureUrlOverride?: string;
  idPrefix?: string;
}

export default function PsychographPrintableDocument({
  participant,
  modifiedScoresOverride,
  dinamikaOverride,
  recommendationOverride,
  kelebihanOverride,
  kelemahanOverride,
  psychologistNameOverride,
  psychologistSippOverride,
  signatureUrlOverride,
  idPrefix = 'printable-psychograph',
}: PsychographPrintableDocumentProps) {
  if (!participant) return null;

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
    signatureUrl: '',
  };

  if (psychoResults.dinamika) {
    try {
      const parsed = typeof psychoResults.dinamika === 'string' ? JSON.parse(psychoResults.dinamika) : psychoResults.dinamika;
      dinamika = { ...dinamika, ...parsed };
    } catch (e) {}
  }

  // Apply overrides if provided
  if (dinamikaOverride) {
    dinamika = { ...dinamika, ...dinamikaOverride };
  }
  if (psychologistNameOverride !== undefined) dinamika.psychologistName = psychologistNameOverride;
  if (psychologistSippOverride !== undefined) dinamika.psychologistSipp = psychologistSippOverride;
  if (signatureUrlOverride !== undefined) dinamika.signatureUrl = signatureUrlOverride;

  let modifiedScores: Record<string, number> = {};
  if (psychoResults.modifiedScores) {
    try {
      modifiedScores = typeof psychoResults.modifiedScores === 'string' ? JSON.parse(psychoResults.modifiedScores) : psychoResults.modifiedScores;
    } catch (e) {}
  }
  if (modifiedScoresOverride) {
    modifiedScores = { ...modifiedScores, ...modifiedScoresOverride };
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
    try {
      mapping = typeof preset.mapping === 'string' ? JSON.parse(preset.mapping) : preset.mapping;
    } catch (e) {}
  }
  if (!Array.isArray(mapping) || mapping.length === 0) {
    mapping = DEFAULT_PRESET_MAPPING;
  }

  const grayAreasMap = grayAreas.reduce((acc: any, ga: any) => {
    acc[ga.parameter] = ga.targetScore;
    return acc;
  }, {});

  const descriptions: Record<string, string> = {
    ...ASPECT_DESCRIPTIONS,
    "Inteligensi Umum": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
    "Intelegensi umum": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
    "Intelegensi Umum": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
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

  const computerScores = calculateComputerScores(participant);

  const candidateName = participant.user?.name || '-';
  const candidatePosition = participant.test?.title?.split('-')[0]?.trim() || jobPosition?.name || '-';
  const rawTestDate = participant.startTime 
    || (participant.answers && participant.answers.find((a: any) => a.answeredAt)?.answeredAt)
    || (participant.logs && participant.logs.find((l: any) => l.createdAt)?.createdAt)
    || participant.endTime
    || participant.test?.startDate 
    || participant.user?.createdAt;
  const testDate = rawTestDate ? new Date(rawTestDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
  const recommendation = recommendationOverride || psychoResults.recommendation || 'DIPERTIMBANGKAN';
  const kelebihan = kelebihanOverride !== undefined ? kelebihanOverride : (psychoResults.kelebihan || '-');
  const kelemahan = kelemahanOverride !== undefined ? kelemahanOverride : (psychoResults.kelemahan || '-');

  return (
    <div className="printable-psychograph-root" style={{ width: '210mm', margin: '0 auto', background: '#FFFFFF', color: '#1E293B', fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif' }}>
      
      {/* ==================== HALAMAN 1: KOP, BIODATA & TABEL PSIKOGRAM ==================== */}
      <div 
        id={`${idPrefix}-page-1`}
        className="a4-page" 
        style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          height: '297mm', 
          maxHeight: '297mm',
          background: '#FFFFFF', 
          boxSizing: 'border-box', 
          padding: '10mm 14mm 8mm 14mm', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header / Kop Surat Resmi */}
        <div style={{ paddingBottom: '4px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src="/logo.png" 
                alt="HR Publik Logo" 
                style={{ height: '38px', width: 'auto', objectFit: 'contain' }} 
                onError={(e) => { (e.target as any).style.display = 'none'; }} 
              />
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

      {/* Page 2 Divider (Screen Only) */}
      <div className="page-divider no-print" style={{ margin: '16px 0' }}>
        <span>Halaman 2 dari 2 &bull; Kesimpulan, Dinamika & Pengesahan</span>
      </div>

      {/* ==================== HALAMAN 2: KESIMPULAN, DINAMIKA & PENGESAHAN ==================== */}
      <div 
        id={`${idPrefix}-page-2`}
        className="a4-page" 
        style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          height: '297mm', 
          maxHeight: '297mm',
          background: '#FFFFFF', 
          boxSizing: 'border-box', 
          padding: '10mm 14mm 8mm 14mm', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          position: 'relative'
        }}
      >
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
                {kelebihan}
              </div>
            </div>

            <div style={{ border: '1px solid #FED7AA', borderTop: '3px solid #D97706', background: '#FFFBEB', borderRadius: '4px', padding: '8px 12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#B45309', letterSpacing: '0.02em', marginBottom: '4px' }}>
                AREA PENGEMBANGAN (DEVELOPMENT AREAS)
              </div>
              <div style={{ fontSize: '8.5px', color: '#1E293B', whiteSpace: 'pre-line', lineHeight: '1.45' }}>
                {kelemahan}
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
