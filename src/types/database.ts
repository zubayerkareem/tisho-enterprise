/**
 * Generated Supabase database types.
 * Run `npm run gen:types` after running migrations to regenerate.
 *
 * npx supabase gen types typescript --local > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type KycStatus = 'pending' | 'approved' | 'rejected'
export type UserRole = 'investor' | 'admin'
export type InvestmentType = 'comprehensive' | 'compact'
export type InvestmentStatus = 'active' | 'completed' | 'pending' | 'withdrawn'
export type PayoutFrequency = 'monthly' | 'quarterly' | 'annual'
export type PaymentStatus = 'completed' | 'pending' | 'failed'
export type PaymentSource = 'stripe' | 'manual'
export type WithdrawalStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'paid'
export type SupportSender = 'investor' | 'admin'
export type SupportStatus = 'open' | 'resolved'
export type PayoutMethodType = 'bank' | 'cash' | 'western_union' | 'moneygram'
export type ProfitMode = 'automatic' | 'manual'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          country: string | null
          avatar_url: string | null
          role: UserRole
          kyc_status: KycStatus
          kyc_reason: string | null
          suspended: boolean
          referral_code: string
          referred_by: string | null
          referral_balance_pence: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          bonus_pence: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['referrals']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: never
      }
      investments: {
        Row: {
          id: string
          user_id: string
          type: InvestmentType
          label: string
          amount_pence: number
          currency: string
          start_date: string
          end_date: string
          months_total: number
          payout_frequency: PayoutFrequency
          rate_percent: number
          rate_per_year_pence: number | null
          rate_per_month_pence: number | null
          principal_return_pence: number
          status: InvestmentStatus
          next_payment_date: string | null
          profit_mode: ProfitMode
          stripe_payment_intent_id: string | null
          transaction_screenshot_url: string | null
          payment_method: 'bank' | 'stripe'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['investments']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['investments']['Insert']>
      }
      payments: {
        Row: {
          id: string
          investment_id: string
          user_id: string
          date: string
          amount_pence: number
          currency: string
          method: string
          status: PaymentStatus
          description: string
          source: PaymentSource
          stripe_charge_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      withdrawals: {
        Row: {
          id: string
          investment_id: string | null
          user_id: string
          source: 'investment' | 'referral_balance'
          request_date: string
          amount_pence: number
          reason: string
          payout_method_id: string | null
          status: WithdrawalStatus
          resolved_date: string | null
          admin_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['withdrawals']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['withdrawals']['Insert']>
      }
      payout_methods: {
        Row: {
          id: string
          user_id: string
          type: PayoutMethodType
          label: string
          account_name: string
          account_number_masked: string
          sort_code_masked: string
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payout_methods']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['payout_methods']['Insert']>
      }
      support_threads: {
        Row: {
          id: string
          user_id: string
          subject: string
          status: SupportStatus
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['support_threads']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['support_threads']['Insert']>
      }
      support_messages: {
        Row: {
          id: string
          thread_id: string
          sender: SupportSender
          body: string
          attachment_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['support_messages']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['support_messages']['Insert']>
      }
      kyc_documents: {
        Row: {
          id: string
          user_id: string
          kind: 'id_front' | 'id_back' | 'address' | 'selfie'
          storage_path: string
          status: KycStatus
          reviewed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['kyc_documents']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['kyc_documents']['Insert']>
      }
      notification_prefs: {
        Row: {
          user_id: string
          payment_received: boolean
          withdrawal_update: boolean
          kyc_update: boolean
          support_reply: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notification_prefs']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['notification_prefs']['Insert']>
      }
      admin_audit_log: {
        Row: {
          id: string
          actor_id: string
          action: string
          target_table: string | null
          target_id: string | null
          diff: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_audit_log']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: never
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      monthly_chart_data: {
        Args: { p_user_id: string; p_months?: number }
        Returns: { month: string; received: number }[]
      }
    }
    Enums: {
      kyc_status: KycStatus
      user_role: UserRole
      investment_type: InvestmentType
      investment_status: InvestmentStatus
      payout_frequency: PayoutFrequency
      payment_status: PaymentStatus
      withdrawal_status: WithdrawalStatus
    }
  }
}
