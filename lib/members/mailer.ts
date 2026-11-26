import { SITE_URL } from '../site';
import { tidyDisplayName } from '../displayName';

/**
 * Transactional email for member accounts, sent through Resend (https://resend.com).
 * Env: RESEND_API_KEY and MAIL_FROM ("Chillwaa <no-reply@chillwaa.com>", on a domain verified in Resend); optional
 * MAIL_REPLY_TO (where a member's reply goes). Without the first two nothing is sent and callers fall back to the
 * development behaviour (the link is logged on the server). Steps for the owner: docs/EMAIL.md.
 */
export function isMailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

const SEND_TIMEOUT_MS = 8000;

export async function sendMail(input: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  if (!isMailerConfigured()) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [input.to],
        ...(process.env.MAIL_REPLY_TO ? { reply_to: process.env.MAIL_REPLY_TO } : {}),
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    // Resend says why ("domain is not verified", "invalid from"); its answer never holds the message or the address
    if (!res.ok) console.error('[mailer] Resend responded', res.status, (await res.text().catch(() => '')).slice(0, 200));
    return res.ok;
  } catch (error) {
    console.error('[mailer] send failed', error);
    return false;
  }
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * "สวัสดีคุณแนน", never "สวัสดีคุณ คุณแนน" (many display names already start with คุณ); a Latin name gets a space
 * ("สวัสดีคุณ Duke"); the part in brackets is left out, as on the Circle row
 */
function greeting(name: string): string {
  const tidy = tidyDisplayName(name).trim() || name.trim();
  const clean = tidy.replace(/\s*\(.*$/, '') || tidy;
  if (clean.startsWith('คุณ')) return `สวัสดี${clean}`;
  return /^[฀-๿]/.test(clean) ? `สวัสดีคุณ${clean}` : `สวัสดีคุณ ${clean}`;
}

const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');
const FOOTER_TEXT = `\n\n—\nChillwaa · ${SITE_HOST}\nทีมงานไม่ขอรหัสผ่าน รหัส OTP หรือเงินทางอีเมล`;

/**
 * One look for every email: the logo and name on top, the message, one blue button (DESIGN_SYSTEM primary), and a
 * footer that says where it came from. Tables and inline styles only, as mail apps strip the rest.
 */
function layout(input: { title: string; lines: string[]; button: { label: string; url: string }; note: string }): string {
  const paragraphs = input.lines.map((line) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#1e293b">${line}</p>`).join('');
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${input.title}</title></head>
<body style="margin:0;padding:0;background:#f8fafc">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;table-layout:fixed;background:#ffffff;border-radius:20px;font-family:'Noto Sans Thai',Tahoma,Arial,sans-serif">
<tr><td style="padding:28px 24px 20px">
<a href="${SITE_URL}" style="text-decoration:none;color:#0f172a"><img src="${SITE_URL}/icons/icon-192.png" width="36" height="36" alt="" style="vertical-align:middle;border-radius:10px;border:0">
<span style="vertical-align:middle;font-size:18px;font-weight:bold;margin-left:8px;color:#0f172a">Chillwaa</span></a>
</td></tr>
<tr><td style="padding:0 24px 24px">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.4;color:#0f172a">${input.title}</h1>
${paragraphs}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px"><tr><td style="background:#2563EB;border-radius:999px">
<a href="${escapeHtml(input.button.url)}" style="display:inline-block;padding:13px 26px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none">${input.button.label}</a>
</td></tr></table>
<p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#64748b">ถ้าปุ่มกดไม่ได้ คัดลอกลิงก์นี้ไปเปิดในเบราว์เซอร์</p>
<p style="margin:0 0 20px;font-size:13px;line-height:1.5;word-break:break-all"><a href="${escapeHtml(input.button.url)}" style="color:#2563EB">${escapeHtml(input.button.url)}</a></p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#64748b">${input.note}</p>
</td></tr>
<tr><td style="padding:16px 24px 24px;border-top:1px solid #e2e8f0">
<p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8">Chillwaa · <a href="${SITE_URL}" style="color:#94a3b8">${SITE_HOST}</a><br>ทีมงานไม่ขอรหัสผ่าน รหัส OTP หรือเงินทางอีเมล</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function verifyEmailMessage(name: string, url: string, hours: number) {
  const hello = greeting(name);
  return {
    subject: 'ยืนยันอีเมลของคุณ · Chillwaa',
    text: `${hello}\n\nกดลิงก์นี้เพื่อยืนยันอีเมล แล้วเริ่มโพสต์และเข้าร่วมตี้กับเพื่อนๆ ได้เลย (ลิงก์ใช้ได้ ${hours} ชั่วโมง):\n${url}\n\nถ้าคุณไม่ได้สมัครสมาชิก ไม่ต้องทำอะไร${FOOTER_TEXT}`,
    html: layout({
      title: 'ยืนยันอีเมลของคุณ',
      lines: [escapeHtml(hello), `อีกขั้นเดียว กดปุ่มด้านล่างเพื่อยืนยันอีเมล แล้วเริ่มโพสต์และเข้าร่วมตี้กับเพื่อนๆ ได้เลย ลิงก์ใช้ได้ ${hours} ชั่วโมง`],
      button: { label: 'ยืนยันอีเมล', url },
      note: 'ถ้าคุณไม่ได้สมัครสมาชิก ไม่ต้องทำอะไร',
    }),
  };
}

export function passwordResetEmail(name: string, url: string, minutes: number) {
  const hello = greeting(name);
  return {
    subject: 'ตั้งรหัสผ่านใหม่ · Chillwaa',
    text: `${hello}\n\nกดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ (ใช้ได้ ${minutes} นาที และใช้ได้ครั้งเดียว):\n${url}\n\nถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้${FOOTER_TEXT}`,
    html: layout({
      title: 'ตั้งรหัสผ่านใหม่',
      lines: [escapeHtml(hello), `กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ ลิงก์ใช้ได้ ${minutes} นาทีและใช้ได้ครั้งเดียว`],
      button: { label: 'ตั้งรหัสผ่านใหม่', url },
      note: 'ถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้',
    }),
  };
}
