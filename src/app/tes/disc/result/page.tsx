'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DISCResult() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem('discResult');
    if (data) {
      setResult(JSON.parse(data));
    }
  }, []);

  if (!result) return <div style={{ padding: '50px', textAlign: 'center' }}>Memuat hasil...</div>;

  const { most, least, diff, profile } = result;

  // Simple SVG Line Chart renderer
  const renderLineChart = (title: string, dataObj: any, color: string, min: number, max: number) => {
    const w = 300;
    const h = 200;
    const padding = 40;
    const points = ['D', 'I', 'S', 'C'].map((key, i) => {
      const val = dataObj[key];
      // Normalize to 0-1
      const normalized = Math.max(0, Math.min(1, (val - min) / (max - min)));
      const x = padding + i * ((w - 2 * padding) / 3);
      const y = h - padding - normalized * (h - 2 * padding);
      return { x, y, val, key };
    });

    const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

    return (
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#2d3748' }}>{title}</h3>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
            <line key={i} x1={padding} y1={padding + pct * (h - 2 * padding)} x2={w - padding} y2={padding + pct * (h - 2 * padding)} stroke="#e2e8f0" strokeDasharray="4" />
          ))}
          {/* Path */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" />
          {/* Points & Labels */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill={color} />
              <text x={p.x} y={p.y - 15} textAnchor="middle" fontSize="12" fill="#4a5568" fontWeight="bold">{p.val}</text>
              <text x={p.x} y={h - 10} textAnchor="middle" fontSize="14" fill="#2d3748" fontWeight="bold">{p.key}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ padding: '40px 20px', fontFamily: '"Inter", sans-serif', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', color: '#2c3e50', margin: '0 0 10px 0', fontWeight: '800' }}>Hasil Tes DISC</h1>
          <p style={{ fontSize: '18px', color: '#7f8c8d', margin: 0 }}>Berikut adalah profil kepribadian Dominance, Influence, Steadiness, dan Compliance Anda.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '40px' }}>
          {renderLineChart('Grafik MOST (Public Self)', most, '#3182ce', 0, 24)}
          {renderLineChart('Grafik LEAST (Private Self)', least, '#e53e3e', 0, 24)}
          {renderLineChart('Grafik CHANGE (Perceived Self)', diff, '#38a169', -24, 24)}
        </div>

        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#2d3748', fontSize: '24px' }}>Skor Mentah & Skala Profil</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#edf2f7', color: '#4a5568' }}>
                  <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0' }}>Dimensi</th>
                  <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0' }}>MOST (M)</th>
                  <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0' }}>LEAST (L)</th>
                  <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0' }}>CHANGE (M-L)</th>
                  <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0' }}>PROFILE SCALE (1-8)</th>
                </tr>
              </thead>
              <tbody>
                {['D', 'I', 'S', 'C'].map((key) => (
                  <tr key={key} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '18px', color: '#2d3748' }}>{key}</td>
                    <td style={{ padding: '15px', color: '#3182ce', fontWeight: '600' }}>{most[key]}</td>
                    <td style={{ padding: '15px', color: '#e53e3e', fontWeight: '600' }}>{least[key]}</td>
                    <td style={{ padding: '15px', color: '#38a169', fontWeight: '600' }}>{diff[key]}</td>
                    <td style={{ padding: '15px', color: '#805ad5', fontWeight: '800', fontSize: '20px' }}>{profile[key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/">
            <button style={{ padding: '15px 40px', fontSize: '16px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
              Kembali ke Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
