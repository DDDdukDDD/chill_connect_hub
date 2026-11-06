import type { MetadataRoute } from 'next';

// What the phone needs to install the site as an app (the service worker is public/sw.js)
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Chillwaa',
    short_name: 'Chillwaa',
    description: 'คอมมูนิตี้คนชอบออกไปใช้ชีวิต เข้าตี้ หาที่เที่ยวและอีเวนต์ ทำชาเลนจ์ แล้วแชร์โมเมนต์ให้เพื่อนๆ ดู',
    lang: 'th',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    categories: ['social', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
