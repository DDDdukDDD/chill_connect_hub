'use client';

import React, { useId, useState } from 'react';
import { MomentAvatar } from '@/components/moments/CommentThread';
import { keepMentioned, typedMention, type Mention } from '@/lib/moments/mentions';

export type MentionPerson = Mention & { avatar?: string };

type Field = HTMLInputElement | HTMLTextAreaElement;

// Friends are the same everywhere on the page; fetched once on the first "@"
let friendsOnce: Promise<MentionPerson[]> | null = null;
const loadFriends = () =>
  (friendsOnce ??= fetch('/api/members/friends', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : { friends: [] }))
    .then((d: { friends?: MentionPerson[] }) => d.friends ?? [])
    .catch(() => {
      friendsOnce = null;
      return [];
    }));

/**
 * Typing "@" in a caption or comment opens a short list of people to name: friends (mutual follows) and `extra`
 * (on a comment: the post's author and people in the thread). Picking one writes "@ชื่อ " into the text; `mentions`
 * is who is still named when it is sent. The server checks the list again (lib/moments/service.ts).
 */
export function useMentionPicker({ value, setValue, fieldRef, extra = [] }: { value: string; setValue: (v: string) => void; fieldRef: React.RefObject<Field | null>; extra?: MentionPerson[] }) {
  const listId = useId();
  const [picked, setPicked] = useState<Mention[]>([]);
  const [friends, setFriends] = useState<MentionPerson[]>([]);
  const [typed, setTyped] = useState<{ start: number; end: number; query: string } | null>(null);
  const [active, setActive] = useState(0);

  const look = (el: Field) => {
    const end = el.selectionStart ?? el.value.length;
    const found = typedMention(el.value, end);
    setTyped(found ? { ...found, end } : null);
    setActive(0);
    if (found) void loadFriends().then(setFriends);
  };

  const query = typed?.query.trim().toLowerCase() ?? '';
  const seen = new Set<string>();
  const options = typed
    ? [...extra, ...friends].filter((p) => p.name && !seen.has(p.id) && seen.add(p.id) && p.name.toLowerCase().includes(query)).slice(0, 6)
    : [];
  const open = options.length > 0;

  const pick = (person: MentionPerson) => {
    if (!typed) return;
    const insert = `@${person.name} `;
    const next = value.slice(0, typed.start) + insert + value.slice(typed.end);
    setValue(next);
    setPicked((list) => [...list.filter((m) => m.id !== person.id), { id: person.id, name: person.name }]);
    setTyped(null);
    const caret = typed.start + insert.length;
    requestAnimationFrame(() => {
      const el = fieldRef.current;
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  };

  const fieldProps = {
    onChange: (e: React.ChangeEvent<Field>) => {
      setValue(e.target.value);
      look(e.target);
    },
    onSelect: (e: React.SyntheticEvent<Field>) => look(e.currentTarget),
    onBlur: () => setTimeout(() => setTyped(null), 150),
    onKeyDown: (e: React.KeyboardEvent<Field>) => {
      if (!open) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        pick(options[active] ?? options[0]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setTyped(null);
      }
    },
    'aria-autocomplete': 'list' as const,
    'aria-controls': open ? listId : undefined,
    'aria-activedescendant': open ? `${listId}-${active}` : undefined,
  };

  const list = open ? (
    <ul id={listId} role="listbox" aria-label="เลือกคนที่จะพูดถึง" className="mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-lg">
      {options.map((person, i) => (
        <li key={person.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(person)}
            className={`flex w-full min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-left text-sm font-semibold text-slate-800 cursor-pointer ${i === active ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
          >
            <MomentAvatar name={person.name} src={person.avatar} className="w-7 h-7 text-[11px]" />
            <span className="min-w-0 truncate">{person.name}</span>
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  return { fieldProps, list, mentions: keepMentioned(value, picked), reset: () => setPicked([]) };
}

/** On a comment: the post's author and the people in the thread, the viewer left out */
export function threadPeople(moment: { authorId?: string | null; userName: string; userAvatar?: string; isMine?: boolean; comments: { authorId?: string | null; userName: string; userAvatar?: string; isMine?: boolean }[] }): MentionPerson[] {
  const people = [{ ...moment }, ...moment.comments].filter((p) => p.authorId && !p.isMine);
  return people.map((p) => ({ id: p.authorId as string, name: p.userName, avatar: p.userAvatar }));
}
