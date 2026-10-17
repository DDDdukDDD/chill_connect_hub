import { CheckInScreen } from './CheckInScreen';

export const metadata = { title: 'เช็กอินผู้เข้าร่วม', robots: { index: false } };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';

// /checkin?event=<id>&code=<ticket code>: where a ticket's QR leads. The event's host is checked against the session.
export default async function CheckInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <CheckInScreen eventId={first(params.event).slice(0, 120)} code={first(params.code).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)} />;
}
