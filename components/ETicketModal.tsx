'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { EventItem } from '@/data/mockData';
import { Calendar, CheckCircle2, Clock, MapPin, MessageCircle, QrCode, User, Users, X } from 'lucide-react';

interface ETicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  /** Kept for older callers; the real code is read from the account */
  ticketId?: string;
  isCheckedIn?: boolean;
  onCheckIn?: (ticketId: string) => void;
  onOpenChat?: (event: EventItem) => void;
  onOpenCancel?: (event: EventItem, ticketId: string) => void;
}

interface Ticket {
  code: string;
  checkedInAt?: string;
  isHost: boolean;
  /** False for official and sample events: nobody checks tickets there */
  hasHostCheckIn: boolean;
}

/** Decorative emoji in older event tags are not shown on the ticket */
const plain = (value: string) => value.replace(/[\p{Extended_Pictographic}️‍]/gu, '').trim();

/**
 * The member's ticket for an event they joined, read from the account each time it opens.
 * The QR holds the check-in link for this ticket: the host scans it with their phone's camera and the
 * site checks the member in. The 6-character code under it does the same when a scan is not possible.
 */
export const ETicketModal: React.FC<ETicketModalProps> = ({ isOpen, onClose, event, onOpenChat, onOpenCancel }) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'none'>('loading');
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const eventId = event?.id;
  const isFairEvent = event?.eventType === 'public_venue';

  useEffect(() => {
    if (!isOpen || !eventId) return;
    let active = true;
    setState('loading');
    setQr('');
    fetch(`/api/events/${encodeURIComponent(eventId)}/ticket`, { cache: 'no-store' })
      .then((res) => res.json())
      .then(async (json) => {
        if (!active) return;
        const next: Ticket | null = json.ticket ?? null;
        setTicket(next);
        setState(next ? 'ready' : 'none');
        if (next?.code && !next.isHost && !isFairEvent) {
          const link = `${window.location.origin}/checkin?event=${encodeURIComponent(eventId)}&code=${next.code}`;
          const image = await QRCode.toDataURL(link, { width: 480, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0F172A', light: '#FFFFFF' } }).catch(() => '');
          if (active) setQr(image);
        }
      })
      .catch(() => active && setState('none'));
    return () => {
      active = false;
    };
  }, [isOpen, eventId, isFairEvent]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const isFair = event.eventType === 'public_venue';
  const code = ticket?.code || (state === 'loading' ? '······' : '—');
  const needsCheckIn = Boolean(ticket && !ticket.isHost && !isFair);
  const hint =
    state === 'none'
      ? 'ไม่พบบัตรของคุณสำหรับกิจกรรมนี้ ลองเข้าร่วมกิจกรรมอีกครั้ง'
      : ticket?.isHost
      ? 'คุณเป็นคนจัดกิจกรรมนี้ เช็กอินผู้เข้าร่วมได้ที่มายฮับ'
      : ticket?.checkedInAt
      ? 'คนจัดเช็กอินให้คุณแล้ว ขอให้สนุกกับกิจกรรม'
      : needsCheckIn
      ? 'ให้คนจัดสแกน QR นี้ที่จุดนัดพบ หรือบอกรหัสด้านล่าง'
      : 'งานนี้ไม่ต้องเช็กอิน เก็บรหัสไว้เป็นหลักฐานการลงทะเบียน';

  const copy = () => {
    if (!ticket?.code) return;
    navigator.clipboard?.writeText(ticket.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const row = 'flex items-start gap-3';
  const icon = 'w-4 h-4 text-slate-500 shrink-0 mt-0.5';
  const label = 'block text-xs font-semibold text-slate-500';
  const value = 'block text-sm font-bold text-slate-900 leading-snug';
  const action = 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold cursor-pointer whitespace-nowrap transition-colors';

  return (
    <div className="fixed inset-0 z-[100003] flex items-end sm:items-center justify-center sm:p-5 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-title"
        className="relative w-full sm:max-w-2xl max-h-[94dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-base font-extrabold text-slate-900 whitespace-nowrap">บัตรเข้าร่วม</h2>
            {state === 'ready' && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${ticket?.checkedInAt ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {ticket?.checkedInAt && <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                {ticket?.isHost ? 'คนจัด' : ticket?.checkedInAt ? 'เช็กอินแล้ว' : 'ลงทะเบียนแล้ว'}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer" aria-label="ปิด">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12">
          {/* Event details */}
          <div className="sm:col-span-7 p-5 sm:p-6 space-y-4 border-b sm:border-b-0 sm:border-r border-dashed border-slate-300">
            <div>
              <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {isFair ? 'งานแฟร์' : 'กิจกรรมคอมมูนิตี้'}
                {event.tag && plain(event.tag) && !['กิจกรรมคอมมูนิตี้', 'งานแฟร์'].includes(plain(event.tag)) ? ` · ${plain(event.tag)}` : ''}
              </span>
              <h3 id="ticket-title" className="mt-2 text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">{event.title}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={row}>
                <Calendar className={icon} aria-hidden="true" />
                <span className="min-w-0">
                  <span className={label}>วันที่</span>
                  <span className={value}>{event.date}</span>
                </span>
              </div>
              <div className={row}>
                <Clock className={icon} aria-hidden="true" />
                <span className="min-w-0">
                  <span className={label}>เวลา</span>
                  <span className={value}>{event.time || '-'}</span>
                </span>
              </div>
            </div>

            <div className={row}>
              <MapPin className={icon} aria-hidden="true" />
              <span className="min-w-0">
                <span className={label}>สถานที่</span>
                <span className={value}>{event.location}</span>
                {event.meetingPoint && <span className="block mt-1 text-sm font-medium text-slate-600">จุดนัดพบ: {event.meetingPoint}</span>}
              </span>
            </div>

            {event.hostName && (
              <div className={row}>
                <User className={icon} aria-hidden="true" />
                <span className="min-w-0">
                  <span className={label}>{isFair ? 'ผู้จัดงาน' : 'คนจัด'}</span>
                  <span className={value}>{plain(event.hostName)}</span>
                </span>
              </div>
            )}
          </div>

          {/* QR and code */}
          <div className="sm:col-span-5 p-5 sm:p-6 bg-slate-50/70 flex flex-col items-center text-center gap-3">
            {needsCheckIn && (
              <div className="w-44 h-44 sm:w-48 sm:h-48 p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element -- generated in the browser
                  <img src={qr} alt="QR สำหรับให้คนจัดสแกนเพื่อเช็กอิน" className={`w-full h-full ${ticket?.checkedInAt ? 'opacity-40' : ''}`} />
                ) : (
                  <span className="text-xs font-medium text-slate-500">กำลังสร้าง QR…</span>
                )}
              </div>
            )}
            {/* No QR on this ticket: say why, in the place where the QR would be */}
            {state === 'ready' && !needsCheckIn && (
              <div className="w-full p-4 bg-white rounded-2xl border border-slate-200 flex flex-col items-center gap-2">
                <span className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                  {ticket?.isHost ? <Users className="w-5 h-5" aria-hidden="true" /> : <QrCode className="w-5 h-5" aria-hidden="true" />}
                </span>
                <p className="text-sm font-bold text-slate-900">{ticket?.isHost ? 'คุณเป็นคนจัดกิจกรรมนี้' : 'งานแฟร์ไม่ใช้ QR'}</p>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  {ticket?.isHost ? 'ผู้เข้าร่วมจะเปิด QR ให้คุณสแกน เปิดรายชื่อได้ที่มายฮับ ส่วน "กิจกรรมที่คุณจัด"' : 'งานนี้บันทึกไว้ในแผนของคุณแล้ว เข้างานตามเงื่อนไขของผู้จัดงานได้เลย ไม่ต้องเช็กอินกับเรา'}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-500">{needsCheckIn ? 'รหัสบัตร' : 'รหัสลงทะเบียน'}</p>
              <p className="mt-0.5 font-mono text-2xl font-black tracking-[0.2em] text-slate-900" aria-live="polite">{code}</p>
              {ticket?.code && (
                <button type="button" onClick={copy} className="mt-1 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer">
                  {copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}
                </button>
              )}
            </div>
            {(needsCheckIn || state === 'none') && <p className="text-sm font-medium text-slate-600 leading-relaxed">{hint}</p>}
          </div>
        </div>

        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 flex flex-wrap items-center gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${action} bg-slate-100 hover:bg-slate-200 text-slate-700`}
          >
            <MapPin className="w-4 h-4" aria-hidden="true" />
            แผนที่
          </a>
          {onOpenChat && !isFair && state === 'ready' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenChat(event);
              }}
              className={`${action} bg-slate-100 hover:bg-slate-200 text-slate-700`}
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              แชตกลุ่ม
            </button>
          )}
          {onOpenCancel && state === 'ready' && !ticket?.isHost && !ticket?.checkedInAt && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCancel(event, ticket?.code ?? '');
              }}
              className={`${action} ml-auto text-rose-700 hover:bg-rose-50`}
            >
              ยกเลิกการเข้าร่วม
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
