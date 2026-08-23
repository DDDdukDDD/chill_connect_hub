'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserProfile,
  findProfileByIdOrName,
  getConnectedUserIds,
  toggleUserConnect,
} from '@/data/profilesData';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Users,
  Calendar,
  Star,
  MapPin,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfileIdOrName: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  targetProfileIdOrName,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() =>
    findProfileByIdOrName(targetProfileIdOrName)
  );
  const [isConnected, setIsConnected] = useState(false);
  const [connectsCount, setConnectsCount] = useState(profile.connectsCount);

  useEffect(() => {
    if (isOpen) {
      const p = findProfileByIdOrName(targetProfileIdOrName);
      setProfile(p);
      setConnectsCount(p.connectsCount);

      if (typeof window !== 'undefined') {
        const list = getConnectedUserIds();
        setIsConnected(list.includes(p.id));
      }
    }
  }, [isOpen, targetProfileIdOrName]);

  if (!isOpen) return null;

  const handleToggleConnect = () => {
    const res = toggleUserConnect(profile.id);
    setIsConnected(res.isConnected);
    setConnectsCount((prev) => prev + res.countDelta);
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E8E2D8] text-left animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Banner */}
        <div className="relative h-28 sm:h-32 bg-slate-800">
          <img
            src={profile.coverImage}
            alt="Cover"
            className="w-full h-full object-cover opacity-85"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-5 pt-0 relative space-y-4">
          <div className="flex items-end justify-between gap-3 -mt-12 mb-2">
            <div className="relative">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white shrink-0"
              />
              {profile.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-lg border-2 border-white">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* 🤝 Connect Button */}
            <button
              type="button"
              onClick={handleToggleConnect}
              className={`px-4 py-2 rounded-full text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-[#4A7C59] text-white hover:bg-[#3d6849]'
              }`}
            >
              {isConnected ? '🟢 Connected แล้ว' : '🤝 Connect'}
            </button>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-base text-[#1E293B]">{profile.name}</h3>
              {profile.isVerified && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" title="ยืนยันตัวตนผ่านเบอร์โทรและบัตรประชาชนแล้ว (KYC 100%)">
                  ยืนยันตัวตนแล้ว
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-semibold">{profile.username}</p>
          </div>

          <p className="text-xs text-[#475569] leading-relaxed line-clamp-2">
            {profile.bio}
          </p>

          {/* Quick Background Highlights */}
          <div className="space-y-1 text-[11px] text-slate-700 bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8]">
            {profile.workplace && (
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-slate-400">💼 ที่ทำงาน:</span>
                <span className="font-bold text-[#1E293B] truncate">{profile.workplace}</span>
              </div>
            )}
            {profile.education && (
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-slate-400">🎓 การศึกษา:</span>
                <span className="font-semibold text-slate-800 truncate">{profile.education}</span>
              </div>
            )}
            <div className="flex items-center gap-3 pt-0.5 text-slate-600 font-medium">
              {profile.gender && <span>🚻 {profile.gender}</span>}
              {profile.birthday && <span>🎂 {profile.birthday}</span>}
            </div>
            {profile.relationshipStatus && (
              <div className="flex items-center gap-1.5 pt-0.5 truncate text-[10.5px]">
                <span className="text-slate-400">💬 สถานะ:</span>
                <span className="font-bold text-pink-600 truncate">{profile.relationshipStatus}</span>
              </div>
            )}
            {profile.connectGoal && (
              <div className="flex items-center gap-1.5 truncate text-[10.5px]">
                <span className="text-slate-400">🎯 เป้าหมาย:</span>
                <span className="font-bold text-[#1E293B] truncate">{profile.connectGoal}</span>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Connects</span>
              <span className="text-sm font-black text-[#1E293B]">{connectsCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">จัดกิจกรรม</span>
              <span className="text-sm font-black text-[#1E293B]">{profile.hostedCount} ครั้ง</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">รีวิว</span>
              <span className="text-sm font-black text-amber-600 flex items-center justify-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{profile.rating}</span>
              </span>
            </div>
          </div>

          {/* Bottom Full Profile Link */}
          <Link
            href={`/profile?id=${profile.id}`}
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-[#FAF7F2] hover:bg-orange-50 text-slate-700 hover:text-[#F26430] border border-[#E8E2D8] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>ดูโปรไฟล์แบบเต็ม</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};
