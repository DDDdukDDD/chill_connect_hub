'use client';

import React, { useState } from 'react';
import { X, QrCode, CheckCircle2, Users, Search, UserCheck, ShieldCheck, Zap } from 'lucide-react';
import { EventItem } from '@/data/mockData';

interface GuestItem {
  id: string;
  name: string;
  avatar: string;
  ticketCode: string;
  seatType: string;
  pricePaid: number;
  isCheckedIn: boolean;
  checkInTime?: string;
}

interface HostGuestScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
}

export const HostGuestScannerModal: React.FC<HostGuestScannerModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [guests, setGuests] = useState<GuestItem[]>([
    {
      id: 'g-1',
      name: 'กวินท์ อัศวเดชา (Nut)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      ticketCode: 'CCH-2026-0001',
      seatType: 'Regular Pass',
      pricePaid: 250,
      isCheckedIn: true,
      checkInTime: '14:15 น.',
    },
    {
      id: 'g-2',
      name: 'แพรววา สิริภัทร (Praew)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      ticketCode: 'CCH-2026-0002',
      seatType: 'Regular Pass',
      pricePaid: 250,
      isCheckedIn: false,
    },
    {
      id: 'g-3',
      name: 'ธนกร เจริญผล (Korn)',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
      ticketCode: 'CCH-2026-0003',
      seatType: 'Regular Pass',
      pricePaid: 250,
      isCheckedIn: false,
    },
    {
      id: 'g-4',
      name: 'ชลิตา วงศ์สว่าง (May)',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80',
      ticketCode: 'CCH-2026-0004',
      seatType: 'VIP Early Pass',
      pricePaid: 350,
      isCheckedIn: true,
      checkInTime: '14:22 น.',
    },
  ]);

  const [searchCode, setSearchCode] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCheckInGuest = (guestId: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} น.`;

    setGuests((prev) =>
      prev.map((g) =>
        g.id === guestId ? { ...g, isCheckedIn: true, checkInTime: timeStr } : g
      )
    );
    showToast('✔️ สแกนเช็คอินสำเร็จ! ที่นั่งได้รับการยืนยัน');
  };

  const checkedCount = guests.filter((g) => g.isCheckedIn).length;
  const totalRevenue = guests.reduce((acc, g) => acc + g.pricePaid, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-scale-up p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#4A7C59]/10 border border-[#4A7C59]/30 flex items-center justify-center text-[#4A7C59] shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                👑 Host Door Scanner
              </span>
              <span className="text-xs text-slate-400 font-mono">รายชื่อผู้เข้าร่วม</span>
            </div>
            <h3 className="font-extrabold text-base text-[#1E293B] line-clamp-1 mt-0.5">
              {event.title}
            </h3>
          </div>
        </div>

        {/* Summary Stats Strip */}
        <div className="grid grid-cols-3 gap-2 bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8] text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">เช็คอินแล้ว</span>
            <strong className="text-emerald-700 font-black text-sm">{checkedCount}/{guests.length} คน</strong>
          </div>
          <div className="border-x border-slate-200">
            <span className="text-[10px] text-slate-400 block font-medium">ยอดเงินรวม</span>
            <strong className="text-[#F26430] font-black text-sm">฿{totalRevenue.toLocaleString()}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">สถานะกิจกรรม</span>
            <strong className="text-[#4A7C59] font-black text-sm">🟢 พร้อมจัด</strong>
          </div>
        </div>

        {/* Quick Search / Scan Input */}
        <div className="relative">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="พิมพ์รหัสตั๋ว หรือชื่อผู้เข้าร่วม..."
            className="w-full text-xs p-2.5 pl-8 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#4A7C59] outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
        </div>

        {/* Guest List */}
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {guests
            .filter(
              (g) =>
                g.name.toLowerCase().includes(searchCode.toLowerCase()) ||
                g.ticketCode.toLowerCase().includes(searchCode.toLowerCase())
            )
            .map((guest) => (
              <div
                key={guest.id}
                className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={guest.avatar}
                    alt={guest.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-800 truncate">
                      {guest.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {guest.ticketCode} • {guest.seatType} (฿{guest.pricePaid})
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {guest.isCheckedIn ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{guest.checkInTime || 'เช็คอินแล้ว'}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCheckInGuest(guest.id)}
                      className="bg-[#4A7C59] hover:bg-[#3B6347] text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>เช็คอิน</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="bg-[#1E293B] text-white text-xs p-2.5 rounded-xl text-center font-bold animate-fade-in">
            {toastMsg}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่างตรวจตั๋ว
          </button>
        </div>
      </div>
    </div>
  );
};
