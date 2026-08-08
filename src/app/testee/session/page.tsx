'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function TesteeSession() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [completedTests, setCompletedTests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Onboarding States
  const [onboardingStage, setOnboardingStage] = useState(0); // 0 = Loading, 1 = Form, 2 = Briefing, 3 = Ready for Test
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    // Fetch sequence from DB
    fetch('/api/testee/session')
      .then(res => res.json())
      .then(data => {
        if (data.sequence) {
          setSequence(data.sequence);
        }
        if (data.participantId) {
          const currentParticipant = localStorage.getItem('current_participant_id');
          if (currentParticipant !== String(data.participantId)) {
            // Clear all test_completed flags for new participant
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('test_completed_') || key.endsWith('Result'))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            localStorage.setItem('current_participant_id', String(data.participantId));
            
            // Juga bersihkan session storage umur jika ganti partisipan
            sessionStorage.removeItem('testee_name');
            sessionStorage.removeItem('testee_age');
            sessionStorage.removeItem('testee_dob');
          }
        }

        // Check localStorage for completed tests
        const completed = [];
        for (const testName of (data.sequence || [])) {
          const slug = testName.toLowerCase().replace(/[\s\-_]+/g, '');
          if (
            localStorage.getItem(`test_completed_${slug}`) ||
            (slug.includes('power') && (localStorage.getItem('test_completed_power') || localStorage.getItem('test_completed_powerleader'))) ||
            (slug.includes('papi') && (localStorage.getItem('test_completed_papi') || localStorage.getItem('test_completed_papikostick')))
          ) {
            completed.push(testName);
          }
        }
        setCompletedTests(completed);
        
        // Cek apakah data nama & umur sudah diisi di session storage
        const savedName = sessionStorage.getItem('testee_name');
        const savedAge = sessionStorage.getItem('testee_age');
        
        if (savedName && savedAge) {
          setOnboardingStage(3); // Langsung siap tes
        } else {
          setOnboardingStage(1); // Minta input form
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Calculate next test
  const nextTestIndex = sequence.findIndex(t => !completedTests.includes(t));
  const isAllCompleted = sequence.length > 0 && nextTestIndex === -1;
  const nextTest = isAllCompleted || sequence.length === 0 ? null : sequence[nextTestIndex];

  useEffect(() => {
    // HANYA redirect jika loading selesai, ada nextTest, DAN onboarding sudah tahap 3
    if (!loading && sequence.length > 0 && nextTest && onboardingStage === 3) {
      let slug = nextTest.toLowerCase().replace(/[\s\-_]+/g, '');
      if (slug.includes('power')) slug = 'power';
      else if (slug.includes('papi')) slug = 'papikostick';
      router.replace(`/tes/${slug}`);
    }
  }, [loading, sequence.length, nextTest, router, onboardingStage]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dob) return;
    
    // Hitung umur
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    // Simpan ke session storage
    sessionStorage.setItem('testee_name', name);
    sessionStorage.setItem('testee_dob', dob);
    sessionStorage.setItem('testee_age', age.toString());
    
    // Pindah ke briefing
    setOnboardingStage(2);
  };

  const handleStartTest = () => {
    setOnboardingStage(3);
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Memuat Sesi...</div>;
  }

  if (sequence.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: '#FFFFFF', padding: '36px 28px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: '#FEF3C7', color: '#D97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px' }}>
            📅
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>Tidak Ada Jadwal Ujian</h2>
          <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Anda saat ini tidak memiliki jadwal ujian yang aktif. Hubungi administrator jika ini adalah kekeliruan.
          </p>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })} 
            style={{ width: '100%', padding: '12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
          >
            Keluar dari Aplikasi (Logout)
          </button>
        </div>
      </div>
    );
  }

  // Jika sudah semua selesai
  if (isAllCompleted) {
    return (
      <div style={{ minHeight: '100vh', background: '#EDEFF4', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: '#E2F4EC', color: '#1E9B71', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 20px' }}>
            🎉
          </div>
          <h2 style={{ color: '#1E9B71', marginBottom: '10px' }}>Semua Ujian Selesai!</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>Terima kasih telah mengikuti asesmen. Anda dapat menutup halaman ini atau keluar.</p>
          <button onClick={() => signOut()} style={{ padding: '10px 24px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
            Keluar dari Aplikasi
          </button>
        </div>
      </div>
    );
  }

  // TAHAP 1: Form Profil (Intermeso)
  if (onboardingStage === 1) {
    return (
      <div style={{ minHeight: '100vh', background: '#EDEFF4', padding: '40px 20px', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '450px', background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ margin: '0 0 10px', fontSize: '24px', color: '#161A2C', fontWeight: 800 }}>Profil Singkat</h1>
            <p style={{ margin: 0, color: '#69728A', fontSize: '14px', lineHeight: 1.5 }}>Silakan lengkapi data diri Anda sebelum memulai rangkaian asesmen.</p>
          </div>

          <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Nama Lengkap</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D3D8E4', fontSize: '15px', outlineColor: '#3A3F94' }}
                placeholder="Masukkan nama Anda..."
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Tanggal Lahir</label>
              <input 
                type="date" 
                value={dob}
                onChange={e => setDob(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D3D8E4', fontSize: '15px', outlineColor: '#3A3F94', fontFamily: 'inherit' }}
              />
            </div>
            
            <button 
              type="submit" 
              style={{ padding: '14px', background: '#3A3F94', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#31356f'}
              onMouseOut={e => e.currentTarget.style.background = '#3A3F94'}
            >
              Lanjutkan
            </button>
          </form>
        </div>
      </div>
    );
  }

  // TAHAP 2: Instruksi Singkat
  if (onboardingStage === 2) {
    return (
      <div style={{ minHeight: '100vh', background: '#EDEFF4', padding: '40px 20px', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '600px', background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ width: '64px', height: '64px', background: '#E0E7FF', color: '#4338CA', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>
              ℹ️
            </div>
            <h1 style={{ margin: '0 0 10px', fontSize: '24px', color: '#161A2C', fontWeight: 800 }}>Persiapan Asesmen</h1>
          </div>

          <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
            <p style={{ margin: '0 0 15px', color: '#334155', fontSize: '15px', lineHeight: 1.6 }}>
              Halo, <strong>{sessionStorage.getItem('testee_name')}</strong>! Anda akan segera mengerjakan serangkaian asesmen psikologi.
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '15px', lineHeight: 1.6 }}>
              <li style={{ marginBottom: '8px' }}>Pastikan koneksi internet Anda stabil.</li>
              <li style={{ marginBottom: '8px' }}>Cari tempat yang tenang agar Anda dapat berkonsentrasi penuh.</li>
              <li style={{ marginBottom: '8px' }}>Pahami instruksi pada setiap awal modul sebelum menjawab.</li>
              <li>Kerjakan setiap soal secara jujur dan mandiri.</li>
            </ul>
          </div>

          <button 
            onClick={handleStartTest}
            style={{ width: '100%', padding: '16px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
            onMouseOver={e => e.currentTarget.style.background = '#059669'}
            onMouseOut={e => e.currentTarget.style.background = '#10B981'}
          >
            Mulai Tes Sekarang
          </button>
        </div>
      </div>
    );
  }

  // TAHAP 3: Transition state
  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>Menyiapkan Modul {nextTest}...</div>;
}

