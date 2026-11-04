'use client';

import { useEffect } from 'react';
import { listenForInstallPrompt, registerServiceWorker, syncPushDevice } from '@/lib/appClient';
import { useMemberSession } from '@/lib/useMemberSession';

/** On every page: the service worker, the browser's install offer, and keeping this device with whoever is signed in */
export function AppSetup() {
  const { member } = useMemberSession();
  const memberId = member?.id;

  useEffect(() => {
    registerServiceWorker();
    return listenForInstallPrompt();
  }, []);

  useEffect(() => {
    if (memberId) syncPushDevice().catch(() => undefined);
  }, [memberId]);

  return null;
}
