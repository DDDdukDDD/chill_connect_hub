'use client';

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { fieldInputClass } from './AdminDrawer';

interface AskTextOptions {
  label: string;
  action?: string;
  type?: 'text' | 'password';
  minLength?: number;
  autoComplete?: string;
}

function AskTextForm({ title, options, finish }: { title: string; options: AskTextOptions; finish: (value: string | null) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (options.minLength && value.length < options.minLength) {
      setError(`ต้องมีอย่างน้อย ${options.minLength} ตัวอักษร`);
      return;
    }
    finish(value);
  };
  return (
    <DialogShell onClose={() => finish(null)} size="sm" layer="top" title={title}>
      <form onSubmit={submit} noValidate className="space-y-4 text-left">
        <div>
          <label htmlFor="admin-ask-text" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">{options.label}</label>
          <input
            id="admin-ask-text"
            type={options.type ?? 'text'}
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(null); }}
            autoComplete={options.autoComplete ?? 'off'}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'admin-ask-text-error' : undefined}
            className={fieldInputClass}
          />
          {error && <p id="admin-ask-text-error" className="mt-1.5 text-xs font-bold text-rose-600">{error}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => finish(null)} className={dialogButton.quiet}>ยกเลิก</button>
          <button type="submit" className={dialogButton.primary}>{options.action ?? 'บันทึก'}</button>
        </div>
      </form>
    </DialogShell>
  );
}

/** One typed answer in the site's own dialog, in place of window.prompt. Resolves to null when cancelled. */
export function askText(title: string, options: AskTextOptions): Promise<string | null> {
  return new Promise((resolve) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const finish = (value: string | null) => {
      root.unmount();
      host.remove();
      resolve(value);
    };
    root.render(<AskTextForm title={title} options={options} finish={finish} />);
  });
}

/**
 * A question before something that cannot be undone, in the site's own dialog (Esc means no, focus starts on
 * the safe choice). Call it from any handler: `if (!(await askConfirm('ลบรายการนี้?'))) return;`
 */
export function askConfirm(message: string, { action = 'ยืนยัน', danger = true }: { action?: string; danger?: boolean } = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const finish = (answer: boolean) => {
      root.unmount();
      host.remove();
      resolve(answer);
    };
    root.render(
      <DialogShell onClose={() => finish(false)} size="sm" layer="top" focusField={false} title={message} showClose={false}>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" data-autofocus onClick={() => finish(false)} className={dialogButton.quiet}>ยกเลิก</button>
          <button type="button" onClick={() => finish(true)} className={danger ? dialogButton.danger : dialogButton.primary}>{action}</button>
        </div>
      </DialogShell>
    );
  });
}
