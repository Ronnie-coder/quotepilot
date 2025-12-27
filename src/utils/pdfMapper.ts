import { InvoicePdfPayload } from '@/types/invoice';
import { UserProfile, PaymentSettings } from '@/types/profile';
import { Client } from '@/types/client';

const resolvePaymentLink = (quote: any, profile: UserProfile): string | null => {
  if (quote.payment_link) return quote.payment_link;
  if (profile.payment_settings) {
    const settings = profile.payment_settings as unknown as PaymentSettings;
    if (settings.default_provider) {
      const provider = settings.providers.find((p) => p.id === settings.default_provider);
      return provider?.url || null;
    }
  }
  return null;
};

export const mapToPdfPayload = (
  quote: any,
  profile: UserProfile,
  client: Client,
  userEmail: string
): InvoicePdfPayload => {
  
  const profileWithSig = profile as any;
  const lineItems = Array.isArray(quote.line_items) ? quote.line_items : (quote.items || []);

  // 🟢 MATH FIX: Calculate Subtotal from Line Items
  // This ensures we never display "0.00" even if the DB total is weird
  const subtotal = lineItems.reduce((acc: number, item: any) => {
    const price = Number(item.unitPrice) || Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    return acc + (price * qty);
  }, 0);

  const vatRate = Number(quote.vat_rate) || 0;
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  return {
    documentType: quote.document_type || 'Invoice',
    invoiceNumber: quote.invoice_number,
    invoiceDate: quote.invoice_date || quote.created_at,
    dueDate: quote.due_date,
    currency: quote.currency || 'USD',
    brandColor: quote.brand_color || '#319795',
    
    from: {
      name: profile.company_name,
      address: profile.company_address,
      email: userEmail, // Uses passed email (Auth or Profile)
      phone: profile.company_phone
    },

    to: {
      name: client.name,
      address: client.address,
      email: client.email,
      phone: client.phone
    },

    logo: profile.logo_url,
    signature: profileWithSig.signature_url,
    paymentLink: resolvePaymentLink(quote, profile),

    lineItems: lineItems.map((item: any) => ({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || Number(item.price) || 0
    })),
    notes: quote.notes,
    
    // 🟢 INJECT CALCULATED VALUES
    vatRate: vatRate,
    subtotal: subtotal,
    vatAmount: vatAmount,
    total: total,

    payment: {
      bankName: profileWithSig.bank_name, 
      accountHolder: profileWithSig.account_holder,
      accNumber: profileWithSig.account_number,
      branchCode: profileWithSig.branch_code,
      accountType: profileWithSig.account_type,
    }
  };
};