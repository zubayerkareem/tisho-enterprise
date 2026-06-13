import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: Deno.env.get('SMTP_USER'),
    pass: Deno.env.get('SMTP_PASS'),
  },
})

// ─── Email template ───────────────────────────────────────────────────────────

function emailHtml(subject: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f7f9f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="background:#003819;border-radius:16px 16px 0 0;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="display:inline-block;background:#c3f63c;border-radius:10px;width:36px;height:36px;text-align:center;line-height:36px;font-weight:900;font-size:18px;color:#003819;vertical-align:middle;">T</div>
                <span style="color:#ffffff;font-weight:700;font-size:16px;vertical-align:middle;margin-left:10px;">Tisho Enterprises</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;border-left:1px solid #e4e7e5;border-right:1px solid #e4e7e5;">
          ${bodyHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f7f9f8;border:1px solid #e4e7e5;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#7a8a82;">
            Tisho Enterprises Ltd · 86-90 Paul Street, London, EC2A 4NE<br/>
            <a href="https://dashboard.tishoenterprises.com" style="color:#003819;">Investor Portal</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function heading(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:22px;color:#002c14;font-weight:700;">${text}</h1>`
}

function para(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#4a5d54;line-height:1.6;">${text}</p>`
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#7a8a82;width:40%;">${label}</td>
    <td style="padding:8px 0;font-size:13px;color:#002c14;font-weight:600;">${value}</td>
  </tr>`
}

function infoTable(rows: [string, string][]) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9f8;border-radius:12px;padding:4px 16px;margin:16px 0;">
    ${rows.map(([l, v]) => infoRow(l, v)).join('')}
  </table>`
}

function ctaButton(text: string) {
  return `<p style="margin:24px 0 0;text-align:center;">
    <a href="https://dashboard.tishoenterprises.com" style="display:inline-block;background:#003819;color:#c3f63c;text-decoration:none;border-radius:999px;padding:12px 28px;font-size:15px;font-weight:700;">${text}</a>
  </p>`
}

function gbp(pence: number) {
  return '£' + (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })
}

// ─── Get user email from profiles ────────────────────────────────────────────

async function getUserEmail(userId: string): Promise<{ email: string; name: string } | null> {
  const { data } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('id', userId)
    .single()
  return data ?? null
}

// ─── Email builders ───────────────────────────────────────────────────────────

function buildInvestmentEmail(record: any, oldRecord: any | null, type: string) {
  const isNew = type === 'INSERT'
  const statusChanged = !isNew && oldRecord?.status !== record.status

  if (isNew || (statusChanged && record.status === 'pending')) {
    return {
      subject: 'Investment Request Received — Tisho Enterprises',
      body: `
        ${heading('Investment Request Received')}
        ${para('Thank you — we have received your investment request and it is currently under review. You will be notified once it is activated.')}
        ${infoTable([
          ['Policy', record.label],
          ['Amount', gbp(record.amount_pence)],
          ['Term', `${record.months_total} months`],
          ['Rate', `${record.rate_percent}% ${record.type === 'compact' ? 'per month' : 'per year'}`],
          ['Payment method', record.payment_method === 'bank' ? 'Bank Transfer' : 'Stripe'],
        ])}
        ${ctaButton('View in Portal →')}
      `,
    }
  }

  if (statusChanged && record.status === 'active') {
    return {
      subject: '🎉 Investment Activated — Tisho Enterprises',
      body: `
        ${heading('Your Investment is Now Active!')}
        ${para('Great news — your investment has been reviewed and activated. Returns will begin accruing from today.')}
        ${infoTable([
          ['Policy', record.label],
          ['Amount', gbp(record.amount_pence)],
          ['Start date', new Date(record.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
          ['End date', new Date(record.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
          ['Monthly return', gbp(record.rate_per_month_pence ?? Math.round((record.rate_per_year_pence ?? 0) / 12))],
          ['Next payment', record.next_payment_date ? new Date(record.next_payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
        ])}
        ${ctaButton('View Dashboard →')}
      `,
    }
  }

  if (statusChanged && record.status === 'completed') {
    const completedRows: [string, string][] = [
      ['Policy', record.label],
      ['Amount invested', gbp(record.amount_pence)],
    ]
    if (record.principal_return_pence > 0) {
      completedRows.push(['Principal returned', gbp(record.principal_return_pence)])
    }
    return {
      subject: 'Investment Completed — Tisho Enterprises',
      body: `
        ${heading('Investment Term Completed')}
        ${para('Your 24-month investment term has now ended. Thank you for investing with Tisho Enterprises.')}
        ${infoTable(completedRows)}
        ${para('If you wish to re-invest, please visit the portal to start a new investment.')}
        ${ctaButton('View Portal →')}
      `,
    }
  }

  return null
}

function buildPaymentEmail(record: any) {
  return {
    subject: `Payment Received: ${gbp(record.amount_pence)} — Tisho Enterprises`,
    body: `
      ${heading('Payment Received')}
      ${para(`A payment of <strong>${gbp(record.amount_pence)}</strong> has been credited to your account.`)}
      ${infoTable([
        ['Amount', gbp(record.amount_pence)],
        ['Date', new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
        ['Description', record.description ?? '—'],
        ['Status', record.status],
      ])}
      ${ctaButton('View Payment History →')}
    `,
  }
}

function buildWithdrawalEmail(record: any, oldRecord: any | null, type: string) {
  const isNew = type === 'INSERT'
  const statusChanged = !isNew && oldRecord?.status !== record.status

  if (isNew) {
    return {
      subject: 'Withdrawal Request Received — Tisho Enterprises',
      body: `
        ${heading('Withdrawal Request Received')}
        ${para('We have received your withdrawal request. Our team will review it and get back to you shortly.')}
        ${infoTable([
          ['Amount requested', gbp(record.amount_pence)],
          ['Request date', new Date(record.request_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
          ['Source', record.source === 'referral_balance' ? 'Referral Balance' : 'Investment'],
          ['Status', 'Pending review'],
        ])}
        ${ctaButton('View Withdrawals →')}
      `,
    }
  }

  if (statusChanged && record.status === 'approved') {
    return {
      subject: 'Withdrawal Approved — Tisho Enterprises',
      body: `
        ${heading('Withdrawal Approved')}
        ${para(`Your withdrawal request of <strong>${gbp(record.amount_pence)}</strong> has been approved. Payment will be processed to your registered payout method shortly.`)}
        ${record.admin_note ? para(`<em>Note from team: ${record.admin_note}</em>`) : ''}
        ${ctaButton('View Status →')}
      `,
    }
  }

  if (statusChanged && record.status === 'paid') {
    return {
      subject: 'Withdrawal Paid — Tisho Enterprises',
      body: `
        ${heading('Withdrawal Payment Sent')}
        ${para(`Your withdrawal of <strong>${gbp(record.amount_pence)}</strong> has been paid. Please allow 1–3 business days for the funds to appear in your account.`)}
        ${ctaButton('View Dashboard →')}
      `,
    }
  }

  if (statusChanged && record.status === 'rejected') {
    return {
      subject: 'Withdrawal Update — Tisho Enterprises',
      body: `
        ${heading('Withdrawal Not Approved')}
        ${para(`Unfortunately your withdrawal request of <strong>${gbp(record.amount_pence)}</strong> could not be approved at this time.`)}
        ${record.admin_note ? infoTable([['Reason', record.admin_note]]) : ''}
        ${para('Please contact our support team if you have any questions.')}
        ${ctaButton('Contact Support →')}
      `,
    }
  }

  return null
}

function buildApplicationEmail(record: any, oldRecord: any | null) {
  const statusChanged = oldRecord?.status !== record.status
  if (!statusChanged) return null

  if (record.status === 'approved') {
    return {
      subject: '✅ KYC Approved — Tisho Enterprises',
      body: `
        ${heading('KYC Verification Approved')}
        ${para('Congratulations — your identity verification (KYC) has been approved. You are now a verified investor and can start investing.')}
        ${infoTable([
          ['Policy', record.policy_type === 'compact' ? 'Compact Policy' : 'Comprehensive Policy'],
          ['Approved', new Date(record.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
        ])}
        ${ctaButton('Start Investing →')}
      `,
    }
  }

  if (record.status === 'rejected') {
    return {
      subject: 'KYC Application Update — Tisho Enterprises',
      body: `
        ${heading('KYC Application Not Approved')}
        ${para('Unfortunately we were unable to approve your KYC application at this time.')}
        ${record.admin_note ? infoTable([['Reason', record.admin_note]]) : ''}
        ${para('You may re-apply from your account settings. Please contact support if you need assistance.')}
        ${ctaButton('Re-apply in Settings →')}
      `,
    }
  }

  return null
}

function buildSupportEmail(record: any) {
  if (record.sender !== 'admin') return null
  return {
    subject: 'New Message from Tisho Enterprises Support',
    body: `
      ${heading('You Have a New Message')}
      ${para('Our support team has replied to your enquiry.')}
      <div style="background:#f7f9f8;border-left:4px solid #003819;border-radius:0 12px 12px 0;padding:16px 20px;margin:16px 0;">
        <p style="margin:0;font-size:14px;color:#002c14;line-height:1.7;">${record.message?.replace(/\n/g, '<br/>') ?? ''}</p>
      </div>
      ${ctaButton('Reply in Portal →')}
    `,
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const payload = await req.json()
    const { type, table, record, old_record } = payload

    let email: { subject: string; body: string } | null = null
    let userId: string | null = null

    switch (table) {
      case 'investments':
        userId = record.user_id
        email = buildInvestmentEmail(record, old_record, type)
        break
      case 'payments':
        if (type === 'INSERT') {
          userId = record.user_id
          email = buildPaymentEmail(record)
        }
        break
      case 'withdrawals':
        userId = record.user_id
        email = buildWithdrawalEmail(record, old_record, type)
        break
      case 'investor_applications':
        userId = record.user_id
        email = buildApplicationEmail(record, old_record)
        break
      case 'support_messages':
        if (type === 'INSERT' && record.sender === 'admin') {
          // Get user_id from the support thread
          const { data: thread } = await supabase
            .from('support_threads')
            .select('user_id')
            .eq('id', record.thread_id)
            .single()
          userId = thread?.user_id ?? null
          email = buildSupportEmail(record)
        }
        break
    }

    if (!email || !userId) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }

    const user = await getUserEmail(userId)
    if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })

    await transporter.sendMail({
      from: `"Tisho Enterprises" <${Deno.env.get('SMTP_USER')}>`,
      to: user.email,
      subject: email.subject,
      html: emailHtml(email.subject, email.body),
    })

    console.log(`Email sent to ${user.email} — ${email.subject}`)
    return new Response(JSON.stringify({ ok: true }), { status: 200 })

  } catch (err) {
    console.error('notify-investor error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
