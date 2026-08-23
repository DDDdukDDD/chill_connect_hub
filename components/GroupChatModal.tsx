'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Users, ShieldCheck, Sparkles, MessageCircle, MapPin, Calendar, Smile, Flag, ShieldAlert, Lock, AlertTriangle } from 'lucide-react';
import { EventItem } from '@/data/mockData';
import { ReportSafetyModal } from './ReportSafetyModal';
import { ProfileModal } from './ProfileModal';

interface ChatMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  isHost?: boolean;
  isMe?: boolean;
  time: string;
  text: string;
}

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
}

export const GroupChatModal: React.FC<GroupChatModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportToast, setReportToast] = useState<string | null>(null);
  const [selectedProfileQuery, setSelectedProfileQuery] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize realistic mock messages when opening chat
  useEffect(() => {
    if (event) {
      let subInfo: any = null;
      if (typeof window !== 'undefined') {
        try {
          const stored = JSON.parse(localStorage.getItem('joinedSubActivities') || '{}');
          if (stored[event.id]) {
            subInfo = stored[event.id];
          }
        } catch (e) {
          console.log(e);
        }
      }

      const hostDisplayName = subInfo?.creatorName || event.hostName || 'โฮสต์ประจำกิจกรรม';
      const welcomeText = subInfo
        ? `ยินดีต้อนรับสู่กลุ่ม "${subInfo.subTitle}" ครับ! 🌿 จุดนัดพบ: ${subInfo.meetupPoint || 'ล็อบบี้หน้างาน'} เวลา ${subInfo.subTime} ใครมาถึงแล้วทักแชทบอกได้เลยครับ 😊`
        : `ยินดีต้อนรับทุกคนสู่ "${event.title}" ครับ! 🌿 กิจกรรมนี้เป็นกันเองมาก ใครมาคนเดียวไม่ต้องเกร็งน้า มีจุดนัดพบชัดเจนครับ`;

      setMessages([
        {
          id: 'msg-1',
          senderName: hostDisplayName,
          senderAvatar: event.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
          isHost: true,
          time: '14:20 น.',
          text: welcomeText,
        },
        {
          id: 'msg-2',
          senderName: 'กวินท์ (Nut)',
          senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
          time: '14:25 น.',
          text: 'สวัสดีครับทุกคน! ผมมาคนเดียวครั้งแรก ตื่นเต้นเลยครับ เจอกันหน้างานนะครับ 😊',
        },
        {
          id: 'msg-3',
          senderName: 'แพรววา (Praew)',
          senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
          time: '14:32 น.',
          text: 'สวัสดีค่ะทุกคน เดี๋ยววันงานเราเตรียมขนมไปแบ่งด้วยนะคะ 🎉',
        },
      ]);
    }
  }, [event]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !event) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} น.`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: 'ฉัน (คุณ)',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      isMe: true,
      time: timeStr,
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[600px] max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Top Header */}
        <div className="bg-[#1E293B] text-white p-4 flex items-center justify-between border-b border-slate-700/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                  {event.title}
                </h3>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span>ห้องแชตกลุ่มสมาชิก • โฮสต์: {event.hostName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="text-[11px] font-bold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900 border border-rose-700/60 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer active:scale-95"
              title="รายงานความไม่ปลอดภัย / พฤติกรรมที่ไม่เหมาะสม"
            >
              <Flag className="w-3 h-3" />
              <span className="hidden sm:inline">รายงาน</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="ปิดหน้าต่างแชต"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Member Avatars Strip */}
        <div className="bg-[#FAF7F2] px-4 py-2 border-b border-[#E8E2D8] flex items-center justify-between text-xs text-[#64748B] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1E293B] text-[11px]">สมาชิกในกลุ่ม:</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              <img
                src={event.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                alt="Host"
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                title={`โฮสต์: ${event.hostName}`}
              />
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
                alt="Nut"
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                alt="Praew"
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
              />
            </div>
          </div>

          <span className="text-[10px] font-extrabold bg-[#EBF3ED] text-[#4A7C59] px-2.5 py-0.5 rounded-full border border-[#4A7C59]/20 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#4A7C59]" />
            <span>คอมมูนิตี้ปลอดภัย</span>
          </span>
        </div>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
          {/* Pinned Safety Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200/80 rounded-2xl p-2.5 text-[11px] text-slate-700 flex items-start gap-2 shadow-2xs">
            <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-0.5 text-left">
              <p className="font-bold text-[#1E293B] text-[11px] flex items-center gap-1">
                <span>🛡️ มาตรการความปลอดภัย (Trust & Safety):</span>
              </p>
              <p className="text-[10.5px] text-slate-600 leading-relaxed">
                โปรดนัดพบในพื้นที่เปิดของงานเสมอ ห้ามโอนเงินหรือให้ข้อมูลส่วนตัวทางการเงินนอกระบบ หากพบพฤติกรรมน่าสงสัยสามารถกด <strong>"รายงาน"</strong> ได้ทันที
              </p>
            </div>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!msg.isMe && (
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  onClick={() => setSelectedProfileQuery(msg.senderName)}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 mt-1 cursor-pointer hover:scale-105 transition-transform"
                  title={`คลิกเพื่อดูโปรไฟล์ ${msg.senderName}`}
                />
              )}

              <div className={`space-y-1 max-w-[80%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-1.5 text-[10px] ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                  <span
                    onClick={() => !msg.isMe && setSelectedProfileQuery(msg.senderName)}
                    className={`font-bold text-slate-700 ${!msg.isMe ? 'cursor-pointer hover:text-[#4A7C59] transition-colors' : ''}`}
                  >
                    {msg.senderName}
                  </span>
                  {msg.isHost && (
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                      <span>โฮสต์ยืนยันตัวตน</span>
                    </span>
                  )}
                  <span className="text-slate-400">{msg.time}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.isMe
                      ? 'bg-[#4A7C59] text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompts */}
        <div className="px-3 pt-2 pb-1 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            '👋 สวัสดีครับทุกคน ยินดีที่ได้รู้จักครับ!',
            '📍 เจอกันตรงจุดไหนของงานดีครับ?',
            '🙋 มีใครมาคนเดียวบ้างไหมครับ?',
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickPrompt(prompt)}
              className="text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="พิมพ์ข้อความทักทายเพื่อนๆ ในตี้..."
            className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:bg-white transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-[#4A7C59] hover:bg-[#3B6347] disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
            title="ส่งข้อความ"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Safety Report Modal */}
      <ReportSafetyModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetTitle={event.title}
        targetHostName={event.hostName}
      />

      {/* Quick Profile Modal */}
      {selectedProfileQuery && (
        <ProfileModal
          isOpen={!!selectedProfileQuery}
          onClose={() => setSelectedProfileQuery(null)}
          targetProfileIdOrName={selectedProfileQuery}
        />
      )}
    </div>
  );
};
