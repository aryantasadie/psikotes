'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function TesteeSession() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [completedTests, setCompletedTests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStopped, setIsStopped] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedMessage, setPausedMessage] = useState('');
  
  // Onboarding States
  const [onboardingStage, setOnboardingStage] = useState(0); // 0 = Loading, 1 = Form, 2 = Briefing, 3 = Ready for Test
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  
  const router = useRouter();

  const fetchSessionData = () => {
    fetch('/api/testee/session')
      .then(res => res.json())
      .then(data => {
        if (data.isStopped) {
          setIsStopped(true);
          setLoading(false);
          return;
        }

        setIsPaused(Boolean(data.isPaused));
        if (data.pausedMessage) setPausedMessage(data.pausedMessage);

        if (data.sequence) {
          setSequence(data.sequence);
        }
        if (data.participantId) {
          const currentParticipant = localStorage.getItem('current_participant_id');
          if (currentParticipant !== String(data.participantId)) {
            // Clear all test_completed flags & profile for new participant
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('test_completed_') || key.endsWith('Result') || key.startsWith('testee_') || key.startsWith('test_draft_') || key.startsWith('kraepelin_draft_') || key.startsWith('test_timer_left_') || key === 'cbt_consent_granted')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            localStorage.setItem('current_participant_id', String(data.participantId));
            
            // Juga bersihkan session storage jika ganti partisipan
            sessionStorage.removeItem('testee_name');
            sessionStorage.removeItem('testee_age');
            sessionStorage.removeItem('testee_dob');
            sessionStorage.removeItem('cbt_consent_granted');
          }
        }

        // Check DB completedTests + localStorage for completed tests
        const dbCompleted = Array.isArray(data.completedTests) ? data.completedTests : [];
        const completedSet = new Set<string>(dbCompleted);

        for (const testName of (data.sequence || [])) {
          const slug = testName.toLowerCase().replace(/[\s\-_]+/g, '');
          if (
            localStorage.getItem(`test_completed_${slug}`) ||
            (slug.includes('power') && (localStorage.getItem('test_completed_power') || localStorage.getItem('test_completed_powerleader'))) ||
            (slug.includes('papi') && (localStorage.getItem('test_completed_papi') || localStorage.getItem('test_completed_papikostick'))) ||
            ((slug.includes('kraepelin') || slug.includes('kreapelin')) && (localStorage.getItem('test_completed_kraepelin') || localStorage.getItem('test_completed_kreapelin')))
          ) {
            completedSet.add(testName);
          }
        }
        setCompletedTests(Array.from(completedSet));
        
        // Cek apakah nama di database masih bawaan/default atau sudah diisi nama asli peserta
        const isDefault = data.isDefaultName ?? true;
        const savedName = sessionStorage.getItem('testee_name');
        const savedAge = sessionStorage.getItem('testee_age');
        const localSavedName = localStorage.getItem('testee_name');
        const localSavedAge = localStorage.getItem('testee_age');

        // Jika nama di DB sudah diubah (bukan bawaan), atau sudah terisi nama custom di session saat ini
        const hasCustomDbName = !isDefault && data.userName && !data.userName.toLowerCase().startsWith('peserta');
        const hasValidLocalName = (savedName && !savedName.toLowerCase().startsWith('peserta') && savedAge) ||
                                  (localSavedName && !localSavedName.toLowerCase().startsWith('peserta') && localSavedAge);

        if (hasCustomDbName || hasValidLocalName) {
          const finalName = hasCustomDbName ? data.userName : (savedName || localSavedName || 'Peserta');
          const finalAge = savedAge || localSavedAge || '22';
          sessionStorage.setItem('testee_name', finalName);
          sessionStorage.setItem('testee_age', finalAge);
          localStorage.setItem('testee_name', finalName);
          localStorage.setItem('testee_age', finalAge);
          setOnboardingStage(3); // Sudah isi nama asli -> langsung lanjut ke tes
        } else {
          // Bersihkan sisa data lama & wajibkan input form nama & tanggal lahir
          sessionStorage.removeItem('testee_name');
          sessionStorage.removeItem('testee_age');
          sessionStorage.removeItem('testee_dob');
          localStorage.removeItem('testee_name');
          localStorage.removeItem('testee_age');
          localStorage.removeItem('testee_dob');
          setOnboardingStage(1); // Minta input nama asli & tanggal lahir
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  // Real-time listener for pause and stop events
  useEffect(() => {
    const handlePauseEvent = (e: any) => {
      const nextPaused = Boolean(e.detail?.isPaused);
      setIsPaused(nextPaused);
      if (e.detail?.message) setPausedMessage(e.detail.message);
    };
    const handleStopEvent = (e: any) => {
      setIsStopped(Boolean(e.detail?.isStopped));
    };
    window.addEventListener('cbt:pause-changed', handlePauseEvent);
    window.addEventListener('cbt:stop-changed', handleStopEvent);
    return () => {
      window.removeEventListener('cbt:pause-changed', handlePauseEvent);
      window.removeEventListener('cbt:stop-changed', handleStopEvent);
    };
  }, []);

  // Fast poll (1.2s) for break room unpause if currently paused
  useEffect(() => {
    if (!isPaused) return;

    const interval = setInterval(() => {
      fetch('/api/testee/session')
        .then(r => r.json())
        .then(data => {
          if (data.isStopped) {
            setIsStopped(true);
            setIsPaused(false);
          } else if (!data.isPaused) {
            setIsPaused(false);
            if (data.completedTests) setCompletedTests(data.completedTests);
          }
        })
        .catch(console.error);
    }, 1200);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Calculate next test
  const nextTestIndex = sequence.findIndex(t => !completedTests.includes(t));
  const isAllCompleted = sequence.length > 0 && nextTestIndex === -1;
  const nextTest = isAllCompleted || sequence.length === 0 ? null : sequence[nextTestIndex];

  useEffect(() => {
    // HANYA redirect jika loading selesai, ada nextTest, onboarding sudah tahap 3, TIDAK dijeda, dan TIDAK distop
    if (!loading && sequence.length > 0 && nextTest && onboardingStage === 3 && !isPaused && !isStopped) {
      let slug = nextTest.toLowerCase().replace(/[\s\-_]+/g, '');
      if (slug.includes('power')) slug = 'power';
      else if (slug.includes('papi')) slug = 'papikostick';
      else if (slug.includes('kraepelin') || slug.includes('kreapelin')) slug = 'kraepelin';
      router.replace(`/tes/${slug}`);
    }
  }, [loading, sequence.length, nextTest, router, onboardingStage, isPaused, isStopped]);

  const handleSubmitForm = async (e: React.FormEvent) => {
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
    
    try {
      await fetch('/api/testee/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
    } catch (err) {
      console.error('Failed to sync name to database:', err);
    }
    
    // Simpan ke session storage & local storage
    sessionStorage.setItem('testee_name', name.trim());
    sessionStorage.setItem('testee_dob', dob);
    sessionStorage.setItem('testee_age', age.toString());
    localStorage.setItem('testee_name', name.trim());
    localStorage.setItem('testee_dob', dob);
    localStorage.setItem('testee_age', age.toString());

    // Trigger Photo 1 (Capture Awal Wajah)
    const initialTime = Date.now();
    const currentPId = localStorage.getItem('current_participant_id');
    localStorage.setItem('cbt_photo1_timestamp', String(initialTime));
    localStorage.removeItem('cbt_photo1_done');
    localStorage.removeItem('cbt_photo2_done');
    if (currentPId) {
      localStorage.setItem(`cbt_photo1_timestamp_${currentPId}`, String(initialTime));
      localStorage.removeItem(`cbt_photo1_done_${currentPId}`);
      localStorage.removeItem(`cbt_photo2_done_${currentPId}`);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cbt:trigger-initial-photo', { detail: { timestamp: initialTime, participantId: currentPId } }));
    }
    
    // Pindah ke briefing
    setOnboardingStage(2);
  };

  const handleStartTest = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error on start test click:', err);
    }
    setOnboardingStage(3);
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Memuat Sesi...</div>;
  }

  if (isStopped) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '40px 20px', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: 'white', padding: '40px 32px', borderRadius: '16px', border: '1px solid #FEE2E2', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: '#FEE2E2', color: '#DC2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', margin: '0 auto 16px' }}>
            ✕
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>Ujian Dihentikan</h2>
          <p style={{ fontSize: '0.9rem', color: '#64748B', margin: '0 0 24px', lineHeight: 1.5 }}>
            Pengerjaan ujian Anda telah dihentikan oleh pengawas. Silakan hubungi pengawas atau panitia jika ada pertanyaan.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '13px', color: '#991B1B', padding: '12px 18px', background: '#FEE2E2', borderRadius: '12px', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
            <span>Menunggu arahan pengawas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isPaused) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0F172A', padding: '16px', fontFamily: '"Inter", sans-serif', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ maxWidth: '520px', width: '100%', margin: 'auto', background: '#1E293B', padding: '32px 24px', borderRadius: '20px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', color: '#F8FAFC' }}>
          
          {/* Vertical gray JEDA badge icon */}
          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: '#334155', 
            color: '#F8FAFC', 
            borderRadius: '16px', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '10px', 
            fontWeight: 900, 
            letterSpacing: '2px',
            margin: '0 auto 16px',
            border: '2px solid #475569',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <span>J</span>
            <span>E</span>
            <span>D</span>
            <span>A</span>
          </div>
          
          <span style={{ display: 'inline-block', background: '#0284C7', color: '#FFFFFF', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
            ☕ Jeda Istirahat Antar Tes
          </span>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px' }}>
            Sesi Sedang Dijeda Pengawas
          </h2>

          <p style={{ fontSize: '0.88rem', color: '#94A3B8', margin: '0 0 20px', lineHeight: 1.5 }}>
            {pausedMessage || 'Silakan istirahat sejenak. Seluruh jawaban dari subtes sebelumnya telah tersimpan dengan aman. Pengawas akan segera membuka akses ke modul ujian berikutnya.'}
          </p>

          {nextTest && (
            <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '14px', padding: '16px 18px', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Modul Tes Berikutnya
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#38BDF8', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{nextTest}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', background: '#064E3B', padding: '3px 9px', borderRadius: '10px' }}>Siap Dimulai</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '11.5px', color: '#CBD5E1', padding: '10px 14px', background: '#334155', borderRadius: '10px', lineHeight: 1.4 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
            <span>Menunggu arahan pengawas... Halaman akan otomatis terbuka begitu sesi dilanjutkan.</span>
          </div>
        </div>
      </div>
    );
  }

  if (sequence.length === 0) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#F8FAFC', padding: '16px', fontFamily: '"Inter", sans-serif', overflowY: 'auto' }}>
        <div style={{ maxWidth: '440px', width: '100%', margin: 'auto', background: '#FFFFFF', padding: '32px 22px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', background: '#F1F5F9', color: '#475569', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, margin: '0 auto 14px' }}>
            INFO
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>Tidak Ada Jadwal Ujian</h2>
          <p style={{ fontSize: '0.88rem', color: '#475569', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            Anda saat ini tidak memiliki jadwal ujian yang aktif. Hubungi administrator jika ini adalah kekeliruan.
          </p>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })} 
            style={{ width: '100%', height: '46px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
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
      <div style={{ minHeight: '100dvh', background: '#F1F5F9', padding: '16px', fontFamily: '"Inter", sans-serif', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ maxWidth: '520px', width: '100%', margin: 'auto', background: 'white', padding: '36px 24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ width: '70px', height: '70px', background: '#E2F4EC', color: '#1E9B71', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 16px' }}>
            🎉
          </div>
          <h2 style={{ color: '#0F172A', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>Semua Ujian Selesai!</h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>Terima kasih telah mengikuti rangkaian asesmen. Anda dapat menutup halaman ini atau keluar.</p>
          <button onClick={() => signOut()} style={{ padding: '12px 28px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
            Keluar dari Aplikasi
          </button>
        </div>
      </div>
    );
  }

  // TAHAP 1: Form Profil (Intermeso)
  if (onboardingStage === 1) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F1F5F9', padding: '16px', fontFamily: '"Inter", sans-serif', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '440px', 
          margin: 'auto', 
          background: '#FFFFFF', 
          padding: '28px 22px', 
          borderRadius: '20px', 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)' 
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#F0FDFA', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '20px', border: '1px solid #CCFBF1' }}>
              👤
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: '22px', color: '#0F172A', fontWeight: 800 }}>Profil Singkat</h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '13.5px', lineHeight: 1.5 }}>
              Silakan lengkapi data diri Anda sebelum memulai rangkaian asesmen.
            </p>
          </div>

          <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                Nama Lengkap
              </label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 14px', 
                  borderRadius: '10px', 
                  border: '1.5px solid #CBD5E1', 
                  fontSize: '16px', 
                  color: '#0F172A',
                  background: '#F8FAFC',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#0D9488';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.15)';
                  e.currentTarget.style.background = '#FFFFFF';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = '#F8FAFC';
                }}
                placeholder="Masukkan nama lengkap Anda..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                Tanggal Lahir
              </label>
              <input 
                type="date" 
                value={dob}
                onChange={e => setDob(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 14px', 
                  borderRadius: '10px', 
                  border: '1.5px solid #CBD5E1', 
                  fontSize: '16px', 
                  color: '#0F172A',
                  background: '#F8FAFC',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#0D9488';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.15)';
                  e.currentTarget.style.background = '#FFFFFF';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = '#F8FAFC';
                }}
              />
            </div>
            
            <button 
              type="submit" 
              style={{ 
                width: '100%',
                height: '48px', 
                background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontSize: '15px', 
                fontWeight: 700, 
                cursor: 'pointer', 
                marginTop: '6px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                transition: 'all 0.2s' 
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span>Lanjutkan</span>
              <span>→</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // TAHAP 2: Instruksi Singkat
  if (onboardingStage === 2) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F1F5F9', padding: '16px', fontFamily: '"Inter", sans-serif', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '520px', 
          margin: 'auto', 
          background: '#FFFFFF', 
          padding: '28px 22px', 
          borderRadius: '20px', 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)' 
        }}>
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div style={{ width: '48px', height: '48px', background: '#EEF2FF', color: '#4F46E5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 12px', border: '1px solid #E0E7FF' }}>
              📋
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: '22px', color: '#0F172A', fontWeight: 800 }}>Persiapan Asesmen</h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '13.5px' }}>
              Halo, <strong style={{ color: '#0F172A' }}>{sessionStorage.getItem('testee_name') || 'Peserta'}</strong>! Perhatikan panduan di bawah ini:
            </p>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '18px 20px', borderRadius: '14px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>📶</span>
                <span>Pastikan koneksi internet stabil & kuota mencukupi.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>🤫</span>
                <span>Pilihlah ruangan yang tenang agar fokus maksimal.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>📖</span>
                <span>Pahami instruksi pada setiap awal modul sebelum mulai menjawab.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>⏱️</span>
                <span>Waktu ujian berjalan otomatis dan tidak dapat dijeda secara mandiri.</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleStartTest}
            style={{ 
              width: '100%', 
              height: '50px', 
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              fontSize: '15px', 
              fontWeight: 700, 
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span>Mulai Tes Sekarang</span>
            <span>→</span>
          </button>
        </div>
      </div>
    );
  }

  // TAHAP 3: Transition state
  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>Menyiapkan Modul {nextTest}...</div>;
}

