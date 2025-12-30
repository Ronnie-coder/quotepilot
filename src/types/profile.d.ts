export type PaymentProviderType = 'paystack' | 'yoco' | 'paypal' | 'manual';

export interface PaymentProvider {
  id: PaymentProviderType;
  name: string;
  url: string;
  enabled: boolean;
}

export interface PaymentSettings {
  providers: PaymentProvider[];
  default_provider: PaymentProviderType | null;
}

export interface UserProfile {
  id?: string;
  company_name?: string | null;
  company_address?: string | null;
  company_phone?: string | null;
  vat_number?: string | null;
  logo_url?: string | null;
  terms_conditions?: string | null;
  proposal_default_notes?: string | null; // NEW: Distinct notes for proposals
  // NEW: Matches the JSONB column in DB
  payment_settings?: PaymentSettings | null; 
}