import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** The site's share picture (LINE, Facebook, X), drawn at build time. Pages without a picture of their own use it too
 *  (DEFAULT_SHARE_IMAGE in lib/site.ts). Thai needs its own font file: the image renderer cannot use next/font. */
export const alt = 'Chillwaa - Social platform สำหรับคนชอบออกไปใช้ชีวิต';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const file = (path: string) => readFile(join(process.cwd(), path));
const dataUrl = async (path: string, type = 'image/png') => `data:${type};base64,${(await file(path)).toString('base64')}`;

export default async function Image() {
  const [bold, medium, logo, art] = await Promise.all([
    file('assets/fonts/IBMPlexSansThai-Bold.ttf'),
    file('assets/fonts/IBMPlexSansThai-Medium.ttf'),
    dataUrl('public/brand-logo.png'),
    dataUrl('public/hero-bg-70.png', 'image/jpeg'), // a JPEG despite its name
  ]);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#F9F6EF', fontFamily: 'Plex Thai' }}>
        {/* The hero illustration: its people sit at the left and right edges, the middle stays free for the text */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art} alt="" width={1200} height={1200} style={{ position: 'absolute', left: 0, top: -330 }} />
        {/* The renderer cannot stack two marks on one Thai letter (ที่ loses its tone mark), so keep such words out of
            this text. The longer tagline is the share description, shown under the picture anyway. */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1200, height: 630, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" width={96} height={96} style={{ borderRadius: 22 }} />
            <div style={{ fontSize: 72, fontWeight: 700, color: '#1F2937', letterSpacing: -1 }}>Chillwaa</div>
          </div>
          <div style={{ marginTop: 34, fontSize: 56, fontWeight: 700, color: '#EA580C', lineHeight: 1.2 }}>Social platform</div>
          <div style={{ fontSize: 44, fontWeight: 700, color: '#1F2937', lineHeight: 1.4 }}>สำหรับคนชอบออกไปใช้ชีวิต</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Plex Thai', data: bold, weight: 700, style: 'normal' },
        { name: 'Plex Thai', data: medium, weight: 500, style: 'normal' },
      ],
    },
  );
}
