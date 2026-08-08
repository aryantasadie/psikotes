'use client';

import { useEffect, useRef, useState } from 'react';

export default function TesPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logs, setLogs] = useState<{ id: number; time: string; type: string; url: string }[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Hardcoded ID untuk prototipe
  const participantId = "1"; 

  useEffect(() => {
    // Memulai Kamera
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => alert('Akses kamera ditolak: ' + err.message));

    // Memulai Layar (Screen Share)
    navigator.mediaDevices.getDisplayMedia({ video: true })
      .then(stream => {
        if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;
      })
      .catch(err => alert('Akses layar ditolak: ' + err.message));
  }, []);

  const takeSnapshot = async (videoElement: HTMLVideoElement | null, type: string) => {
    if (!videoElement || !videoElement.srcObject) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const imageUrl = canvas.toDataURL('image/jpeg', 0.7);

    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl, participantId, logType: type })
      });
      const data = await res.json();
      if (data.success) {
        setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), type, url: data.log.mediaUrl }, ...prev]);
      }
    } catch (e) {
      console.error('Gagal mengirim capture', e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCapturing) {
      interval = setInterval(() => {
        // Ambil kamera
        takeSnapshot(videoRef.current, 'camera');
        // Ambil layar beda 1 detik agar tidak terlalu berat bersamaan
        setTimeout(() => takeSnapshot(screenVideoRef.current, 'screen'), 1000);
      }, 5000); // 5 detik khusus demo
    }
    return () => clearInterval(interval);
  }, [isCapturing]);

  return (
    <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', color: '#333' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }}>
        <h1 style={{ borderBottom: '2px solid #eaeaea', paddingBottom: '10px' }}>Simulasi Tes (Keamanan Aktif)</h1>
        <p style={{ color: '#666' }}>Sistem akan memantau wajah dan layar Anda secara berkala tanpa mengganggu proses ujian.</p>
        
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '10px' }}>📷 Kamera Pengawas</h3>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: '8px', border: '1px solid #ddd', background: '#000' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '10px' }}>💻 Layar Pengawas</h3>
            <video ref={screenVideoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: '8px', border: '1px solid #ddd', background: '#000' }} />
          </div>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button 
            onClick={() => setIsCapturing(!isCapturing)}
            style={{ 
              padding: '12px 24px', 
              background: isCapturing ? '#e74c3c' : '#2ecc71', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              fontSize: '16px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            {isCapturing ? '🛑 Hentikan Simulasi Keamanan' : '▶️ Mulai Pengawasan Otomatis (Tiap 5 Detik)'}
          </button>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div style={{ marginTop: '40px', borderTop: '2px dashed #eee', paddingTop: '20px' }}>
          <h3>📋 Log Database & Storage Server</h3>
          <p style={{ fontSize: '13px', color: '#777' }}>Data di bawah ini ditarik langsung dari respons Server (menyatakan bahwa foto telah disimpan di folder backend dan tercatat di Prisma SQLite).</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', marginTop: '15px' }}>
            {logs.map(log => (
              <div key={log.id} style={{ background: '#fcfcfc', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
                <img src={log.url} alt="Capture" style={{ width: '100%', height: '120px', borderRadius: '4px', objectFit: 'cover' }} />
                <p style={{ fontSize: '12px', margin: '8px 0 0 0', fontWeight: 'bold' }}>
                  {log.type === 'camera' ? '📷 Kamera' : '💻 Layar'}
                </p>
                <p style={{ fontSize: '11px', margin: '2px 0 0 0', color: '#777' }}>Jam: {log.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
