import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/site";
import { IBM_Plex_Sans_Thai, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { InviteRefCapture } from "@/components/InviteRefCapture";
import { OnboardingResume } from "@/components/OnboardingResume";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-ibm-plex-thai",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#4A7C59",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Chillwaa | Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต",
    template: "%s | Chillwaa",
  },
  description: "Chillwaa - Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ รวมงานแฟร์ เวิร์กช็อป วิ่ง บอร์ดเกม และเพื่อนใหม่",
  keywords: [
    "กิจกรรมยามว่าง",
    "หากิจกรรมทำวันหยุด",
    "กิจกรรมฮีลใจ",
    "หาเพื่อนวิ่ง",
    "HYROX Thailand",
    "Sound Bath Meditation",
    "บอร์ดเกม อโศก",
    "เวิร์กช็อปปั้นดิน",
    "Chillwaa",
    "Chill & Connect",
    "คอมมูนิตี้คนชอบทำกิจกรรม",
  ],
  authors: [{ name: "Chillwaa Team" }],
  creator: "Chillwaa",
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: SITE_URL,
    siteName: "Chillwaa",
    title: "Chillwaa | Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต",
    description: "Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ",
    images: [
      {
        url: "/hero-bg-70.png",
        width: 1200,
        height: 630,
        alt: "Chillwaa Preview Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chillwaa | Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต",
    description: "Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ",
    images: ["/hero-bg-70.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
      { url: '/brand-logo.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Schema.org Structured Data for Google AI & Search Engine Optimization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Chillwaa",
    alternateName: "Chill & Connect",
    url: SITE_URL,
    logo: `${SITE_URL}/brand-logo.png`,
    // What AI search quotes about us: kept to what the site really does (the FAQPage that sat on every page was removed
    // 2026-11-01: its questions were not on the pages and one answer made up a statistic)
    description: "คอมมูนิตี้คนชอบออกไปใช้ชีวิตทั่วไทย: เข้าตี้หรือเปิดตี้ไปด้วยกัน หาที่เที่ยวและอีเวนต์ ทำชาเลนจ์ได้ XP และของรางวัล แล้วแชร์โมเมนต์ให้เพื่อนๆ ดู",
    sameAs: [
      "https://www.instagram.com/chillwaa_official",
      "https://www.tiktok.com/@chillwaa.official",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Chillwaa",
    alternateName: "Chill & Connect",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/community?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="th" className={`${ibmPlexSansThai.variable} ${plusJakartaSans.variable} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-screen bg-white text-[#1E293B] flex flex-col font-sans">
        <InviteRefCapture />
        <OnboardingResume />
        {children}
      </body>
    </html>
  );
}
