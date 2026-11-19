'use client';

import { useEffect } from 'react';
import { listenForInstallPrompt, listenForNativePushTaps, registerServiceWorker, syncPushDevice, installNativeShareSheet } from '@/lib/appClient';
import { useMemberSession } from '@/lib/useMemberSession';
import { InstallSheet } from '@/components/InstallSheet';

/** On every page: the service worker, the browser's install offer, and keeping this device with whoever is signed in */
export function AppSetup() {
  const { member } = useMemberSession({ background: true });
  const memberId = member?.id;

  useEffect(() => {
    registerServiceWorker();
    // The iPhone store app: a tapped notification opens its page (BE-428)
    listenForNativePushTaps();
    installNativeShareSheet();
    return listenForInstallPrompt();
  }, []);

  useEffect(() => {
    if (memberId) syncPushDevice().catch(() => undefined);
  }, [memberId]);

  return <InstallSheet />;
}
