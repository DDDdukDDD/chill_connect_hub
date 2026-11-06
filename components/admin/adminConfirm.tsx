'use client';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';

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
