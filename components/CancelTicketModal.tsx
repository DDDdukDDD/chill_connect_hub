'use client';

import React, { useState } from 'react';
import { EventItem } from '@/data/mockData';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';

interface CancelTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  ticketId: string;
  /** Called when the member confirms; the caller does the cancelling and closes the dialog */
  onConfirmCancel: (ticketId: string, reason: string) => void | Promise<void>;
}

const POLICY_TEXT: Record<string, string> = {
  free_anytime: 'ยกเลิกได้ตลอดเวลา ไม่มีค่าใช้จ่าย',
  free_48h: 'ยกเลิกฟรีก่อนตี้เริ่ม 48 ชั่วโมง',
  free_24h: 'ยกเลิกฟรีก่อนตี้เริ่ม 24 ชั่วโมง',
  chat_notice: 'แจ้งคนจัดในแชตกลุ่มก่อนยกเลิกด้วยนะ',
};

/** Confirms leaving an event. One clear question; the seat goes back to the others. */
export const CancelTicketModal: React.FC<CancelTicketModalProps> = ({ isOpen, onClose, event, ticketId, onConfirmCancel }) => {
  const [isBusy, setIsBusy] = useState(false);
  if (!isOpen || !event) return null;

  const isFair = event.eventType === 'public_venue';
  const policy = event.cancellationPolicy ? POLICY_TEXT[event.cancellationPolicy] : undefined;

  const confirm = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await onConfirmCancel(ticketId, '');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <DialogShell onClose={onClose} title={isFair ? 'เอางานนี้ออกจากแผนไหม' : 'ยกเลิกการเข้าร่วมไหม'} subtitle={event.title} size="sm">
      <ul className="space-y-2 mb-5 text-sm font-medium text-slate-600 leading-relaxed">
        <li>{isFair ? 'งานนี้จะไม่อยู่ในนัดหมายของคุณ บันทึกใหม่ได้ทุกเมื่อ' : 'ที่นั่งของคุณจะคืนให้คนอื่นทันที ถ้าเปลี่ยนใจต้องเข้าร่วมใหม่ และอาจเต็มแล้ว'}</li>
        {!isFair && policy && <li>{policy}</li>}
      </ul>
      <div className="flex flex-wrap justify-end gap-2.5">
        <button type="button" className={dialogButton.quiet} onClick={onClose}>
          {isFair ? 'เก็บไว้' : 'ไม่ยกเลิก'}
        </button>
        <button type="button" className={dialogButton.danger} disabled={isBusy} onClick={confirm}>
          {isBusy ? 'กำลังยกเลิก…' : isFair ? 'เอาออกจากแผน' : 'ยกเลิกการเข้าร่วม'}
        </button>
      </div>
    </DialogShell>
  );
};
