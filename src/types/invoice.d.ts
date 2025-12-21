export interface InvoiceFormData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  to: {
    name: string;
    email?: string;
    address?: string;
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
  // 🟢 CRITICAL: This allows the link to be passed to the server
  paymentLink?: string | null; 
}