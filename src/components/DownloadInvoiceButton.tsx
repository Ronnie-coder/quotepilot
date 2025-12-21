'use client';

import { useState } from 'react';
import { IconButton, useToast, Icon } from '@chakra-ui/react';
import { Download, Loader2 } from 'lucide-react';
import { getQuoteForPdf } from '@/app/dashboard/quotes/actions';
import { generatePdf } from '@/utils/pdfGenerator';
import { PaymentSettings } from '@/types/profile';

export default function DownloadInvoiceButton({ quoteId }: { quoteId: string }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleDownload = async () => {
    setLoading(true);
    try {
      const result = await getQuoteForPdf(quoteId);
      
      if (!result.quote || !result.profile) throw new Error('Data missing');

      const { quote, profile } = result;

      // 1. Check Invoice Row First
      let activePaymentLink = quote.payment_link; 

      // 2. Fallback to Profile Default
      if (!activePaymentLink && profile.payment_settings) {
        const settings = profile.payment_settings as unknown as PaymentSettings;
        if (settings.default_provider) {
          const provider = settings.providers.find((p) => p.id === settings.default_provider);
          if (provider?.url) activePaymentLink = provider.url;
        }
      }

      // 🟢 Force type casting if TS complains about signature_url not being in the 'Tables' type yet
      const profileWithSig = profile as any;

      const blob = await generatePdf({
        documentType: quote.document_type || 'Quote',
        brandColor: quote.brand_color || '#319795', 
        invoiceNumber: quote.invoice_number,
        invoiceDate: quote.invoice_date || quote.created_at,
        dueDate: quote.due_date,
        logo: profile.logo_url,
        // 🟢 PASS SIGNATURE HERE
        signature: profileWithSig.signature_url, 
        currency: quote.currency || 'USD',
        paymentLink: activePaymentLink, 
        
        from: { name: profile.company_name, email: profile.email, address: profile.company_address },
        to: { name: quote.clients?.name, email: quote.clients?.email, address: quote.clients?.address },
        lineItems: Array.isArray(quote.line_items) ? quote.line_items : [],
        notes: quote.notes,
        vatRate: quote.vat_rate,
        subtotal: 0, 
        vatAmount: 0,
        total: quote.total,
        payment: { bankName: profile.bank_name, accountHolder: profile.account_holder, accNumber: profile.account_number, branchCode: profile.branch_code }
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quote.document_type}_${quote.invoice_number}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({ status: 'success', title: 'Downloaded' });

    } catch (error: any) {
      console.error(error);
      toast({ status: 'error', title: 'Failed', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IconButton
      aria-label="Download PDF"
      icon={loading ? <Icon as={Loader2} className="animate-spin" /> : <Icon as={Download} />}
      size="sm"
      variant="ghost"
      onClick={handleDownload}
      isDisabled={loading}
    />
  );
}