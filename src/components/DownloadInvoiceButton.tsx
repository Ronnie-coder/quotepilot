'use client';

import { useState } from 'react';
import { IconButton, useToast, Icon } from '@chakra-ui/react';
import { Download, Loader2 } from 'lucide-react';
import { getQuoteForPdf } from '@/app/dashboard/quotes/actions';
import { generatePdf } from '@/utils/pdfGenerator';

export default function DownloadInvoiceButton({ quoteId }: { quoteId: string }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleDownload = async () => {
    setLoading(true);
    try {
      // 1. Fetch Full Data from Server
      const result = await getQuoteForPdf(quoteId);
      
      if (result.error || !result.quote || !result.profile) {
        throw new Error(result.error || 'Data missing');
      }

      const { quote, profile } = result;

      // 2. Format Line Items (Handle Supabase JSON)
      const lineItems = Array.isArray(quote.line_items) 
        ? quote.line_items 
        : [];

      // 3. Generate PDF
      const blob = await generatePdf({
        documentType: quote.document_type || 'Quote',
        
        // --- CRITICAL FIX: PASS THE COLOR FROM DB TO GENERATOR ---
        brandColor: quote.brand_color || '#319795', 
        // --------------------------------------------------------

        invoiceNumber: quote.invoice_number,
        invoiceDate: quote.invoice_date || quote.created_at,
        dueDate: quote.due_date,
        logo: profile.logo_url, // Changed from avatar_url based on your previous files, ensure this matches your DB
        from: {
          name: profile.company_name,
          email: profile.email,
          address: profile.company_address,
        },
        to: {
          name: quote.clients?.name,
          email: quote.clients?.email,
          address: quote.clients?.address,
        },
        lineItems: lineItems,
        notes: quote.notes,
        vatRate: quote.vat_rate,
        subtotal: 0, // Calculated inside logic if needed
        vatAmount: 0,
        total: quote.total, // Use stored total
        payment: {
            bankName: profile.bank_name,
            accountHolder: profile.account_holder,
            accNumber: profile.account_number,
            branchCode: profile.branch_code
        }
      });

      // 4. Trigger Download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quote.document_type}_${quote.invoice_number}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({ status: 'success', title: 'Downloaded' });

    } catch (error: any) {
      console.error(error);
      toast({ status: 'error', title: 'Download Failed', description: error.message || 'Could not retrieve document data.' });
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