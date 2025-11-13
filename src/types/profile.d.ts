// File: src/types/profile.d.ts

export interface UserProfile {
  id?: string;
  company_name?: string | null;
  company_address?: string | null;
  company_phone?: string | null;
  vat_number?: string | null;
  logo_url?: string | null;
  terms_conditions?: string | null;
}