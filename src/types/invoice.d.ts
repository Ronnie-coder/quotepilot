export interface InvoiceFormData {
  logo: string | null;
  documentType: 'Quote' | 'Invoice';
  
  // Your Business Info
  from: {
    name: string;
    address: string;
    email?: string;
  };
  
  // Client Info
  to: {
    name: string;
    address: string;
    email?: string;
  };
  
  // Document Specifics
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  
  // Line Items
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  
  // Financials
  applyVat?: boolean;
  vatRate: number;
  
  // Payment Info
  payment: {
    bankName: string;
    accountHolder: string;
    accNumber: string;
    branchCode?: string;
  };

  // Optional Notes
  notes: string;

  // Branding & Localization
  brandColor: string;
  currency?: string; // <--- NEW: Supports USD, NGN, ZAR, etc.
}