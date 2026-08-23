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
    default: "Chill & Connect Hub | Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต",
    template: "%s | Chill & Connect Hub",
  },
  description: "Chill & Connect Hub - Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ รวมงานแฟร์ เวิร์กช็อป วิ่ง บอร์ดเกม และเพื่อนใหม่",
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
    "คอมมูนิตี้คนชอบทำกิจกรรม",
  ],
  authors: [{ name: "Chill & Connect Hub Team" }],
  creator: "Chill & Connect Hub",
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://chillconnecthub.com",
    siteName: "Chill & Connect Hub",
    title: "Chill & Connect Hub | Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต",
    description: "Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ",
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
    title: "Chill & Connect Hub | Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต",
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Chill & Connect Hub คืออะไร?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Chill & Connect Hub (chillconnecthub.com) คือแพลตฟอร์มศูนย์รวมกิจกรรม อีเวนต์ งานแฟร์ และคอมมูนิตี้ในกรุงเทพฯ ที่เชื่อมต่อคนที่อยากออกไปใช้ชีวิต หาเพื่อนใหม่ และทำกิจกรรมร่วมกันอย่างปลอดภัยและเป็นกันเอง",
        },
      },
      {
        "@type": "Question",
        name: "มาคนเดียวสามารถเข้าร่วมกิจกรรมได้ไหม?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ได้แน่นอน สมาชิกมากกว่า 80% เข้าร่วมคนเดียวเพื่อทำกิจกรรมที่ชอบและพบปะเพื่อนใหม่ที่มีไลฟ์สไตล์ตรงกัน พร้อมมีกลุ่มชวนเพื่อนย่อยในงานและระบบความปลอดภัยคัดกรองโฮสต์",
        },
      },
      {
        "@type": "Question",
        name: "มีกิจกรรมประเภทไหนบ้างใน Chill & Connect Hub?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "มีกิจกรรมครบทั้ง 4 มู้ด: 🌿 สายฮีลใจ (Sound Bath, คลาสโยคะ, บอร์ดเกม), 🏃 สายแอคทีฟ (วิ่งสวนเบญจกิติ, แบดมินตัน, ปีนผา, HYROX), ☕ สายชิลล์ (Specialty Coffee, ทัวร์คาเฟ่, มหกรรมงานแฟร์ QSNCC/BITEC), และ 🎨 สายเรียนรู้ (เวิร์กช็อปปั้นดิน, วาดรูป, ภาษาอังกฤษ)",
        },
      },
    ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className="min-h-screen bg-[#FAF7F2] text-[#1E293B] flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
