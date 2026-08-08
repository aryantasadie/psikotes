'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

type TraitCategory = {
  letter: string;
  name: string;
  description: string;
};

const PAPI_TRAITS: Record<string, TraitCategory> = {
  'G': { letter: 'G', name: 'Hard worker', description: 'Peran Pekerja Keras' },
  'L': { letter: 'L', name: 'Leadership role', description: 'Peran Kepemimpinan' },
  'I': { letter: 'I', name: 'Ease in decision making', description: 'Kemudahan Pengambilan Keputusan' },
  'T': { letter: 'T', name: 'Pace', description: 'Kecepatan / Tempo Kerja' },
  'V': { letter: 'V', name: 'Vigorous', description: 'Semangat Bergerak Fisik' },
  'S': { letter: 'S', name: 'Social extension', description: 'Perluasan Sosial' },
  'R': { letter: 'R', name: 'Theoretical type', description: 'Tipe Teoritis (Konseptual)' },
  'D': { letter: 'D', name: 'Interest in working with details', description: 'Minat pada Detail' },
  'C': { letter: 'C', name: 'Organized type', description: 'Keteraturan' },
  'E': { letter: 'E', name: 'Emotional restraint', description: 'Pengendalian Emosi' },
  'N': { letter: 'N', name: 'Need to finish task', description: 'Kebutuhan Menyelesaikan Tugas' },
  'A': { letter: 'A', name: 'Need to achieve', description: 'Kebutuhan Berprestasi' },
  'P': { letter: 'P', name: 'Need to control others', description: 'Kebutuhan Mengendalikan Orang Lain' },
  'X': { letter: 'X', name: 'Need to be noticed', description: 'Kebutuhan untuk Diperhatikan' },
  'B': { letter: 'B', name: 'Need to belong to groups', description: 'Kebutuhan Menjadi Bagian Kelompok' },
  'O': { letter: 'O', name: 'Need for closeness and affection', description: 'Kebutuhan Kedekatan & Kasih Sayang' },
  'Z': { letter: 'Z', name: 'Need for change', description: 'Kebutuhan akan Perubahan' },
  'K': { letter: 'K', name: 'Need to be forceful', description: 'Kebutuhan Bertindak Tegas / Agresif' },
  'F': { letter: 'F', name: 'Need to support authority', description: 'Kebutuhan Mendukung Otoritas' },
  'W': { letter: 'W', name: 'Need for rules and supervision', description: 'Kebutuhan akan Aturan & Pengawasan' }
};

export default function PapiResultPage() {
  const [scores, setScores] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('papiResult');
    if (saved) {
      setScores(JSON.parse(saved));
    }
  }, []);

  if (!scores) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Inter", sans-serif' }}>
        <h2>Belum ada data hasil tes PAPI.</h2>
        <Link href="/tes/papi">Kembali ke Tes</Link>
      </div>
    );
  }

  // Format data for radar chart
  const radarData = Object.keys(PAPI_TRAITS).map(key => ({
    subject: key,
    name: PAPI_TRAITS[key].name,
    score: scores[key] || 0,
    fullMark: 9
  }));

  return (
    <div style={{ padding: '40px 20px', fontFamily: '"Inter", sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ background: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', color: '#1e293b', fontWeight: '800' }}>Hasil Profil PAPI Kostick</h1>
          <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>Gambaran 20 dimensi kebutuhan dan peran kerja Anda</p>
          
          <div style={{ height: '500px', marginTop: '40px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 14, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 9]} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  formatter={(value, name, props) => [value, props.payload.name]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Radar name="Skor" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 25px 0', fontSize: '24px', color: '#1e293b', fontWeight: '700' }}>Tabel Rincian Dimensi</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {Object.keys(PAPI_TRAITS).map(key => {
              const trait = PAPI_TRAITS[key];
              const score = scores[key] || 0;
              return (
                <div key={key} style={{ background: '#f1f5f9', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ background: '#3b82f6', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                      {key}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{score}</div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>{trait.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{trait.description}</div>
                  
                  {/* Mini Progress Bar */}
                  <div style={{ width: '100%', background: '#cbd5e1', height: '6px', borderRadius: '3px', marginTop: '15px' }}>
                    <div style={{ height: '100%', background: '#3b82f6', borderRadius: '3px', width: `${(score / 9) * 100}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '15px 40px', fontSize: '16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
              Kembali ke Beranda
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
