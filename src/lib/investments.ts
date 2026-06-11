import type { Investment } from '@/types/models'

/** Compact policy: tiered monthly % by principal (GBP). */
export function compactTierRate(amountGBP: number): number {
  if (amountGBP <= 5_000)     return 6
  if (amountGBP <= 50_000)    return 7
  if (amountGBP <= 500_000)   return 8
  if (amountGBP <= 5_000_000) return 9
  return 10
}

/** Comprehensive policy: tiered annual % by principal (GBP). */
export function comprehensiveTierRate(amountGBP: number): number {
  if (amountGBP <= 5_000)     return 25
  if (amountGBP <= 50_000)    return 30
  if (amountGBP <= 500_000)   return 35
  if (amountGBP <= 5_000_000) return 40
  return 42
}

/** Monthly payout amount in GBP for an investment. */
export function monthlyReturn(investment: Investment): number {
  if (investment.ratePerMonth !== null) return investment.ratePerMonth
  if (investment.ratePerYear !== null) return investment.ratePerYear / 12
  if (investment.type === 'compact') {
    return (investment.amount * compactTierRate(investment.amount)) / 100
  }
  return (investment.amount * comprehensiveTierRate(investment.amount) / 100) / 12
}

/** Progress through the investment term as a 0–100 value. */
export function progress(investment: Investment): number {
  return Math.min(100, Math.round((investment.monthsElapsed / investment.monthsTotal) * 100))
}

/** Total expected payout over the full term (including principal for comprehensive). */
export function totalExpected(investment: Investment): number {
  const monthly = monthlyReturn(investment)
  if (investment.type === 'comprehensive') {
    return monthly * investment.monthsTotal + investment.principalReturn
  }
  return monthly * investment.monthsTotal
}

/** Format a GBP amount as a currency string. */
export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}
