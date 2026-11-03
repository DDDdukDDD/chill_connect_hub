'use client';

import React, { useEffect } from 'react';

/** The root layout itself failed: nothing of the site's styles can be relied on, so this page carries its own */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Root error:', error);
  }, [error]);

  return (
    <html lang="th">
      <body style={{ margin: 0, minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#0f172a', background: '#fff' }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>เว็บสะดุดไปนิดนึง</h1>
        <p style={{ color: '#475569', fontSize: 14 }}>ลองอีกครั้งได้เลย ถ้ายังไม่ได้ รอสักครู่แล้วกลับมาใหม่นะ</p>
        <button type="button" onClick={reset} style={{ minHeight: 44, padding: '0 24px', borderRadius: 999, border: 0, background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>ลองอีกครั้ง</button>
      </body>
    </html>
  );
}
