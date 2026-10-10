'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Camera, Eye, EyeOff, Loader2 } from 'lucide-react';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { PhraseText } from '@/components/auth/PhraseText';
import { nameInitial, tidyDisplayName } from '@/lib/displayName';
import { compressImage } from '@/lib/media/compressor';
import type { MemberPreferences, MemberProfile, ProfileFieldKey, PublicMember } from '@/lib/members/types';
import { memberActions } from '@/lib/useMemberSession';

/** Labels for everything that can appear on a public profile */
export const FIELD_LABELS: Record<ProfileFieldKey, string> = {
  bio: 'แนะนำตัว',
  occupation: 'อาชีพ',
  workplace: 'ที่ทำงาน',
  education: 'การศึกษา',
  hometown: 'บ้านเกิด',
  livingArea: 'ย่านที่อยู่',
  relationshipStatus: 'สถานะ',
  connectGoal: 'อยากเจอคนแบบไหน',
  gender: 'เพศ',
  age: 'ช่วงอายุ',
  province: 'จังหวัด',
  interests: 'ความสนใจ',
};

const TEXT_FIELDS: { key: Exclude<ProfileFieldKey, 'gender' | 'age' | 'province' | 'interests'>; placeholder: string; max: number; long?: boolean; options?: string[] }[] = [
  { key: 'bio', placeholder: 'เล่าสั้นๆ ว่าคุณเป็นใคร ชอบทำอะไร', max: 240, long: true },
  { key: 'connectGoal', placeholder: 'เช่น เพื่อนวิ่งเช้าวันเสาร์ เพื่อนคุยเรื่องหนังสือ', max: 120 },
  { key: 'occupation', placeholder: 'เช่น นักออกแบบ', max: 60 },
  { key: 'workplace', placeholder: 'เช่น ชื่อบริษัทหรือย่านที่ทำงาน', max: 80 },
  { key: 'education', placeholder: 'เช่น คณะหรือสถาบัน', max: 80 },
  { key: 'hometown', placeholder: 'เช่น เชียงใหม่', max: 40 },
  { key: 'livingArea', placeholder: 'เช่น อารีย์', max: 60 },
  { key: 'relationshipStatus', placeholder: '', max: 30, options: ['', 'โสด', 'มีแฟนแล้ว', 'แต่งงานแล้ว'] },
];

const inputClass =
  'w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20';

function VisibilityToggle({ shown, onChange, label }: { shown: boolean; onChange: (shown: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={shown}
      aria-label={`${shown ? 'แสดง' : 'ซ่อน'}${label}บนโปรไฟล์`}
      onClick={() => onChange(!shown)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
        shown ? 'bg-blue-50 text-[#1D4ED8]' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {shown ? <Eye className="w-3.5 h-3.5" aria-hidden="true" /> : <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />}
      {shown ? 'แสดงอยู่' : 'ซ่อนอยู่'}
    </button>
  );
}

export function EditProfileDialog({
  member,
  details,
  preferences,
  onClose,
  onSaved,
}: {
  member: PublicMember;
  details: MemberProfile;
  preferences: MemberPreferences | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(member.displayName);
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(TEXT_FIELDS.map((f) => [f.key, details[f.key] ?? ''])));
  const [hidden, setHidden] = useState<string[]>(details.hidden);
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const setShown = (key: string, shown: boolean) => setHidden((list) => (shown ? list.filter((k) => k !== key) : [...new Set([...list, key])]));

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.85, targetMimeType: 'image/webp' });
      setPhoto({ file: compressed, preview: URL.createObjectURL(compressed) });
    } catch {
      setError('ใช้รูปนี้ไม่ได้ ลองเลือกรูปอื่น (JPG, PNG หรือ WebP)');
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร');
    setBusy(true);
    setError('');
    try {
      let avatarUrl: string | undefined;
      if (photo) {
        const form = new FormData();
        form.append('file', photo.file);
        form.append('folder', 'avatars');
        const upload = await fetch('/api/upload', { method: 'POST', body: form }).then((r) => r.json()).catch(() => null);
        if (!upload?.success || !upload.url) throw new Error(upload?.error || 'อัปโหลดรูปไม่สำเร็จ');
        avatarUrl = upload.url;
      }
      await memberActions.saveProfile({ displayName: name.trim(), ...(avatarUrl && { avatarUrl }), ...values, hidden });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
      setBusy(false);
    }
  };

  const answerRows: { key: ProfileFieldKey; has: boolean }[] = [
    { key: 'interests', has: Boolean(preferences) },
    { key: 'province', has: Boolean(preferences?.province) },
    { key: 'age', has: Boolean(preferences?.birthYear) },
    { key: 'gender', has: Boolean(preferences?.gender) },
  ];

  return (
    <DialogShell onClose={onClose} size="lg" bare labelledBy="edit-profile-title">
      <form onSubmit={save} className="flex flex-col min-h-0 flex-1">
        <header className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-slate-100 shrink-0">
          <h2 id="edit-profile-title" className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 pr-12">แก้ไขโปรไฟล์</h2>
          <p className="text-sm text-slate-500 font-medium mt-1.5">
            <PhraseText text="ทุกช่องไม่บังคับ คุณเลือกได้ว่า จะให้คนอื่นเห็นช่องไหน" />
          </p>
        </header>

        <div className="px-5 sm:px-8 py-5 overflow-y-auto flex-1 space-y-6">
          <div className="flex items-center gap-4">
            <span className="w-20 h-20 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#2563EB] text-white text-2xl font-black">
              {photo || member.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- member photo (local preview or uploaded file)
                <img src={photo?.preview ?? member.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                nameInitial(name, 'C')
              )}
            </span>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap">
              <Camera className="w-4 h-4" aria-hidden="true" />
              {member.avatarUrl || photo ? 'เปลี่ยนรูป' : 'เพิ่มรูป'}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={pickPhoto} />
            </label>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pf-name" className="block text-xs sm:text-sm font-bold text-slate-800">ชื่อที่แสดง</label>
            <input id="pf-name" data-autofocus type="text" autoComplete="nickname" maxLength={40} value={name} onChange={(e) => setName(tidyDisplayName(e.target.value))} className={inputClass} />
          </div>

          {TEXT_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={`pf-${field.key}`} className="block text-xs sm:text-sm font-bold text-slate-800">{FIELD_LABELS[field.key]}</label>
                <VisibilityToggle shown={!hidden.includes(field.key)} onChange={(shown) => setShown(field.key, shown)} label={FIELD_LABELS[field.key]} />
              </div>
              {field.options ? (
                <select id={`pf-${field.key}`} value={values[field.key]} onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))} className={inputClass}>
                  {field.options.map((option) => (
                    <option key={option || 'none'} value={option}>{option || 'ไม่บอก'}</option>
                  ))}
                </select>
              ) : field.long ? (
                <textarea id={`pf-${field.key}`} rows={3} maxLength={field.max} value={values[field.key]} onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))} placeholder={field.placeholder} className={inputClass} />
              ) : (
                <input id={`pf-${field.key}`} type="text" maxLength={field.max} value={values[field.key]} onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))} placeholder={field.placeholder} className={inputClass} />
              )}
            </div>
          ))}

          <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-900">จากคำตอบตอนเริ่มใช้งาน</h3>
              <Link href="/onboarding?returnTo=%2Fprofile" className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap">แก้คำตอบ</Link>
            </div>
            {answerRows.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">
                  {FIELD_LABELS[row.key]}
                  {!row.has && <span className="text-slate-400 font-medium"> · ยังไม่ได้ตอบ</span>}
                </span>
                <VisibilityToggle shown={!hidden.includes(row.key)} onChange={(shown) => setShown(row.key, shown)} label={FIELD_LABELS[row.key]} />
              </div>
            ))}
          </div>
        </div>

        <footer className="px-5 sm:px-8 py-4 border-t border-slate-100 shrink-0 space-y-3">
          {error && (
            <p role="alert" className="flex items-start gap-2 text-sm font-bold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span><PhraseText text={error} /></span>
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} className={dialogButton.quiet}>ยกเลิก</button>
            <button type="submit" disabled={busy} className={dialogButton.primary}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {busy ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
          </div>
        </footer>
      </form>
    </DialogShell>
  );
}
