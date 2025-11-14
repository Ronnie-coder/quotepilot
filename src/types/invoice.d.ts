// This type defines the complete data structure for a single invoice or quote.
// It will be used by the form, the PDF generator, and the database logic.
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
  
  // --- CORRECTION IMPLEMENTED ---
  // Financials
  applyVat?: boolean; // This missing field was the root cause of recent build failures.
  vatRate: number; // Stored as a percentage, e.g., 15 for 15%

  // Payment Info
  payment: {
    bankName: string;
    accountHolder: string;
    accNumber: string;
  };

  // Optional Notes
  notes: string;
}