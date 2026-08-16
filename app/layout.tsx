import type { Metadata, Viewport } from "next";
import { Prompt, Inter } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#4A7C59",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://chillconnecthub.com"),
  title: {
    default: "Chill & Connect Hub | ฮับรวมกิจกรรมยามว่าง ฮีลใจ & ชาเลนจ์สนุกๆ",
    template: "%s | Chill & Connect Hub",
  },
  description: "ค้นหากิจกรรมยามว่าง ฮีลใจ ออกกำลังกาย HYROX คืนบอร์ดเกม และเวิร์กช็อป ปล่อยใจพักผ่อน เติมพลังบวก และเจอเพื่อนใหม่ที่มีไลฟ์สไตล์ตรงกัน",
  keywords: [
    "กิจกรรมยามว่าง",
    "หากิจกรรมทำวันหยุด",
    "กิจกรรมฮีลใจ",
    "หาเพื่อนวิ่ง",
    "HYROX Thailand",
    "Sound Bath Meditation",
    "บอร์ดเกม อโศก",
    "เวิร์กช็อปปั้นดิน",
    "Chill and Connect Hub",
  ],
  authors: [{ name: "Chill & Connect Hub Team" }],
  creator: "Chill & Connect Hub",
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://chillconnecthub.com",
    siteName: "Chill & Connect Hub",
    title: "Chill & Connect Hub | ฮับรวมกิจกรรมยามว่าง ฮีลใจ & ชาเลนจ์สนุกๆ",
    description: "ค้นหากิจกรรมยามว่าง ฮีลใจ ออกกำลังกาย HYROX คืนบอร์ดเกม และเวิร์กช็อป ปล่อยใจพักผ่อน เติมพลังบวก และเจอเพื่อนใหม่ที่มีไลฟ์สไตล์ตรงกัน",
    images: [
      {
        url: "/hero-bg-70.png",
        width: 1200,
        height: 630,
        alt: "Chill & Connect Hub Preview Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chill & Connect Hub | ฮับรวมกิจกรรมยามว่าง ฮีลใจ & ชาเลนจ์สนุกๆ",
    description: "ค้นหากิจกรรมยามว่าง ฮีลใจ ออกกำลังกาย HYROX คืนบอร์ดเกม และเวิร์กช็อป",
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
    name: "Chill & Connect Hub",
    url: "https://chillconnecthub.com",
    logo: "https://chillconnecthub.com/hero-bg-70.png",
    description: "แพลตฟอร์มศูนย์รวมกิจกรรมยามว่าง ฮีลใจ ออกกำลังกาย และคอมมูนิตี้สำหรับคนรุ่นใหม่",
    sameAs: [
      "https://facebook.com/chillconnecthub",
      "https://instagram.com/chillconnecthub",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Chill & Connect Hub",
    url: "https://chillconnecthub.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://chillconnecthub.com/?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="th" className={`${prompt.variable} ${inter.variable} antialiased`}>
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
      <body className="min-h-screen bg-[#FAF7F2] text-[#1E293B] flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
