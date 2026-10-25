import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      // 1. ชาเลนจ์ & ภารกิจ (Singular & Quest aliases)
      { source: '/challenge', destination: '/challenges', permanent: true },
      { source: '/quest', destination: '/challenges', permanent: true },
      { source: '/quests', destination: '/challenges', permanent: true },

      // 2. โมเมนต์ & โซเชียล (Singular & Feed aliases)
      { source: '/moment', destination: '/moments', permanent: true },
      { source: '/feed', destination: '/moments', permanent: true },
      { source: '/stories', destination: '/moments', permanent: true },

      // 3. กิจกรรม & อีเวนต์ (Direct event aliases to catalog)
      { source: '/event', destination: '/', permanent: true },
      // The /journey homepage draft became the home page (2026-10-16)
      { source: '/journey', destination: '/', permanent: false },
      // อีเวนต์ moved from /fairs to /events (owner 2026-10-25)
      { source: '/fairs', destination: '/events', permanent: true },
      { source: '/fairs/:id', destination: '/events/:id', permanent: true },

      // 4. มายฮับ & E-Ticket (User personal hub & ticket aliases)
      { source: '/hub', destination: '/myhub', permanent: true },
      { source: '/ticket', destination: '/myhub', permanent: true },
      { source: '/tickets', destination: '/myhub', permanent: true },

      // 5. สมาชิก & ระบบบัญชี (Standard auth & profile aliases)
      { source: '/signin', destination: '/login', permanent: true },
      { source: '/signup', destination: '/login', permanent: true },
      { source: '/register', destination: '/login', permanent: true },
      { source: '/me', destination: '/profile', permanent: true },
      { source: '/account', destination: '/profile', permanent: true },
    ];
  },
};

export default nextConfig;
