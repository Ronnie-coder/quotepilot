// src/types/invoice.d.ts

export interface InvoiceFormData {
  // Meta
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  
  // Client (Step 1)
  to: {
    name: string;
    email?: string;
    address?: string;
    phone?: string;
  };
  
  // Work (Step 2)
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  
  // Terms & Financials (Step 3)
  notes?: string;
  vatRate?: number;
  applyVat?: boolean;
  brandColor?: string;
  currency?: string;
  paymentLink?: string | null;
}

export interface InvoicePdfPayload {
  documentType: 'Invoice' | 'Quote'; // Maintained for legacy, but UI defaults to Invoice
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  currency: string;
  brandColor: string;
  
  from: {
    name: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };

  to: {
    name: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };

  logo?: string | null;
  signature?: string | null;
  paymentLink?: string | null;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  
  notes?: string | null;
  vatRate?: number | null;
  subtotal: number;
  vatAmount: number;
  total: number;

  payment?: {
    bankName?: string | null;
    accountHolder?: string | null;
    accNumber?: string | null;
    branchCode?: string | null;
    branchName?: string | null;
    accountType?: string | null;
  };
}