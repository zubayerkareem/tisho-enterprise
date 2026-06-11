export type KycStatus = 'pending' | 'approved' | 'rejected'
export type PayoutFrequency = 'monthly' | 'quarterly' | 'annual'
export type InvestmentType = 'comprehensive' | 'compact'
export type InvestmentStatus = 'active' | 'completed'
export type PaymentStatus = 'completed' | 'pending'
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid'
export type SupportMessageSender = 'investor' | 'admin'
export type SupportThreadStatus = 'open' | 'resolved'
export type PayoutMethodType = 'bank' | 'cash' | 'western_union' | 'moneygram'
export type UserRole = 'investor' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  country: string
  joinDate: string
  kycStatus: KycStatus
  avatar: string | null
}

export interface Investment {
  id: string
  type: InvestmentType
  label: string
  amount: number
  currency: string
  startDate: string
  endDate: string
  monthsTotal: number
  monthsElapsed: number
  payoutFrequency: PayoutFrequency
  ratePercent: number
  ratePerYear: number | null
  ratePerMonth: number | null
  totalReceived: number
  totalExpected: number
  principalReturn: number
  status: InvestmentStatus
  nextPaymentDate: string | null
}

export interface Payment {
  id: string
  investmentId: string
  date: string
  amount: number
  method: string
  status: PaymentStatus
  description: string
}

export interface Withdrawal {
  id: string
  investmentId: string
  requestDate: string
  amount: number
  reason: string
  payoutMethod: string
  status: WithdrawalStatus
  resolvedDate: string | null
  adminNote: string | null
}

export interface PayoutMethod {
  id: string
  type: PayoutMethodType
  label: string
  accountName: string
  accountNumber: string
  sortCode: string
  isPrimary: boolean
}

export interface SupportMessage {
  from: SupportMessageSender
  date: string
  text: string
}

export interface SupportThread {
  id: string
  subject: string
  status: SupportThreadStatus
  createdAt: string
  messages: SupportMessage[]
}

export interface MonthlyChartPoint {
  month: string
  received: number
}
