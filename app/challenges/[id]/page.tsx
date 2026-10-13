'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, Award, Calendar, Check, Clock, Gift, Share2, Ticket, Trophy, Users, Zap } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { EVIDENCE_HINTS, NOTES_KEY, QuestDetail, SELF_NOTED_HINT, describeQuestRule, getQuestBrandReward, readNotes } from '@/lib/questDisplay';
import { useAuth } from '@/lib/useAuth';
import { useMyRewards } from '@/lib/useMyRewards';
import { useMasterData } from '@/lib/useMasterData';

/**
 * One challenge on its own page. It answers one question for the state the visitor is in:
 * deciding (what is it, what do I get), doing (where do I go next), done (what did I get, where did I go
 * for it, and what could I do next).
 */
const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80';
// Offered when a member stops a challenge; the answer is optional and reaches staff without their name
const LEAVE_REASONS = ['ไม่มีเวลาไปแล้ว', 'ที่ที่นับอยู่ไกลเกินไป', 'ไม่สนใจแล้ว', 'กดร่วมผิด', 'อื่นๆ'];
const SECTION_TITLE ='text-xl sm:text-2xl font-black text-slate-900 tracking-tight';
const BODY = 'text-sm font-medium text-slate-700 leading-relaxed';
const RULE_LABEL = 'text-[11px] sm:text-xs font-semibold text-slate-500';
const shortDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const FACT = 'inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap';

export default function ChallengeDetailPage() {
  const params = useParams();
  const questId = decodeURIComponent((params?.id as string) || '');
  const [activeTab, setActiveTab] = useState('challenges');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const myRewards = useMyRewards(isLoggedIn);
  const { questCategories } = useMasterData();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [justJoined, setJustJoined] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveNote, setLeaveNote] = useState('');
  const [copied, setCopied] = useState(false);

  const [detail, setDetail] = useState<QuestDetail | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [notedProgress, setNotedProgress] = useState(0);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const load = useCallback(async () => {
    if (!questId) return;
    try {
      const data = await fetch(`/api/quests/${encodeURIComponent(questId)}`, { cache: 'no-store' }).then((res) => res.json());
      if (data?.success) {
        setDetail(data);
        setLoadState('ready');
      } else {
        setLoadState('missing');
      }
    } catch {
      setLoadState('missing');
    }
  }, [questId]);

  // The signed-in member's part of the answer changes with the session
  useEffect(() => {
    void load();
  }, [load, isLoggedIn]);

  const quest = detail?.quest;
  const joined = Boolean(detail?.mine?.joined);
  useEffect(() => {
    setNotedProgress(joined ? readNotes()[questId] ?? 0 : 0);
  }, [joined, questId]);

  const chrome = (content: React.ReactNode) => (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        setIsLoggedIn={handleSetIsLoggedIn}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
      />
      {toastMessage && (
        <div role="status" className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-sm font-bold">
          {toastMessage}
        </div>
      )}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 sm:pb-16">
        <Link href="/challenges" className="inline-flex items-center gap-1.5 min-h-10 text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          ชาเลนจ์ทั้งหมด
        </Link>
        {content}
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <RequireMembershipModal
        isOpen={isRequireMembershipOpen}
        onClose={() => setIsRequireMembershipOpen(false)}
        onOpenLogin={() => {
          setIsRequireMembershipOpen(false);
          setIsAuthModalOpen(true);
        }}
        actionTitle="เพื่อร่วมชาเลนจ์และสะสม XP"
      />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={() => handleSetIsLoggedIn(true)} />
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
        }}
      />
    </div>
  );

  if (loadState === 'loading') {
    return chrome(
      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-10" aria-busy="true">
        <div className="aspect-[16/10] rounded-3xl bg-slate-100 animate-pulse" />
        <div className="space-y-4">
          <div className="h-4 w-40 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-10 w-full rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-10 w-2/3 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }
  if (loadState === 'missing' || !detail || !quest) {
    return chrome(
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-200">
        <p className="text-sm font-medium text-slate-700">ไม่พบชาเลนจ์นี้ อาจถูกปิดไปแล้ว</p>
        <Link href="/challenges" className="inline-flex items-center justify-center min-h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold whitespace-nowrap cursor-pointer">
          ดูทั้งหมด
        </Link>
      </div>
    );
  }

  const reward = getQuestBrandReward(quest);
  const isPartner = reward.type === 'brand_partner';
  const tracked = detail.tracked;
  const isEnded = quest.status === 'ended' || (quest.daysRemaining !== undefined && quest.daysRemaining <= 0);
  const points = quest.rewardPoints ?? 0;
  const participants = quest.participantsCount ?? 0;
  const total = (tracked ? detail.mine?.total ?? quest.rule?.count : undefined) ?? (parseInt(quest.total || '3', 10) || 3);
  const current = Math.min(total, tracked ? detail.mine?.current ?? 0 : notedProgress);
  const earned = Boolean(tracked && detail.mine?.completed);
  const selfDone = !tracked && joined && notedProgress >= total;
  const isDoing = joined && !isEnded && !earned;
  const rules = tracked ? describeQuestRule(quest.rule, detail.minEvidence) : null;
  const period = quest.startDate && quest.endDate ? `${quest.startDate} - ${quest.endDate}` : quest.endDate ? `ถึง ${quest.endDate}` : 'ไม่กำหนดวันสิ้นสุด';
  const about = quest.objective && quest.objective !== quest.targetGoal ? quest.objective : '';
  const steps = rules
    ? [
        'กดร่วมชาเลนจ์ในหน้านี้ ไม่มีค่าใช้จ่าย',
        `${rules.goStep.replace('{n}', String(total))}${quest.endDate ? ` ภายในวันที่ ${quest.endDate}` : ''}`,
        `ยืนยันการไปแต่ละครั้ง: ${rules.proof}`,
        isPartner ? 'เมื่อครบ ระบบมอบ XP และออกรหัสรับสิทธิ์ให้ในหน้านี้ทันที' : 'เมื่อครบ ระบบมอบ XP เข้าบัญชีให้ทันที',
      ]
    : ['กดร่วมชาเลนจ์ในหน้านี้ ไม่มีค่าใช้จ่าย', 'ทำตามเป้าหมายของชาเลนจ์ในแบบของคุณ', 'กลับมาบันทึกความคืบหน้าด้วยตนเองในหน้านี้ทุกครั้งที่ทำ'];
  const terms: { label: string; text: string }[] = rules
    ? [
        { label: 'ระยะเวลา', text: `${period} นับเฉพาะการไปในช่วงนี้` },
        { label: 'สิ่งที่นับ', text: rules.scope },
        { label: 'การยืนยัน', text: rules.proof },
        { label: 'การนับ', text: rules.onceEach },
        { label: 'ผู้มีสิทธิ์ร่วม', text: 'สมาชิก Chill & Connect Hub ทุกคน ไม่มีค่าใช้จ่าย' },
        { label: 'การรับรางวัล', text: `ต้องกดร่วมชาเลนจ์ก่อนหมดเขต การไปก่อนกดร่วมที่อยู่ในช่วงเวลานับให้ด้วย${isPartner ? ' รับสิทธิ์ได้ 1 ครั้งต่อ 1 บัญชี' : ''}` },
        { label: 'ผู้จัด', text: reward.partnerName },
      ]
    : [
        { label: 'ระยะเวลา', text: period },
        { label: 'การบันทึก', text: 'บันทึกด้วยตนเองในหน้านี้ ระบบไม่ได้ตรวจสอบให้' },
        { label: 'รางวัล', text: 'ยังไม่มี XP หรือของรางวัลสำหรับชาเลนจ์นี้' },
        { label: 'ผู้มีสิทธิ์ร่วม', text: 'สมาชิก Chill & Connect Hub ทุกคน ไม่มีค่าใช้จ่าย' },
        { label: 'ผู้จัด', text: reward.partnerName },
      ];
  // A challenge about a few named places shows them while deciding too: they are what the challenge is
  const showPlaces = tracked && !earned && detail.targets.length > 0 && (isDoing || detail.targetsTotal <= 6);
  const memories = earned ? detail.mine?.memories ?? [] : [];
  const finishedDate = earned ? shortDate(detail.mine?.finishedAt) : '';
  const next = earned ? detail.next : null;

  const handleJoin = async () => {
    if (!isLoggedIn) {
      setIsRequireMembershipOpen(true);
      return;
    }
    setIsSaving(true);
    const result = await myRewards.joinQuest(quest.id);
    await load();
    setIsSaving(false);
    // Joining is answered on the page itself (what happened, what to do first), not by a passing toast
    if (result.ok) setJustJoined(true);
    else showToast(result.message || 'ร่วมไม่สำเร็จ ลองใหม่อีกครั้งนะ');
  };
  const handleLeave = async () => {
    setIsLeaveOpen(false);
    setJustJoined(false);
    const reason = leaveReason === 'อื่นๆ' ? leaveNote.trim() || 'อื่นๆ' : leaveReason;
    const result = await myRewards.leaveQuest(quest.id, reason || undefined);
    setLeaveReason('');
    setLeaveNote('');
    await load();
    showToast(result.ok ? 'ยกเลิกการทำชาเลนจ์นี้แล้ว' : result.message || 'ทำรายการไม่สำเร็จ ลองใหม่อีกครั้งนะ');
  };
  const handleNote = () => {
    const next = Math.min(total, notedProgress + 1);
    setNotedProgress(next);
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify({ ...readNotes(), [quest.id]: next }));
    } catch {
      // The note still shows until the page is left
    }
    showToast(next >= total ? `บันทึกครบ ${total}/${total} แล้ว เก่งมาก` : `บันทึกแล้ว ${next}/${total}`);
  };
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: quest.title, text: earned ? `ฉันทำชาเลนจ์ "${quest.title}" สำเร็จแล้ว มาลองกัน` : quest.targetGoal || quest.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // One main action for the state the visitor is in
  let mainAction: React.ReactNode = null;
  if (earned) {
    mainAction = (
      <Link href={isPartner ? '/myhub?tab=quests_rewards' : '/rewards'} className={dialogButton.primary}>
        {isPartner ? 'ไปมายฮับ' : 'ไปเลือกของรางวัล'}
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    );
  } else if (isEnded) {
    mainAction = null;
  } else if (!joined) {
    mainAction = (
      <button type="button" onClick={handleJoin} disabled={isSaving} className={dialogButton.primary}>
        {isSaving ? 'กำลังบันทึก…' : 'ร่วมชาเลนจ์นี้'}
      </button>
    );
  } else if (tracked) {
    // Joined and counted by the system: the places are right below, so the only choice left here is to stop
    mainAction = null;
  } else {
    mainAction = (
      <button type="button" onClick={handleNote} disabled={selfDone} className={dialogButton.primary}>
        <Check className="w-4 h-4" aria-hidden="true" />
        บันทึกเอง
      </button>
    );
  }

  return chrome(
    <>
      {/* Hero: the photo carries the feeling; the facts and the one action sit beside it */}
      <section className="mt-2 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:items-center">
        <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-slate-100">
          <img src={quest.badgeCoverImg || quest.image || FALLBACK_PHOTO} alt="" className="w-full h-full object-cover" />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200 shadow-2xs text-[11px] sm:text-xs font-extrabold text-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" aria-hidden="true" />
            ชาเลนจ์
          </span>
        </div>

        <div className="space-y-4 min-w-0">
          {earned && (
            <p className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-extrabold text-emerald-800 tabular-nums">
              <Trophy className="w-4 h-4" aria-hidden="true" />
              ทำสำเร็จแล้ว{finishedDate ? ` · ${finishedDate}` : ''}
            </p>
          )}
          <p className="text-xs sm:text-sm font-semibold text-slate-500">
            {[questCategories.find((category) => category.id === quest.category)?.name, `โดย ${reward.partnerName}`].filter(Boolean).join(' · ')}
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">{quest.title}</h1>
          {quest.targetGoal && <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-prose">{quest.targetGoal}</p>}

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span className={FACT}>
              <Zap className="w-4 h-4 text-[#7C3AED]" aria-hidden="true" />
              <span className="tabular-nums">{tracked ? `+${points.toLocaleString()} XP` : 'บันทึกเอง'}</span>
            </span>
            {!isEnded && quest.daysRemaining !== undefined && (
              <span className={FACT}>
                <Clock className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span className="tabular-nums">เหลือ {quest.daysRemaining} วัน</span>
              </span>
            )}
            {quest.endDate && (
              <span className={FACT}>
                <Calendar className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span className="tabular-nums">ถึง {quest.endDate}</span>
              </span>
            )}
            {participants > 0 && (
              <span className={FACT}>
                <Users className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span className="tabular-nums">{participants.toLocaleString()} คนร่วมทำ</span>
              </span>
            )}
          </div>

          {isEnded && !earned && (
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-sm font-medium text-amber-900">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{joined ? `ชาเลนจ์นี้หมดเขตแล้ว คุณไปได้ ${current}/${total} ครั้งนี้ยังไม่ได้รางวัล ลองดูชาเลนจ์อื่นที่ยังเปิดอยู่นะ` : 'ชาเลนจ์นี้จบไปแล้ว เปิดดูย้อนหลังได้ แต่ร่วมไม่ได้แล้ว'}</span>
            </div>
          )}

          {justJoined && joined && !earned && (
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900" role="status">
              <Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold">ร่วมชาเลนจ์นี้แล้ว</p>
                <p className="text-sm font-medium leading-relaxed">
                  {tracked ? `เริ่มได้เลย: ${EVIDENCE_HINTS[detail.minEvidence ?? 'marked']}` : 'เริ่มได้เลย ทำครบแต่ละครั้งแล้วกลับมากด "บันทึกเอง" ที่หน้านี้'}
                </p>
              </div>
            </div>
          )}

          {(joined || earned) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm font-bold text-slate-800">
                <span>{earned || selfDone ? 'ทำครบแล้ว เก่งมาก' : 'ความคืบหน้าของคุณ'}</span>
                <span className="tabular-nums">{current}/{total}</span>
              </div>
              <div className="h-2 rounded-full bg-[#F5F3FF] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current}>
                <div className="h-full rounded-full bg-[#7C3AED] transition-all duration-300" style={{ width: `${Math.round((current / total) * 100)}%` }} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {mainAction}
            {isDoing && (
              <button type="button" onClick={() => setIsLeaveOpen(true)} className={dialogButton.quiet}>
                ยกเลิกการทำชาเลนจ์
              </button>
            )}
            <button type="button" onClick={handleShare} className={dialogButton.quiet}>
              {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Share2 className="w-4 h-4" aria-hidden="true" />}
              {copied ? 'คัดลอกลิงก์แล้ว' : 'แชร์'}
            </button>
          </div>
        </div>
      </section>

      <div className="mt-10 sm:mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:items-start">
        {/* What you get: the reason to join, so it comes first on a phone and stays in view on a desktop */}
        <aside className={`lg:order-2 space-y-10 ${showPlaces ? '' : 'lg:sticky lg:top-24'}`}>
          {earned && isPartner && detail.mine?.voucherCode ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-3">
              <div className="flex items-start gap-2 text-emerald-800">
                <Ticket className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-extrabold">คุณได้สิทธิ์จาก {reward.partnerName} และเหรียญ {quest.badgeLabel}</p>
                  <p className="text-sm font-medium">{reward.title}</p>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-emerald-200">
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500">รหัสของคุณ แสดงที่หน้าร้าน</p>
                <p className="text-lg sm:text-xl font-black text-slate-900 tabular-nums tracking-wide break-all">{detail.mine.voucherCode}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-800">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  {detail.mine.voucherUsedAt ? 'ใช้สิทธิ์ไปแล้ว' : 'พร้อมใช้งาน'}
                </p>
              </div>
              {reward.exclusiveNotice && <p className="text-xs sm:text-sm font-medium text-emerald-800">{reward.exclusiveNotice}</p>}
            </div>
          ) : earned ? (
            <div className="flex items-start gap-2 p-5 sm:p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <Trophy className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-extrabold">ทำครบแล้ว เก่งมาก</p>
                <p className="text-sm font-medium">
                  <span className="tabular-nums">+{points.toLocaleString()} XP</span> และเหรียญ {quest.badgeLabel} เข้าบัญชีของคุณแล้ว ดูเหรียญได้ในมายฮับ
                </p>
              </div>
            </div>
          ) : tracked ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#F5F3FF] border border-slate-200 space-y-4">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">รางวัลเมื่อทำครบ</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  {isPartner ? <Ticket className="w-5 h-5 mt-0.5 text-[#7C3AED] shrink-0" aria-hidden="true" /> : <Gift className="w-5 h-5 mt-0.5 text-[#7C3AED] shrink-0" aria-hidden="true" />}
                  <span className="min-w-0 space-y-0.5">
                    <span className="block text-sm sm:text-base font-extrabold text-slate-900">{isPartner ? reward.title : 'นำ XP ไปแลกของรางวัลอะไรก็ได้'}</span>
                    {isPartner && reward.exclusiveNotice && <span className="block text-xs sm:text-sm font-medium text-slate-600">{reward.exclusiveNotice}</span>}
                  </span>
                </li>
                {points > 0 && (
                  <li className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-[#7C3AED] shrink-0" aria-hidden="true" />
                    <span className={BODY}>
                      <strong className="font-extrabold text-slate-900 tabular-nums">+{points.toLocaleString()} XP</strong> เข้าบัญชีทันที
                    </span>
                  </li>
                )}
                <li className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#7C3AED] shrink-0" aria-hidden="true" />
                  <span className={BODY}>
                    เหรียญ <strong className="font-extrabold text-slate-900">{quest.badgeLabel}</strong>
                  </span>
                </li>
              </ul>
              <p className="pt-3 border-t border-slate-200 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                {isPartner ? 'ทำครบแล้วรหัสรับสิทธิ์ของคุณจะขึ้นในหน้านี้ ' : 'ทำครบแล้ว XP เข้าบัญชีของคุณเอง '}
                {reward.terms}
              </p>
            </div>
          ) : (
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">ชาเลนจ์แบบบันทึกเอง</h2>
              <p className={BODY}>{SELF_NOTED_HINT}</p>
            </div>
          )}

          {/* The places that count come right after the reward: what you get, then where to go for it */}
          {showPlaces && (
            <section id="places" className={`space-y-4 scroll-mt-24 ${isDoing ? 'order-1' : 'order-4'}`}>
              <div className="flex items-end justify-between gap-3">
                <h2 className={SECTION_TITLE}>ที่ที่นับในชาเลนจ์นี้</h2>
                {detail.browseHref && detail.targetsTotal > detail.targets.length && (
                  <Link href={detail.browseHref} className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline shrink-0">
                    ดูทั้งหมด <span className="tabular-nums">{detail.targetsTotal.toLocaleString()}</span> แห่ง
                  </Link>
                )}
              </div>
              {isDoing && <p className="text-sm font-medium text-slate-600 leading-relaxed">{EVIDENCE_HINTS[detail.minEvidence ?? 'marked']}</p>}
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {detail.targets.map((target) => (
                  <li key={`${target.targetType}:${target.id}`}>
                    <Link href={target.href} className="group block rounded-2xl cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]">
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                        {target.image && <img src={target.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                        {target.visited && (
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 border border-emerald-200 text-[11px] sm:text-xs font-extrabold text-emerald-800">
                            <Check className="w-3 h-3" aria-hidden="true" />
                            นับแล้ว
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-extrabold text-slate-900 line-clamp-2">{target.title}</p>
                      {target.detail && <p className="text-[11px] sm:text-xs font-semibold text-slate-500 tabular-nums truncate">{target.detail}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <div className="lg:order-1 flex flex-col gap-10 min-w-0">
          {/* Done: the places the member went, with their own photos, kept as the memory of the challenge */}
          {memories.length > 0 && (
            <section className="space-y-4 order-1">
              <div className="space-y-1">
                <h2 className={SECTION_TITLE}>ความทรงจำจากชาเลนจ์นี้</h2>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">ที่ที่คุณไปมาจนทำสำเร็จ เรียงตามวันที่ไป</p>
              </div>
              <ol className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {memories.map((memory, index) => (
                  <li key={`${memory.targetType}:${memory.id}`}>
                    <Link href={memory.href} className="group block rounded-2xl cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]">
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                        {memory.image && <img src={memory.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                        <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/95 border border-slate-200 text-xs font-extrabold text-slate-800 flex items-center justify-center tabular-nums" aria-hidden="true">
                          {index + 1}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-extrabold text-slate-900 line-clamp-2">{memory.title}</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-500 tabular-nums truncate">
                        {shortDate(memory.at)}
                        {memory.ownPhoto ? ' · รูปของคุณ' : ''}
                      </p>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Done: one challenge to go on with */}
          {next && (
            <section className="space-y-4 order-1">
              <h2 className={SECTION_TITLE}>ลองชาเลนจ์ถัดไปไหม</h2>
              <Link
                href={`/challenges/${encodeURIComponent(next.id)}`}
                className="group flex items-center gap-4 p-3 rounded-3xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors duration-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                <div className="w-24 sm:w-28 aspect-square rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                  <img src={next.image || FALLBACK_PHOTO} alt="" loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-2">{next.title}</p>
                  {next.rewardTitle && <p className="text-xs sm:text-sm font-medium text-slate-600 line-clamp-1">{next.rewardTitle}</p>}
                  <p className="inline-flex items-center gap-1 text-xs sm:text-sm font-extrabold text-[#5B21B6] tabular-nums">
                    <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                    +{next.rewardPoints.toLocaleString()} XP
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto text-slate-500 shrink-0" aria-hidden="true" />
              </Link>
            </section>
          )}

          <section className="space-y-3 order-2">
            <h2 className={SECTION_TITLE}>รายละเอียดชาเลนจ์</h2>
            <p className={`${BODY} max-w-prose`}>{about || quest.targetGoal || 'ชวนออกไปใช้ชีวิต ลองทำสิ่งใหม่ และเจอผู้คนที่ชอบอะไรคล้ายกัน'}</p>
          </section>

          {!earned && !isEnded && (
            <section className="space-y-4 order-3">
              <h2 className={SECTION_TITLE}>ขั้นตอนการเข้าร่วม</h2>
              <ol className="space-y-3">
                {steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#F5F3FF] text-[#5B21B6] text-sm font-extrabold flex items-center justify-center shrink-0 tabular-nums" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className={`${BODY} pt-1`}>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="space-y-4 order-5">
            <h2 className={SECTION_TITLE}>กติกาและเงื่อนไข</h2>
            <dl className="divide-y divide-slate-200 border-y border-slate-200">
              {terms.map((term) => (
                <div key={term.label} className="grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-x-4 gap-y-0.5 py-3">
                  <dt className={RULE_LABEL}>{term.label}</dt>
                  <dd className="text-sm font-medium text-slate-800 leading-relaxed">{term.text}</dd>
                </div>
              ))}
            </dl>
          </section>

        </div>
      </div>

      {isLeaveOpen && (
        <DialogShell onClose={() => setIsLeaveOpen(false)} size="sm" title="ยกเลิกชาเลนจ์นี้ใช่ไหม" subtitle={tracked ? 'ที่ที่คุณไปมาแล้วยังนับอยู่ กลับมาร่วมใหม่ได้ทุกเมื่อก่อนหมดเขต' : 'กลับมาร่วมใหม่ได้ทุกเมื่อก่อนหมดเขต'}>
          {/* The reason is asked, never demanded: stopping must stay as easy as joining */}
          <fieldset className="mb-5">
            <legend className="text-sm font-bold text-slate-900">บอกเหตุผลสักนิดได้ไหม <span className="font-medium text-slate-500">(ไม่บังคับ)</span></legend>
            <div className="mt-2 space-y-1.5">
              {LEAVE_REASONS.map((reason) => (
                <label key={reason} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium cursor-pointer ${leaveReason === reason ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                  <input type="radio" name="leave-reason" value={reason} checked={leaveReason === reason} onChange={() => setLeaveReason(reason)} className="w-4 h-4 accent-slate-900" />
                  {reason}
                </label>
              ))}
            </div>
            {leaveReason === 'อื่นๆ' && (
              <>
                <label htmlFor="leave-note" className="sr-only">เหตุผลอื่น</label>
                <input
                  id="leave-note"
                  type="text"
                  maxLength={150}
                  value={leaveNote}
                  onChange={(e) => setLeaveNote(e.target.value)}
                  placeholder="เล่าสั้นๆ ได้เลย"
                  className="mt-2 w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] placeholder:text-slate-400"
                />
              </>
            )}
          </fieldset>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
            <button type="button" data-autofocus onClick={() => setIsLeaveOpen(false)} className={dialogButton.quiet}>
              ทำชาเลนจ์ต่อ
            </button>
            <button type="button" onClick={handleLeave} className={dialogButton.secondary}>
              ยืนยันยกเลิก
            </button>
          </div>
        </DialogShell>
      )}
    </>
  );
}
