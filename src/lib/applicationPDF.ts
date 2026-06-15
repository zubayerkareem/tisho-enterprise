export function printApplicationPDF(
  data: Record<string, any>,
  name: string,
  email: string,
) {
  const isCompact = data.policy_type === 'compact'

  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  const field = (label: string, value?: string) => `
    <div class="field">
      <div class="label">${label}</div>
      <div class="value">${value || '—'}</div>
    </div>`

  const row = (...fields: string[]) =>
    `<div class="row">${fields.join('')}</div>`

  const section = (title: string, content: string) => `
    <div class="section-title">${title}</div>
    ${content}`

  const sectionBCompact = section('SECTION B – BANK & PAYOUT DETAILS',
    row(field('Account Name', data.account_name), field('Account Number', data.account_number)) +
    row(field('Sort Code / Swift Code', data.sort_code), field('Bank & Branch', data.bank_and_branch)) +
    row(field('Payout Frequency', data.payout_frequency))
  )

  const sectionBCapital = section('SECTION B – BANK & PAYOUT DETAILS',
    row(field('Account Name', data.account_name), field('Account Number', data.account_number)) +
    row(field('Bank & Branch', data.bank_and_branch), field('Payout Frequency', data.payout_frequency))
  )

  const sectionF = isCompact
    ? section('SECTION F – COMPACT POLICY RATES (MONTHLY)',
        `<table>
          <thead><tr><th>Capital (GBP)</th><th>Monthly Return</th></tr></thead>
          <tbody>
            <tr><td>£0 – £5,000</td><td>6%</td></tr>
            <tr><td>£5,001 – £50,000</td><td>7%</td></tr>
            <tr><td>£50,001 – £500,000</td><td>8%</td></tr>
            <tr><td>£500,001 – £5,000,000</td><td>9%</td></tr>
            <tr><td>Over £5,000,000</td><td>10%</td></tr>
          </tbody>
        </table>`
      )
    : section('SECTION F – COMPREHENSIVE POLICY RATES (ANNUAL)',
        `<table>
          <thead><tr><th>Capital (GBP)</th><th>Annual Return</th></tr></thead>
          <tbody>
            <tr><td>£0 – £5,000</td><td>10%</td></tr>
            <tr><td>£5,001 – £50,000</td><td>12%</td></tr>
            <tr><td>£50,001 – £500,000</td><td>15%</td></tr>
            <tr><td>£500,001 – £5,000,000</td><td>20%</td></tr>
            <tr><td>Over £5,000,000</td><td>25%</td></tr>
          </tbody>
        </table>`
      )

  const tnc1 = isCompact
    ? 'The investor enjoys between 6% and 10% per month in this policy, calculated on initial capital contributed for a maximum of 24 months. The contract is terminated at 24th month but the investor can re-invest or have as many investment policies as they wish.'
    : 'The investor enjoys between 10% and 25% returns per annum on a compensation policy of choice, calculated on capital contributed for a maximum of 24 months. After 24 months, the investor receives back the initial investment capital and the contract is terminated, but the investor may re-invest to renew the contract.'

  const policyLabel = isCompact ? 'COMPACT POLICY' : 'COMPREHENSIVE POLICY'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Investor Application – ${name}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Times New Roman',serif;font-size:11pt;color:#000;background:#fff}
    .page{max-width:210mm;margin:0 auto;padding:18mm 20mm}
    .header{text-align:center;padding-bottom:12px;margin-bottom:18px;border-bottom:3px solid #003819}
    .co{font-size:9.5pt;color:#003819;margin-bottom:3px;letter-spacing:.5px}
    .title{font-size:15pt;font-weight:bold;letter-spacing:1px}
    .meta{font-size:9pt;color:#555;margin-top:6px}
    .section-title{font-size:11pt;font-weight:bold;margin:18px 0 10px;padding-bottom:4px;border-bottom:1.5px solid #000}
    .row{display:flex;gap:20px;margin-bottom:10px}
    .field{flex:1}
    .label{font-size:8.5pt;color:#555;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
    .value{font-size:11pt;border-bottom:1px solid #aaa;padding-bottom:3px;min-height:20px}
    .text-area{border:1px solid #ccc;padding:8px;min-height:60px;line-height:1.5;font-size:11pt}
    table{width:100%;border-collapse:collapse;margin:8px 0;font-size:10pt}
    th{background:#003819;color:#fff;padding:6px 10px;text-align:left}
    td{padding:5px 10px;border-bottom:1px solid #e4e7e5}
    tr:nth-child(even) td{background:#f7f9f8}
    .tnc{font-size:9.5pt;line-height:1.6}
    ol{padding-left:18px}
    li{margin-bottom:7px}
    .badge{display:inline-block;background:#003819;color:#fff;padding:2px 8px;border-radius:4px;font-size:9pt;margin-left:8px}
    .sigs{display:flex;justify-content:space-between;margin-top:28px}
    .sig{width:44%}
    .sig-line{border-bottom:1px solid #000;height:36px;margin-bottom:4px}
    .sig-lbl{font-size:9pt;color:#555}
    .footer{margin-top:18px;padding-top:10px;border-top:2px solid #003819;font-size:8.5pt;color:#555;text-align:center}
    @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.page{padding:10mm}}
  </style>
</head>
<body><div class="page">
  <div class="header">
    <div class="co">TISHO ENTERPRISES LTD</div>
    <div class="title">INVESTOR APPLICATION FORM – ${policyLabel}</div>
    <div class="meta">
      Submitted: ${fmt(data.submitted_at ?? new Date().toISOString())}
      &nbsp;|&nbsp;
      Ref: INV-${(data.id ?? Date.now()).toString().replace(/-/g, '').slice(0, 8).toUpperCase()}
    </div>
  </div>

  ${section('SECTION A – PERSONAL INFORMATION',
    row(field('Full Name', name), field('Email Address', email)) +
    row(field('Gender', data.gender), field('Marital Status', data.marital_status), field('Date of Birth', data.date_of_birth)) +
    row(field('Nationality', data.nationality), field('Occupation', data.occupation)) +
    row(field('Phone', data.phone), field('Fax', data.fax), field('Website', data.website)) +
    row(field('Postal Address', data.postal_address)) +
    row(field('Physical Address', data.physical_address))
  )}

  ${isCompact ? sectionBCompact : sectionBCapital}

  ${section('SECTION C – IDENTITY & NEXT OF KIN',
    row(field('Valid Identification Details', data.id_details)) +
    row(field('Next of Kin', data.next_of_kin), field('Next of Kin Contact', data.next_of_kin_contact)) +
    row(field('Facebook', data.facebook), field('Twitter / X', data.twitter), field('Other Social', data.other_social))
  )}

  ${section('SECTION D – PREFERRED PAYMENT MODE',
    row(field('Payment Mode', data.payment_mode))
  )}

  ${section('SECTION E – ABOUT YOU',
    `<div class="text-area">${(data.self_description ?? '').replace(/\n/g, '<br>')}</div>`
  )}

  ${sectionF}

  ${section('TERMS AND CONDITIONS',
    `<div class="tnc"><ol>
      <li>${tnc1}</li>
      <li>Anyone who refers an investor that successfully invests is credited £100 to their referral balance as a one-time commission.</li>
      <li>Monthly portfolio updates will be made available through the Tisho Enterprises platform and via the registered email address.</li>
      <li>A unique investor reference number is issued to all investors upon application approval.</li>
      <li>A transaction record is maintained for every return payment, accessible in the Payment History section of the platform.</li>
      <li>Funds can only be returned to the registered bank account of the investor as stated in Section B of this application.</li>
      <li>Transfer fees are handled by Tisho Enterprises for all transactions.</li>
      <li>All notifications and updates will be sent to the registered email address and platform inbox only.</li>
      <li>Tisho Enterprises reserves the right to manage its compensation policy. Once this agreement has been signed, it is legally binding and cannot be changed except by the mutual agreement of both the investor and Tisho Enterprises.</li>
    </ol></div>`
  )}

  <div style="margin-top:12px;font-size:10pt">
    I have read, understood, and agree to the Terms and Conditions above.
    <span class="badge">✓ AGREED</span>
    <span style="font-size:9pt;color:#555;margin-left:10px">Signed digitally on ${fmt(data.agreed_at ?? new Date().toISOString())}</span>
  </div>

  <div class="footer">
    Tisho Enterprises Ltd &nbsp;|&nbsp; 86-90 Paul Street, London, EC2A 4NE &nbsp;|&nbsp; dashboard.tishoenterprises.com
  </div>
</div></body></html>`

  const w = window.open('', '_blank', 'width=900,height=720,scrollbars=yes')
  if (!w) { alert('Please allow pop-ups to download the PDF.'); return }
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print() }, 500)
}
