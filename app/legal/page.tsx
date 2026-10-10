import { LegalScreen } from './LegalScreen';

export const metadata = { title: 'ข้อตกลงและนโยบาย · Chill & Connect Hub' };

// /legal · /legal?tab=privacy — the same text as the terms and privacy popup, reachable by signed-in members
export default async function LegalPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { tab } = await searchParams;
  return <LegalScreen initialTab={(Array.isArray(tab) ? tab[0] : tab) === 'privacy' ? 'privacy' : 'terms'} />;
}
