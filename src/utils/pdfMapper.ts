import { InvoicePdfPayload } from '@/types/invoice';
import { UserProfile, PaymentSettings } from '@/types/profile';
import { Client } from '@/types/client';

const resolvePaymentLink = (quote: any, profile: UserProfile): string | null => {
  // 🟢 STRICT SECURITY: Absolute Prohibition of Payment Links on Quotes
  const isQuote = (quote.document_type || 'Invoice').toLowerCase() === 'quote';
  if (isQuote) return null;

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
  const isQuote = (quote.document_type || 'Invoice').toLowerCase() === 'quote';

  // 🟢 MATH: Ensure Subtotal is calculated from items to avoid '0.00' issues
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
    dueDate: quote.due_date ?? null,
    currency: quote.currency || 'USD',
    brandColor: quote.brand_color || '#319795',
    
    from: {
      name: profile.company_name ?? null,
      address: profile.company_address ?? null,
      email: userEmail,
      phone: profile.company_phone ?? null
    },

    to: {
      name: client.name ?? null,
      address: client.address ?? null,
      email: client.email ?? null,
      phone: client.phone ?? null
    },

    logo: profile.logo_url ?? null,
    signature: profileWithSig.signature_url ?? null,
    paymentLink: resolvePaymentLink(quote, profile),

    lineItems: lineItems.map((item: any) => ({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || Number(item.price) || 0
    })),
    notes: quote.notes,
    
    vatRate: vatRate,
    subtotal: subtotal,
    vatAmount: vatAmount,
    total: total,

    // 🟢 STRICT SECURITY: Hide Bank Details for Quotes
    payment: isQuote ? undefined : {
      bankName: profileWithSig.bank_name ?? null, 
      accountHolder: profileWithSig.account_holder ?? null,
      accNumber: profileWithSig.account_number ?? null,
      branchCode: profileWithSig.branch_code ?? null,
      accountType: profileWithSig.account_type ?? null,
    }
  };
};