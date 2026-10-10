/**
 * Transactional email for member accounts. Sends through Resend (https://resend.com) when
 * RESEND_API_KEY and MAIL_FROM are set; otherwise nothing is sent and callers fall back to the
 * development behaviour (the link is logged on the server).
 */
export function isMailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export async function sendMail(input: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  if (!isMailerConfigured()) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [input.to], subject: input.subject, html: input.html, text: input.text }),
    });
    if (!res.ok) console.error('[mailer] Resend responded', res.status);
    return res.ok;
  } catch (error) {
    console.error('[mailer] send failed', error);
    return false;
  }
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function verifyEmailMessage(name: string, url: string, hours: number) {
  const safeName = escapeHtml(name);
  return {
    subject: 'ยืนยันอีเมลของคุณ · Chill & Connect Hub',
    text: `สวัสดีคุณ ${name}\n\nกดลิงก์นี้เพื่อยืนยันอีเมล (ใช้ได้ ${hours} ชั่วโมง):\n${url}\n\nถ้าคุณไม่ได้สมัครสมาชิก ไม่ต้องทำอะไร`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;color:#1e293b">
<p>สวัสดีคุณ ${safeName}</p>
<p>กดปุ่มด้านล่างเพื่อยืนยันอีเมล แล้วเริ่มโพสต์และเข้าร่วมกิจกรรมได้เลย ลิงก์ใช้ได้ ${hours} ชั่วโมง</p>
<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#2563EB;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">ยืนยันอีเมล</a></p>
<p style="color:#64748b;font-size:13px">ถ้าคุณไม่ได้สมัครสมาชิก ไม่ต้องทำอะไร</p>
</div>`,
  };
}

export function passwordResetEmail(name: string, url: string, minutes: number) {
  const safeName = escapeHtml(name);
  return {
    subject: 'ตั้งรหัสผ่านใหม่ · Chill & Connect Hub',
    text: `สวัสดีคุณ ${name}\n\nกดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ (ใช้ได้ ${minutes} นาที และใช้ได้ครั้งเดียว):\n${url}\n\nถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;color:#1e293b">
<p>สวัสดีคุณ ${safeName}</p>
<p>กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ ลิงก์ใช้ได้ ${minutes} นาทีและใช้ได้ครั้งเดียว</p>
<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#2563EB;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">ตั้งรหัสผ่านใหม่</a></p>
<p style="color:#64748b;font-size:13px">ถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้</p>
</div>`,
  };
}
