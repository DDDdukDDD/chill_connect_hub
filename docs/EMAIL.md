# Email (Resend + Cloudflare)

Chillwaa sends three emails today: confirm your email, set a new password, and "you won the draw". The code is in
`lib/members/mailer.ts` and sends through [Resend](https://resend.com). Until `RESEND_API_KEY` and `MAIL_FROM` are set,
nothing is sent, and Production runs with `SKIP_EMAIL_VERIFICATION=true` (every email counts as confirmed), which must go
before launch.

DNS for `chillwaa.com` is on **Cloudflare**.

**Status 2026-11-24:** step 1 done: Email Routing is on (Cloudflare MX + SPF on the root domain), `hello@` and
`privacy@chillwaa.com` forward to `chillwaa.official@gmail.com`, catch-all off; the owner sent test mail to both on
2026-11-25 and it arrived. Steps 2–4 (Resend, Vercel, turning the
skip off) are still to do; until then the live site sends no email and LINE members cannot confirm an email to open ตี้
(BE-468). The three wrong Pending destination addresses were deleted on 2026-11-25 (one destination left). The Resend
domain (Tokyo) shows DKIM and SPF Verified on 2026-11-25, and the DMARC record is live (checked on 1.1.1.1 and 8.8.8.8); keep Resend "Enable receiving" off, because receiving stays on
Cloudflare Email Routing.

## Owner steps

### 1. Receive mail at @chillwaa.com (Cloudflare Email Routing, free)
1. dash.cloudflare.com → `chillwaa.com` → **Email** → **Email Routing** → **Get started** / Enable. Cloudflare adds its
   MX and SPF records on the root domain itself.
2. **Destination addresses** → add the team mailbox (e.g. chillwaa.official@gmail.com) and click the link Cloudflare
   emails to it.
3. **Routing rules** → custom addresses: `hello@chillwaa.com` and `privacy@chillwaa.com` → the team mailbox.

### 2. Send mail from @chillwaa.com (Resend)
1. Sign up at resend.com with the team mailbox. The free plan sends 3,000 emails a month and 100 a day, enough until
   launch; Pro ($20/month, 50,000 a month) once members sign up in numbers.
2. **Domains** → **Add domain** → `chillwaa.com`, region **Tokyo (ap-northeast-1)** (closest to Thailand).
3. Resend lists DNS records: an MX and an SPF TXT on `send.chillwaa.com`, and a DKIM TXT on
   `resend._domainkey.chillwaa.com`. Use **Auto configure** with Cloudflare if offered (it signs in to Cloudflare and adds
   them), or add each by hand in Cloudflare → DNS → Records, with **Proxy status: DNS only** (grey cloud). They sit on
   `send.` and `resend._domainkey`, so they do not touch the Email Routing records on the root domain.
4. Also add in Cloudflare a DMARC record (Gmail and Yahoo expect one): type `TXT`, name `_dmarc`, content
   `v=DMARC1; p=none; rua=mailto:hello@chillwaa.com`.
5. Back in Resend → **Verify DNS records**; wait until the domain shows **Verified** (minutes, sometimes an hour).
6. **API Keys** → **Create API key** → name `Vercel production`, permission **Sending access**, domain `chillwaa.com`.
   Copy it (shown once). Never paste it in chat.

### 3. Vercel (Project → Settings → Environment Variables, **Production** only)
| Name | Value |
| :--- | :--- |
| `RESEND_API_KEY` | the key from step 2.6 |
| `MAIL_FROM` | `Chillwaa <no-reply@chillwaa.com>` |
| `MAIL_REPLY_TO` | `hello@chillwaa.com` (a member who replies reaches the team through step 1) |

Redeploy. Leave `SKIP_EMAIL_VERIFICATION` for now.

### 4. Check, then turn the skip off
1. On www.chillwaa.com, log out, choose "ลืมรหัสผ่าน" with an email account you own: the email should arrive within a
   minute, from "Chillwaa", not in spam, and its button should work.
2. Delete `SKIP_EMAIL_VERIFICATION` from **Production** (keep it on Preview, which has no mailer) and redeploy. New
   members must now confirm their email before posting or joining a ตี้; members confirmed earlier stay confirmed.
3. Sign up a test account with another mailbox you own: the confirm email arrives and its button confirms the account.
   (While the skip was on, sign-up confirmed at once and sent nothing, so this can only be tried now.) Delete the test
   account afterwards in settings.
4. If an email does not arrive: Vercel → Logs, search `[mailer]`; the line says what Resend answered (for example the
   domain is not verified yet).
