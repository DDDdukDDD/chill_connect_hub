'use client';

import React, { useState } from 'react';
import { AlertCircle, Camera, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { PhraseText } from '@/components/auth/PhraseText';
import { SAI_FAIRS, SAI_SPOTS } from '@/app/onboarding/OnboardingFlow';
import { nameInitial, tidyDisplayName } from '@/lib/displayName';
import { compressImage } from '@/lib/media/compressor';
import type { MemberPreferences, MemberProfile, ProfileFieldKey, PublicMember } from '@/lib/members/types';
import { useMasterData } from '@/lib/useMasterData';
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
  interests: 'สายที่ชอบ',
};

type TextKey = Exclude<ProfileFieldKey, 'gender' | 'age' | 'province' | 'interests'>;
type TextField = { key: TextKey; placeholder: string; max: number; long?: boolean; options?: string[] };

const ME_FIELDS: TextField[] = [
  { key: 'bio', placeholder: 'เล่าสั้นๆ ว่าคุณเป็นใคร ชอบทำอะไร', max: 240, long: true },
  { key: 'connectGoal', placeholder: 'เช่น เพื่อนวิ่งเช้าวันเสาร์ เพื่อนคุยเรื่องหนังสือ', max: 120 },
];
const ABOUT_FIELDS: TextField[] = [
  { key: 'occupation', placeholder: 'เช่น นักออกแบบ', max: 60 },
  { key: 'workplace', placeholder: 'เช่น ชื่อบริษัทหรือย่านที่ทำงาน', max: 80 },
  { key: 'education', placeholder: 'เช่น คณะหรือสถาบัน', max: 80 },
  { key: 'livingArea', placeholder: 'เช่น อารีย์', max: 60 },
  { key: 'hometown', placeholder: 'เช่น เชียงใหม่', max: 40 },
  { key: 'relationshipStatus', placeholder: '', max: 30, options: ['', 'โสด', 'มีแฟนแล้ว', 'แต่งงานแล้ว'] },
];

export type EditTab = 'me' | 'about' | 'interests';
const TABS: { id: EditTab; label: string }[] = [
  { id: 'me', label: 'ตัวฉัน' },
  { id: 'about', label: 'เกี่ยวกับ' },
  { id: 'interests', label: 'สายที่ชอบ' },
];

const inputClass =
  'w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20';

/** Shown on my profile or hidden: a quiet eye button beside the field */
function VisibilityToggle({ shown, onChange, label }: { shown: boolean; onChange: (shown: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={shown}
      aria-label={`${shown ? 'แสดง' : 'ซ่อน'}${label}บนโปรไฟล์ กดเพื่อ${shown ? 'ซ่อน' : 'แสดง'}`}
      title={shown ? 'คนอื่นเห็นช่องนี้' : 'ซ่อนจากคนอื่น'}
      onClick={() => onChange(!shown)}
      className={`inline-flex items-center gap-1 min-h-8 px-2 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
        shown ? 'text-slate-500 hover:bg-slate-100' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {shown ? <Eye className="w-4 h-4" aria-hidden="true" /> : <EyeOff className="w-4 h-4" aria-hidden="true" />}
      {!shown && 'ซ่อนอยู่'}
    </button>
  );
}

/**
 * Edit my profile in three tabs (owner 2026-10-25): ตัวฉัน (photo, name, intro), เกี่ยวกับ (facts and province) and
 * สายที่ชอบ (interest chips, saved to preferences, so no trip back to onboarding). Every field is optional and has an eye
 * to hide it from others.
 */
export function EditProfileDialog({
  member,
  details,
  preferences,
  initialTab = 'me',
  onPreview,
  onClose,
  onSaved,
}: {
  member: PublicMember;
  details: MemberProfile;
  preferences: MemberPreferences | null;
  initialTab?: EditTab;
  /** Close and show my profile as others see it */
  onPreview?: () => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const master = useMasterData();
  const [tab, setTab] = useState<EditTab>(initialTab);
  const [name, setName] = useState(member.displayName);
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries([...ME_FIELDS, ...ABOUT_FIELDS].map((f) => [f.key, details[f.key] ?? ''])));
  const [hidden, setHidden] = useState<string[]>(details.hidden);
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [province, setProvince] = useState(preferences?.province ?? '');
  // สาย are the ตี้ categories, as asked in onboarding; places and events follow from them on save
  const [sai, setSai] = useState<string[]>(() => preferences?.interests.communityCategories ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const setShown = (key: string, shown: boolean) => setHidden((list) => (shown ? list.filter((k) => k !== key) : [...new Set([...list, key])]));
  const toggleSai = (id: string) => setSai((now) => (now.includes(id) ? now.filter((x) => x !== id) : [...now, id]));

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

  const preferencesChanged = (preferences?.province ?? '') !== province || JSON.stringify(preferences?.interests.communityCategories ?? []) !== JSON.stringify(sai);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setTab('me');
      return setError('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร');
    }
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
      if (preferencesChanged) {
        await memberActions.savePreferences({
          intent: preferences?.intent ?? 'member',
          goals: preferences?.goals ?? [],
          birthYear: preferences?.birthYear,
          gender: preferences?.gender,
          // Same inference as onboarding: the places and events that go with each สาย are added to what was there
          interests: {
            communityCategories: sai,
            spotVibes: [...new Set([...(preferences?.interests.spotVibes ?? []), ...sai.flatMap((id) => SAI_SPOTS[id] ?? [])])],
            fairCategories: [...new Set([...(preferences?.interests.fairCategories ?? []), ...sai.flatMap((id) => SAI_FAIRS[id] ?? [])])],
          },
          province: province || undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
      setBusy(false);
    }
  };

  const textField = (field: TextField) => (
    <div key={field.key} className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`pf-${field.key}`} className="block text-sm font-bold text-slate-800">{FIELD_LABELS[field.key]}</label>
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
  );

  const chosenCount = sai.length;

  return (
    <DialogShell onClose={onClose} size="lg" bare labelledBy="edit-profile-title">
      <form onSubmit={save} className="flex flex-col min-h-0 flex-1">
        <header className="px-5 sm:px-8 pt-6 sm:pt-8 shrink-0 border-b border-slate-100">
          <h2 id="edit-profile-title" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 pr-12">แก้ไขโปรไฟล์</h2>
          <p className="text-sm text-slate-500 font-medium mt-1.5">
            <PhraseText text="ทุกช่องไม่บังคับ กดรูปตาเพื่อซ่อนช่องนั้นจากคนอื่น" />
            {onPreview && (
              <button type="button" onClick={onPreview} className="ml-2 inline-flex items-center gap-1 font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap">
                <Eye className="w-4 h-4" aria-hidden="true" />
                ดูแบบที่คนอื่นเห็น
              </button>
            )}
          </p>
          <div className="mt-4 flex gap-1" role="tablist" aria-label="ส่วนที่แก้ไข">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`min-h-11 px-4 -mb-px border-b-2 text-sm font-bold cursor-pointer transition-colors ${tab === t.id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </header>

        <div className="px-5 sm:px-8 py-6 overflow-y-auto flex-1 space-y-6">
          {tab === 'me' && (
            <>
              <div className="flex items-center gap-4">
                <span className="w-20 h-20 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-br from-[#F26430] to-[#7C3AED] text-white text-2xl font-bold">
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
                <label htmlFor="pf-name" className="block text-sm font-bold text-slate-800">ชื่อที่แสดง</label>
                <input id="pf-name" data-autofocus type="text" autoComplete="nickname" maxLength={40} value={name} onChange={(e) => setName(tidyDisplayName(e.target.value))} className={inputClass} />
              </div>
              {ME_FIELDS.map(textField)}
            </>
          )}

          {tab === 'about' && (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="pf-province" className="block text-sm font-bold text-slate-800">จังหวัด</label>
                  <VisibilityToggle shown={!hidden.includes('province')} onChange={(shown) => setShown('province', shown)} label="จังหวัด" />
                </div>
                <select id="pf-province" value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass}>
                  <option value="">ไม่บอก</option>
                  {master.provinces.map((p) => (
                    <option key={p.id} value={p.id}>{p.displayName}</option>
                  ))}
                </select>
              </div>
              {ABOUT_FIELDS.map(textField)}
              {/* Age and gender come from the answers at sign-up; here they can only be shown or hidden */}
              {(preferences?.birthYear || preferences?.gender) && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-semibold text-slate-500">จากคำตอบตอนเริ่มใช้งาน</p>
                  {preferences?.birthYear && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-800">{FIELD_LABELS.age}</span>
                      <VisibilityToggle shown={!hidden.includes('age')} onChange={(shown) => setShown('age', shown)} label={FIELD_LABELS.age} />
                    </div>
                  )}
                  {preferences?.gender && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-800">{FIELD_LABELS.gender}</span>
                      <VisibilityToggle shown={!hidden.includes('gender')} onChange={(shown) => setShown('gender', shown)} label={FIELD_LABELS.gender} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tab === 'interests' && (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">เป็นสายไหนบ้าง? เลือกได้หลายสาย ใช้แนะนำตี้ ที่เที่ยว และอีเวนต์ที่ตรงใจด้วย</p>
                <VisibilityToggle shown={!hidden.includes('interests')} onChange={(shown) => setShown('interests', shown)} label={FIELD_LABELS.interests} />
              </div>
              {/* The same สาย cards as onboarding's "บอกสิ่งที่ชอบ": icon tile in the สาย's colour, many may be picked */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {master.communityCategories.map((cat) => {
                  const on = sai.includes(cat.id);
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleSai(cat.id)}
                      className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 px-1 py-3 cursor-pointer transition-all ${on ? 'bg-blue-50/70 border-[#2563EB]' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                    >
                      {on && (
                        <span className="absolute -top-2 -right-1.5 w-6 h-6 rounded-full bg-[#2563EB] text-white border-2 border-white flex items-center justify-center" aria-hidden="true">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                      <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${cat.colorScheme.iconBg} ${cat.colorScheme.iconColor}`}>
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-800 text-center leading-tight">
                        {cat.name.split(' & ').map((part, j, all) => (
                          <span key={part} className="block whitespace-nowrap">
                            {part}
                            {j < all.length - 1 ? ' &' : ''}
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
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
            <div className="flex items-center gap-3">
              {tab === 'interests' && <span className="hidden sm:inline text-sm font-semibold text-slate-500 tabular-nums">เลือกแล้ว {chosenCount}</span>}
              <button type="submit" disabled={busy} className={dialogButton.primary}>
                {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {busy ? 'กำลังบันทึก…' : 'บันทึก'}
              </button>
            </div>
          </div>
        </footer>
      </form>
    </DialogShell>
  );
}
