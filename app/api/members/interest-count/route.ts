import { NextResponse } from 'next/server';
import { interestPeopleCount } from '@/lib/members/safety';

// ?ids=cafe_social,running_fitness → how many active members share at least one of these สาย (a number, no names)
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get('ids') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => /^[a-z0-9_]{1,40}$/.test(id))
    .slice(0, 30);
  return NextResponse.json({ success: true, people: await interestPeopleCount(ids) }, { headers: { 'Cache-Control': 'no-store' } });
}
