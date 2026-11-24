'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function TestToolTracker() {
  const pathname = usePathname();
  const trackedTools = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!pathname || !pathname.startsWith('/tes')) return;

    // Abaikan jika di halaman result / instruksi non-soal
    if (pathname.includes('/result')) return;

    // Ambil segmen tes, contoh: /tes/cfit1 -> cfit1, /tes/wpt -> wpt
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 2) return;

    const toolSlug = segments[1].toLowerCase().trim();
    if (!toolSlug) return;

    if (trackedTools.current.has(toolSlug)) return;
    trackedTools.current.add(toolSlug);

    // Kirim notifikasi start-tool ke server untuk memotong kuota Single Test secara atomik
    fetch('/api/testee/start-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolSlug }),
    }).catch(err => {
      console.error('Failed to notify test tool start:', err);
    });
  }, [pathname]);

  return null;
}
