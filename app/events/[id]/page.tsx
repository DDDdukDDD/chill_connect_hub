'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEventById, MOCK_EVENTS, EventItem } from '@/data/mockData';

export default function EventSmartRouterPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const decodedId = rawId ? decodeURIComponent(rawId) : '';

  useEffect(() => {
    if (!decodedId) {
      router.replace('/');
      return;
    }

    // 1. Check local mock events first for instant routing
    const localFound = getEventById(decodedId) || MOCK_EVENTS.find((e) => e.id === decodedId || e.title === decodedId);
    if (localFound) {
      if (localFound.eventType === 'public_venue') {
        router.replace(`/fairs/${encodeURIComponent(decodedId)}`);
      } else {
        router.replace(`/community/${encodeURIComponent(decodedId)}`);
      }
      return;
    }

    // 2. Fetch live database events from /api/events
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data?.events && Array.isArray(data.events)) {
          const apiFound = data.events.find(
            (e: EventItem) =>
              e.id === decodedId ||
              encodeURIComponent(e.id) === decodedId ||
              e.title === decodedId ||
              (e.title && decodedId.includes(e.title))
          );
          if (apiFound) {
            if (apiFound.eventType === 'public_venue') {
              router.replace(`/fairs/${encodeURIComponent(decodedId)}`);
            } else {
              router.replace(`/community/${encodeURIComponent(decodedId)}`);
            }
            return;
          }
        }
        // Fallback default to community
        router.replace(`/community/${encodeURIComponent(decodedId)}`);
      })
      .catch(() => {
        router.replace(`/community/${encodeURIComponent(decodedId)}`);
      });
  }, [decodedId, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-sans">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#F26430] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">กำลังเปิดหน้ารายละเอียด...</p>
      </div>
    </div>
  );
}
