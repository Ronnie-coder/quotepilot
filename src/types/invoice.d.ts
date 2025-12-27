// src/types/invoice.d.ts

export interface InvoiceFormData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  to: {
    name: string;
    email?: string;
    address?: string;
    phone?: string;
  };
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
  vatRate?: number;
  applyVat?: boolean;
  brandColor?: string;
  currency?: string;
  paymentLink?: string | null;
}

// 🟢 NEW: The Strict Contract for PDF Generation
// This ensures the "From" (Business Identity) is mandatory at the generation level.
export interface InvoicePdfPayload {
  documentType: 'Invoice' | 'Quote';
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  currency: string;
  brandColor: string;
  
  // Business Identity (Strictly Required for valid PDF)
  from: {
    name: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };

  // Client Details
  to: {
    name: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };

  // Content
  logo?: string | null;
  signature?: string | null;
  paymentLink?: string | null;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  
  // Financials
  notes?: string | null;
  vatRate?: number | null;
  subtotal: number;
  vatAmount: number;
  total: number;

  // Banking (Optional)
  payment?: {
    bankName?: string | null;
    accountHolder?: string | null;
    accNumber?: string | null;
    branchCode?: string | null;
    branchName?: string | null;
    accountType?: string | null;
  };
}