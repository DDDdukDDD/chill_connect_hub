'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { CreateEventModal as Dialog } from '@/components/CreateEventModal';

export type { PlacePick } from '@/components/CreateEventModal';

// The create dialog is big (~80 KB) and most visits never open it, so its code loads on the first open (2026-10-28)
const Loaded = dynamic(() => import('@/components/CreateEventModal').then((m) => m.CreateEventModal), { ssr: false });

/** Same props as components/CreateEventModal.tsx; renders nothing until it is opened, as that one does */
export const CreateEventModal: typeof Dialog = (props) => (props.isOpen ? <Loaded {...props} /> : null);
