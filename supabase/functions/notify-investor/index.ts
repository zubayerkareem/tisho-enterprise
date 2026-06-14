const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ─── Supabase REST (no SDK import needed) ─────────────────────────────────────

async function getUserEmail(userId: string): Promise<{ email: string; name: string } | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=email,name&id=eq.${userId}&limit=1`,
    { headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'apikey': SUPABASE_SERVICE_KEY } },
  )
  const rows = await res.json()
  return rows[0] ?? null
}

async function getThreadUser(threadId: string): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/support_threads?select=user_id&id=eq.${threadId}&limit=1`,
    { headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'apikey': SUPABASE_SERVICE_KEY } },
  )
  const rows = await res.json()
  return rows[0]?.user_id ?? null
}

// ─── Native Deno SMTP over TLS port 465 ───────────────────────────────────────

function b64(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function wrapLines(s: string, width = 76): string {
  const out: string[] = []
  for (let i = 0; i < s.length; i += width) out.push(s.slice(i, i + width))
  return out.join('\r\n')
}

async function smtpRead(conn: Deno.TlsConn): Promise<string> {
  const dec = new TextDecoder()
  let buf = ''
  const chunk = new Uint8Array(4096)
  while (true) {
    const n = await conn.read(chunk)
    if (n === null) break
    buf += dec.decode(chunk.subarray(0, n))
    if (/\r\n/.test(buf)) {
      const lines = buf.trimEnd().split('\r\n')
      const last = lines[lines.length - 1]
      if (/^\d{3} /.test(last)) break
    }
  }
  return buf
}

async function sendMail(to: string, subject: string, html: string) {
  const smtpUser = Deno.env.get('SMTP_USER')!
  const smtpPass = Deno.env.get('SMTP_PASS')!
  const enc = new TextEncoder()
  const conn = await Deno.connectTls({ hostname: 'smtp.gmail.com', port: 465 })

  async function cmd(line: string): Promise<string> {
    await conn.write(enc.encode(line + '\r\n'))
    return smtpRead(conn)
  }

  try {
    await smtpRead(conn)
    await cmd('EHLO tishoenterprises.com')
    await cmd('AUTH LOGIN')
    await cmd(b64(smtpUser))
    const authResp = await cmd(b64(smtpPass))
    if (!authResp.startsWith('235')) throw new Error('SMTP auth failed: ' + authResp)
    await cmd(`MAIL FROM:<${smtpUser}>`)
    await cmd(`RCPT TO:<${to}>`)
    await cmd('DATA')
    const message = [
      `From: =?UTF-8?B?${b64('Tisho Enterprises')}?= <${smtpUser}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${b64(subject)}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      wrapLines(b64(html)),
      '.',
    ].join('\r\n') + '\r\n'
    await conn.write(enc.encode(message))
    await smtpRead(conn)
    await cmd('QUIT')
  } finally {
    conn.close()
  }
}

// ─── Email template ───────────────────────────────────────────────────────────

function emailHtml(subject: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f7f9f8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9f8;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="background:#003819;border-radius:16px 16px 0 0;padding:28px 32px;">
  <img src="https://dashboard.tishoenterprises.com/logos/logo-side-white.svg" alt="Tisho Enterprises" style="height:36px;display:block;" />
</td></tr>
<tr><td style="background:#fff;padding:32px;border-left:1px solid #e4e7e5;border-right:1px solid #e4e7e5;">
  ${bodyHtml}
</td></tr>
<tr><td style="background:#f7f9f8;border:1px solid #e4e7e5;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
  <p style="margin:0;font-size:12px;color:#7a8a82;">Tisho Enterprises Ltd &middot; 86-90 Paul Street, London, EC2A 4NE<br/>
  <a href="https://dashboard.tishoenterprises.com" style="color:#003819;">Investor Portal</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function h1(t: string) { return `<h1 style="margin:0 0 8px;font-size:22px;color:#002c14;font-weight:700;">${t}</h1>` }
function p(t: string) { return `<p style="margin:0 0 16px;font-size:15px;color:#4a5d54;line-height:1.6;">${t}</p>` }
function cta(t: string) { return `<p style="margin:24px 0 0;text-align:center;"><a href="https://dashboard.tishoenterprises.com" style="display:inline-block;background:#003819;color:#c3f63c;text-decoration:none;border-radius:999px;padding:12px 28px;font-size:15px;font-weight:700;">${t}</a></p>` }

function infoTable(rows: [string, string][]): string {
  const trs = rows.map(([l, v]) => `<tr><td style="padding:8px 0;font-size:13px;color:#7a8a82;width:40%;">${l}</td><td style="padding:8px 0;font-size:13px;color:#002c14;font-weight:600;">${v}</td></tr>`).join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9f8;border-radius:12px;padding:4px 16px;margin:16px 0;">${trs}</table>`
}

function gbp(pence: number) { return '£' + (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 }) }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) }

// ─── Email builders ───────────────────────────────────────────────────────────

function buildInvestmentEmail(record: any, old_record: any, type: string) {
  const isNew = type === 'INSERT'
  const changed = !isNew && old_record?.status !== record.status

  if (isNew) return {
    subject: 'Investment Request Received — Tisho Enterprises',
    body: h1('Investment Request Received') +
      p('Thank you — we have received your investment request and it is currently under review. You will be notified once it is activated.') +
      infoTable([
        ['Policy', record.label ?? '—'],
        ['Amount', gbp(record.amount_pence)],
        ['Term', `${record.months_total} months`],
        ['Rate', `${record.rate_percent}% ${record.type === 'compact' ? 'per month' : 'per year'}`],
        ['Payment', record.payment_method === 'bank' ? 'Bank Transfer' : 'Stripe'],
      ]) + cta('View in Portal →'),
  }

  if (changed && record.status === 'active') return {
    subject: 'Investment Activated — Tisho Enterprises',
    body: h1('Your Investment is Now Active!') +
      p('Great news — your investment has been reviewed and activated.') +
      infoTable([
        ['Policy', record.label ?? '—'],
        ['Amount', gbp(record.amount_pence)],
        ['Start date', fmtDate(record.start_date)],
        ['End date', fmtDate(record.end_date)],
        ['Next payment', record.next_payment_date ? fmtDate(record.next_payment_date) : '—'],
      ]) + cta('View Dashboard →'),
  }

  if (changed && record.status === 'completed') return {
    subject: 'Investment Completed — Tisho Enterprises',
    body: h1('Investment Term Completed') +
      p('Your 24-month investment term has now ended. Thank you for investing with Tisho Enterprises.') +
      infoTable([['Policy', record.label ?? '—'], ['Amount invested', gbp(record.amount_pence)]]) +
      p('Please visit the portal to re-invest.') + cta('View Portal →'),
  }

  return null
}

function buildPaymentEmail(record: any) {
  return {
    subject: `Payment Received: ${gbp(record.amount_pence)} — Tisho Enterprises`,
    body: h1('Payment Received') +
      p(`A payment of <strong>${gbp(record.amount_pence)}</strong> has been credited to your account.`) +
      infoTable([
        ['Amount', gbp(record.amount_pence)],
        ['Date', fmtDate(record.date)],
        ['Description', record.description ?? '—'],
      ]) + cta('View Payment History →'),
  }
}

function buildWithdrawalEmail(record: any, old_record: any, type: string) {
  if (type === 'INSERT') return {
    subject: 'Withdrawal Request Received — Tisho Enterprises',
    body: h1('Withdrawal Request Received') +
      p('We have received your withdrawal request. Our team will review it shortly.') +
      infoTable([
        ['Amount', gbp(record.amount_pence)],
        ['Source', record.source === 'referral_balance' ? 'Referral Balance' : 'Investment'],
        ['Status', 'Pending review'],
      ]) + cta('View Withdrawals →'),
  }

  const changed = old_record?.status !== record.status
  if (changed && record.status === 'approved') return {
    subject: 'Withdrawal Approved — Tisho Enterprises',
    body: h1('Withdrawal Approved') +
      p(`Your withdrawal of <strong>${gbp(record.amount_pence)}</strong> has been approved and will be processed shortly.`) +
      cta('View Status →'),
  }

  if (changed && record.status === 'paid') return {
    subject: 'Withdrawal Paid — Tisho Enterprises',
    body: h1('Withdrawal Payment Sent') +
      p(`Your withdrawal of <strong>${gbp(record.amount_pence)}</strong> has been paid. Please allow 1–3 business days.`) +
      cta('View Dashboard →'),
  }

  if (changed && record.status === 'rejected') return {
    subject: 'Withdrawal Update — Tisho Enterprises',
    body: h1('Withdrawal Not Approved') +
      p(`Unfortunately your withdrawal of <strong>${gbp(record.amount_pence)}</strong> could not be approved.`) +
      (record.admin_note ? infoTable([['Reason', record.admin_note]]) : '') +
      cta('Contact Support →'),
  }

  return null
}

function buildApplicationEmail(record: any, old_record: any) {
  if (old_record?.status === record.status) return null

  if (record.status === 'approved') return {
    subject: 'KYC Approved — Tisho Enterprises',
    body: h1('KYC Verification Approved') +
      p('Congratulations — your identity verification has been approved. You are now a verified investor.') +
      cta('Start Investing →'),
  }

  if (record.status === 'rejected') return {
    subject: 'KYC Application Update — Tisho Enterprises',
    body: h1('KYC Application Not Approved') +
      p('Unfortunately we were unable to approve your KYC application at this time.') +
      (record.admin_note ? infoTable([['Reason', record.admin_note]]) : '') +
      cta('Re-apply in Settings →'),
  }

  return null
}

function buildSupportEmail(record: any) {
  if (record.sender !== 'admin') return null
  return {
    subject: 'New Message from Tisho Enterprises Support',
    body: h1('You Have a New Message') +
      p('Our support team has replied to your enquiry.') +
      `<div style="background:#f7f9f8;border-left:4px solid #003819;border-radius:0 12px 12px 0;padding:16px 20px;margin:16px 0;"><p style="margin:0;font-size:14px;color:#002c14;line-height:1.7;">${(record.message ?? '').replace(/\n/g, '<br/>')}</p></div>` +
      cta('Reply in Portal →'),
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const { type, table, record, old_record } = await req.json()

    let email: { subject: string; body: string } | null = null
    let userId: string | null = null

    if (table === 'investments') {
      userId = record.user_id
      email = buildInvestmentEmail(record, old_record, type)
    } else if (table === 'payments' && type === 'INSERT') {
      userId = record.user_id
      email = buildPaymentEmail(record)
    } else if (table === 'withdrawals') {
      userId = record.user_id
      email = buildWithdrawalEmail(record, old_record, type)
    } else if (table === 'investor_applications') {
      userId = record.user_id
      email = buildApplicationEmail(record, old_record)
    } else if (table === 'support_messages' && type === 'INSERT' && record.sender === 'admin') {
      userId = await getThreadUser(record.thread_id)
      email = buildSupportEmail(record)
    }

    if (!email || !userId) return new Response(JSON.stringify({ skipped: true }), { status: 200 })

    const user = await getUserEmail(userId)
    if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })

    await sendMail(user.email, email.subject, emailHtml(email.subject, email.body))
    console.log(`Email sent to ${user.email}: ${email.subject}`)
    return new Response(JSON.stringify({ ok: true }), { status: 200 })

  } catch (err) {
    console.error('notify-investor error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
