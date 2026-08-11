'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// Helper Norm Functions
const getTiki6Norm = (r: number) => {
  if (r <= 21) return 0; if (r <= 25) return 1; if (r <= 28) return 2; if (r <= 32) return 3;
  if (r <= 36) return 4; if (r <= 40) return 5; if (r <= 44) return 6; if (r <= 47) return 7;
  if (r <= 51) return 8; if (r <= 53) return 9; if (r <= 56) return 10; if (r <= 58) return 11;
  if (r <= 60) return 12; if (r <= 62) return 13; if (r <= 64) return 14; if (r <= 65) return 15;
  if (r <= 67) return 16; if (r <= 69) return 17; if (r <= 71) return 18; if (r <= 72) return 19;
  if (r <= 73) return 20; if (r <= 78) return 21; if (r <= 85) return 22; if (r <= 90) return 23;
  if (r <= 95) return 24; if (r <= 98) return 25; if (r === 99) return 27; return 29;
};

const getTikiClassification = (s: number) => {
  if (s <= 6) return { label: 'KS', full: 'Kurang Sekali' };
  if (s <= 12) return { label: 'K', full: 'Kurang' };
  if (s <= 18) return { label: 'S', full: 'Sedang' };
  if (s <= 24) return { label: 'B', full: 'Baik' };
  return { label: 'BS', full: 'Baik Sekali' };
};

const getWPTIQ = (r: number) => {
  const map = [59,59,61,64,67,69,71,73,75,78,80,81,83,86,88,90,93,95,97,98,100,102,104,106,108,111,113,114,116,118,120,121,123,125,126,128,130,132,134,136,138,140,142,143];
  if (r >= 44) return 146;
  return map[r] ?? 59;
};

const getISTClassification = (testType: string, r: number) => {
  const ksm = { label: 'KS-' };
  const ksp = { label: 'KS+' };
  const km  = { label: 'K-' };
  const kp  = { label: 'K+' };
  const sm  = { label: 'S-' };
  const sp  = { label: 'S+' };
  const bm  = { label: 'B-' };
  const bp  = { label: 'B+' };
  const bsm = { label: 'BS-' };
  const bsp = { label: 'BS+' };

  if (testType === 'IST 2' || testType === 'IST 7') {
    if (r <= 1) return ksm; if (r <= 3) return ksp; if (r <= 5) return km; if (r <= 7) return kp;
    if (r <= 9) return sm; if (r <= 11) return sp; if (r <= 13) return bm; if (r <= 15) return bp;
    if (r <= 17) return bsm; return bsp;
  } else if (testType === 'IST 3') {
    if (r <= 2) return ksm; if (r <= 4) return ksp; if (r <= 6) return km; if (r <= 8) return kp;
    if (r <= 11) return sm; if (r <= 14) return sp; if (r <= 16) return bm; if (r <= 18) return bp;
    if (r <= 19) return bsm; return bsp;
  } else if (testType === 'IST 6') {
    if (r <= 1) return ksm; if (r <= 3) return ksp; if (r <= 5) return km; if (r <= 7) return kp;
    if (r <= 9) return sm; if (r <= 12) return sp; if (r <= 14) return bm; if (r <= 16) return bp;
    if (r <= 18) return bsm; return bsp;
  }
  return sm;
};

export default function ReportPdfPage() {
  const params = useParams();
  const id = params.id as string;
  const [participant, setParticipant] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/superadmin/reports/${id}`)
      .then(res => res.json())
      .then(data => setParticipant(data));
  }, [id]);

  const computerScores = React.useMemo(() => {
    const scores: Record<string, number> = {};
    if (!participant || !participant.answers) return scores;

    const calculateWptScale = () => {
      const wptAnswers = participant.answers.filter((a: any) => 
        a.question && (a.question.testType === 'WPT' || a.question.testType === 'WPT_AGE')
      );
      if (wptAnswers.length === 0) return null;

      let wptCorrect = 0;
      wptAnswers.forEach((ans: any) => {
        if (!ans.question || !ans.question.correct) return;
        const normAns = String(ans.selectedOption || '').trim().replace(/,/g, '.').toLowerCase();
        const normKey = String(ans.question.correct || '').trim().replace(/,/g, '.').toLowerCase();
        if (normAns === normKey) wptCorrect++;
      });

      const iq = getWPTIQ(wptCorrect);
      if (iq <= 79) return 1;
      else if (iq <= 89) return 2;
      else if (iq <= 109) return 3;
      else if (iq <= 119) return 4;
      else return 5;
    };

    const calculateIstScale = (subtest: string) => {
      const istAnswers = participant.answers.filter((a: any) => 
        a.question && a.question.testType === subtest
      );
      if (istAnswers.length === 0) return null;

      let correct = 0;
      istAnswers.forEach((ans: any) => {
        if (!ans.question || !ans.question.correct) return;
        const normAns = String(ans.selectedOption || '').trim().toLowerCase();
        const normKey = String(ans.question.correct || '').trim().toLowerCase();
        if (normAns === normKey) correct++;
      });

      const cls = getISTClassification(subtest, correct);
      if (cls.label.startsWith('KS')) return 1;
      if (cls.label.startsWith('K')) return 2;
      if (cls.label.startsWith('S') || cls.label.startsWith('C')) return 3;
      if (cls.label.startsWith('B') && !cls.label.startsWith('BS')) return 4;
      if (cls.label.startsWith('BS')) return 5;
      return 3;
    };

    const calculateTikiScale = (subtest: string) => {
      const tikiAnswers = participant.answers.filter((a: any) => 
        a.question && a.question.testType === subtest
      );
      if (tikiAnswers.length === 0) return null;

      let correct = 0;
      tikiAnswers.forEach((ans: any) => {
        if (!ans.question || !ans.question.correct) return;
        const normAns = String(ans.selectedOption || '').trim().toLowerCase();
        const normKey = String(ans.question.correct || '').trim().toLowerCase();
        if (normAns === normKey) correct++;
      });

      let stdScore = correct;
      if (subtest === 'TIKI 6') stdScore = getTiki6Norm(correct);

      const cls = getTikiClassification(stdScore);
      if (cls.label === 'KS') return 1;
      if (cls.label === 'K') return 2;
      if (cls.label === 'S' || cls.label === 'C') return 3;
      if (cls.label === 'B') return 4;
      if (cls.label === 'BS') return 5;
      return 3;
    };

    const wptVal = calculateWptScale();
    const ist2Val = calculateIstScale('IST 2');
    const ist3Val = calculateIstScale('IST 3');
    const ist6Val = calculateIstScale('IST 6');
    const ist7Val = calculateIstScale('IST 7');
    const tiki6Val = calculateTikiScale('TIKI 6');

    const cogScale = wptVal ?? tiki6Val ?? ist3Val ?? 3;
    const verbalScale = ist2Val ?? wptVal ?? 3;
    const logicScale = ist3Val ?? wptVal ?? 3;
    const abstractScale = ist6Val ?? tiki6Val ?? wptVal ?? 3;
    const numericScale = ist7Val ?? wptVal ?? 3;

    scores['IQ / Kapasitas Intelektual'] = cogScale;
    scores['Inteligensi Umum'] = cogScale;
    scores['Kemampuan Kognitif'] = cogScale;
    scores['Daya Analisa'] = logicScale;
    scores['Logika Berpikir'] = logicScale;
    scores['Daya Abstraksi'] = abstractScale;
    scores['Pemahaman Verbal'] = verbalScale;
    scores['Kemampuan Numerik'] = numericScale;
    scores['Problem Solving'] = cogScale;
    scores['Daya Tangkap'] = cogScale;

    const powerAnswers = participant.answers.filter((a: any) => 
      a.question && (a.question.testType === 'POWER' || a.question.testType === 'POWER LEADER')
    );
    if (powerAnswers.length > 0) {
      let pScale = 4;
      if (powerAnswers.length >= 40) pScale = 4;
      scores['Kepemimpinan'] = pScale;
      scores['Daya Pimpin'] = pScale;
      scores['Pengambilan Keputusan'] = pScale;
      scores['Motivasi Kerja'] = pScale;
    }

    if (participant.normResults) {
      participant.normResults.forEach((curr: any) => {
        scores[curr.parameter] = curr.score;
      });
    }

    return scores;
  }, [participant]);

  if (!participant) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat dokumen cetak...</div>;

  const jobPosition = participant.test?.jobPosition || participant.jobPosition;
  const psychoResults = participant.psychoResults || {};
  let dinamika = { intelegensi: '', kepribadian: '', sikapKerja: '', kepemimpinan: '', kesimpulan: '' };
  if (psychoResults.dinamika) {
    try { dinamika = JSON.parse(psychoResults.dinamika); } catch(e){}
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

  let mapping = [];
  if (jobPosition?.psychographPreset?.mapping) {
    try { mapping = JSON.parse(jobPosition.psychographPreset.mapping); } catch(e){}
  }
  if (!mapping || mapping.length === 0) {
    mapping = [{
      category: "Aspek Psikologis",
      aspects: grayAreas.map((ga: any) => ({ name: ga.parameter, checked: true }))
    }];
  }

  const grayAreasMap = grayAreas.reduce((acc: any, ga: any) => {
    acc[ga.parameter] = ga.targetScore;
    return acc;
  }, {});

  const descriptions: Record<string, string> = {
    "Inteligensi Umum": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
    "Daya Analisa": "Mampu mengolah dan mengidentifikasi topik-topik serta keterkaitan dari informasi-informasi tersebut; menghubungkan & membandingkan data-data dari berbagai sumber, mengidentifikasi hubungan sebab akibat.",
    "Logika Berpikir": "Kemampuan untuk berpikir runtut, terarah, praktis dan logis dengan penalaran yang masuk akal",
    "Daya Abstraksi": "Kemampuan untuk menelaah persoalan dari beberapa sudut pandang, memprediksi dan kemampuan berpikir antisipatif",
    "Problem Solving": "Kemampuan untuk membuat keputusan terhadap suatu permasalahan, dengan mempertimbangkan efektivitas dari alternatif solusi yang dibuat",
    "Stabilitas Emosi": "Kemampuan untuk mengendalikan diri, bersikap tenang dalam situasi tegang, tidak mudah terpengaruh oleh situasi.",
    "Kepekaan": "Mampu memahami perasaan orang lain, dan mampu menempatkan diri pada situasi yang dihadapi orang lain (berempati)",
    "Kepercayaan Diri": "Yakin pada kemampuan dirinya, bisa bersikap tegas, asertif",
    "Sosiabilitas": "Memiliki minat dan perhatian terhadap orang lain, mampu menciptakan impresi yang baik dalam situasi sosial, bisa menjalin hubungan dgn berbagai tipe orang",
  };

  return (
    <div style={{ background: '#E2E8F0', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Print Trigger & Warning */}
      <div className="no-print" style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '20px', maxWidth: '900px', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ color: '#0F172A', fontWeight: 600 }}>Tampilan cetak PDF siap. Pastikan opsi "Background graphics" diaktifkan pada pengaturan cetak.</div>
        <button onClick={() => window.print()} style={{ background: '#2563EB', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Cetak ke PDF</button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html { margin: 0; padding: 0; background: white !important; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          @page { size: A4; margin: 15mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        .a4-page {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          padding: 20mm;
          box-sizing: border-box;
          color: #1E293B;
        }
      `}} />

      {/* Page 1 */}
      <div className="a4-page">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0F172A', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', textTransform: 'uppercase' }}>LAPORAN HASIL EVALUASI PSIKOLOGIS</h1>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em' }}>HR PUBLIK ASSESSMENT CENTER & CONSULTING</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '13px' }}>
            <div style={{ color: '#64748B' }}>Posisi: <span style={{ color: '#0F172A', fontWeight: 700 }}>{participant.test?.title?.split('-')[0]?.trim() || jobPosition?.name || '-'}</span></div>
            <div style={{ color: '#64748B' }}>Nama Peserta: <span style={{ color: '#0F172A', fontWeight: 700 }}>{participant.user?.name || '-'}</span></div>
          </div>
        </div>

        {/* Psychograph Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', lineHeight: '1.4' }}>
          <thead>
            <tr style={{ borderTop: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1' }}>
              <th style={{ padding: '8px', textAlign: 'left', width: '25%', fontWeight: 700 }}>DIMENSI</th>
              <th style={{ padding: '8px', textAlign: 'left', width: '45%', fontWeight: 700 }}>DESKRIPSI</th>
              <th style={{ padding: '8px', textAlign: 'center', width: '6%', fontWeight: 700 }}>KS</th>
              <th style={{ padding: '8px', textAlign: 'center', width: '6%', fontWeight: 700 }}>K</th>
              <th style={{ padding: '8px', textAlign: 'center', width: '6%', fontWeight: 700 }}>C</th>
              <th style={{ padding: '8px', textAlign: 'center', width: '6%', fontWeight: 700 }}>B</th>
              <th style={{ padding: '8px', textAlign: 'center', width: '6%', fontWeight: 700 }}>BS</th>
            </tr>
          </thead>
          <tbody>
            {mapping.map((cat: any, cIdx: number) => {
              const activeAsps = cat.aspects ? cat.aspects.filter((a: any) => a.checked) : [];
              if (activeAsps.length === 0) return null;

              return (
                <React.Fragment key={cIdx}>
                  <tr style={{ background: '#F1F5F9' }}>
                    <td colSpan={7} style={{ padding: '8px', fontWeight: 800, color: '#1E293B' }}>
                      {cat.category.toUpperCase()}
                    </td>
                  </tr>
                  {activeAsps.map((asp: any, aIdx: number) => {
                    const aspectName = asp.name;
                    const targetScore = grayAreasMap[aspectName] || 3;
                    const compScore = computerScores[aspectName] || 3;
                    const finalScore = modifiedScores[aspectName] !== undefined ? modifiedScores[aspectName] : compScore;
                    const isLast = aIdx === activeAsps.length - 1;

                    return (
                      <tr key={aspectName} style={{ borderBottom: isLast ? '1px solid #CBD5E1' : '1px dotted #E2E8F0' }}>
                        <td style={{ padding: '8px', fontWeight: 700, color: '#334155', verticalAlign: 'top' }}>{aspectName}</td>
                        <td style={{ padding: '8px', color: '#64748B', verticalAlign: 'top', paddingRight: '16px' }}>{descriptions[aspectName] || '-'}</td>
                        {[1, 2, 3, 4, 5].map(score => {
                          const isTarget = score === targetScore;
                          const isPlot = finalScore === score;
                          return (
                            <td key={score} style={{ padding: '0', textAlign: 'center', verticalAlign: 'middle', background: isTarget ? '#F1F5F9' : 'transparent', borderLeft: '1px solid #F1F5F9', borderRight: '1px solid #F1F5F9' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                {isPlot ? (
                                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0D9488', boxShadow: '0 0 0 3px #CCFBF1' }}></div>
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
      </div>

      <div className="page-break"></div>

      {/* Page 2 */}
      <div className="a4-page" style={{ marginTop: '20px' }}>
        
        {/* Rekomendasi Box */}
        <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '12px', color: '#1E293B' }}>REKOMENDASI :</div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: psychoResults.recommendation === 'DISARANKAN' ? '#047857' : '#94A3B8', fontWeight: psychoResults.recommendation === 'DISARANKAN' ? 700 : 500 }}>
              <div style={{ width: '16px', height: '16px', background: psychoResults.recommendation === 'DISARANKAN' ? '#047857' : '#F1F5F9', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '10px' }}>✓</div>
              DISARANKAN
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: psychoResults.recommendation === 'DIPERTIMBANGKAN' ? '#D97706' : '#94A3B8', fontWeight: psychoResults.recommendation === 'DIPERTIMBANGKAN' ? 700 : 500 }}>
              <div style={{ width: '16px', height: '16px', background: psychoResults.recommendation === 'DIPERTIMBANGKAN' ? '#D97706' : '#F1F5F9', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '10px' }}>✓</div>
              DIPERTIMBANGKAN
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: psychoResults.recommendation === 'TIDAK DISARANKAN' ? '#B91C1C' : '#94A3B8', fontWeight: psychoResults.recommendation === 'TIDAK DISARANKAN' ? 700 : 500 }}>
              <div style={{ width: '16px', height: '16px', background: psychoResults.recommendation === 'TIDAK DISARANKAN' ? '#B91C1C' : '#F1F5F9', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '10px' }}>✓</div>
              TIDAK DISARANKAN
            </div>
          </div>
        </div>

        {/* Dinamika Box */}
        <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '16px', color: '#1E293B' }}>DINAMIKA PSIKOLOGIS :</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
            <li><span style={{ fontWeight: 700, color: '#0F172A' }}>&bull; Intelegensi:</span> {dinamika.intelegensi || '-'}</li>
            <li><span style={{ fontWeight: 700, color: '#0F172A' }}>&bull; Kepribadian & Potensi Relasi:</span> {dinamika.kepribadian || '-'}</li>
            <li><span style={{ fontWeight: 700, color: '#0F172A' }}>&bull; Pola - Sikap Kerja:</span> {dinamika.sikapKerja || '-'}</li>
            <li><span style={{ fontWeight: 700, color: '#0F172A' }}>&bull; Kepemimpinan:</span> {dinamika.kepemimpinan || '-'}</li>
            <li><span style={{ fontWeight: 700, color: '#0F172A' }}>&bull; Kesimpulan:</span> {dinamika.kesimpulan || '-'}</li>
          </ul>
        </div>

        {/* Kelebihan Kelemahan */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
          <div style={{ flex: 1, border: '1px solid #A7F3D0', borderRadius: '8px', padding: '16px', background: '#F0FDF4' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '8px', color: '#047857' }}>KELEBIHAN :</div>
            <div style={{ fontSize: '13px', color: '#1E293B', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
              {psychoResults.kelebihan || '-'}
            </div>
          </div>
          <div style={{ flex: 1, border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', background: '#FEF2F2' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '8px', color: '#B91C1C' }}>KELEMAHAN :</div>
            <div style={{ fontSize: '13px', color: '#1E293B', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
              {psychoResults.kelemahan || '-'}
            </div>
          </div>
        </div>

        {/* Signature Area */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
          <div style={{ textAlign: 'center', width: '250px' }}>
            <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>Semarang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '80px' }}>Psikolog Pemeriksa,</div>
            <div style={{ borderBottom: '1px solid #0F172A', paddingBottom: '4px', marginBottom: '4px', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
              (Nama Psikolog)
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>No. SIPP: -</div>
          </div>
        </div>

      </div>
    </div>
  );
}
