'use client';

import { useState } from 'react';
import { IconButton, useToast, Icon } from '@chakra-ui/react';
import { Download, Loader2 } from 'lucide-react';
import { getQuoteForPdf } from '@/app/dashboard/quotes/actions';
import { generatePdf } from '@/utils/pdfGenerator';
import { mapToPdfPayload } from '@/utils/pdfMapper'; // 🟢 IMPORT MAPPER

export default function DownloadInvoiceButton({ quoteId }: { quoteId: string }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleDownload = async () => {
    setLoading(true);
    try {
      const result = await getQuoteForPdf(quoteId);
      
      if (!result.quote || !result.profile) throw new Error('Data missing');

      const { quote, profile } = result;

      // 🟢 USE THE MAPPER
      // Note: We use profile.email if available, or fall back to empty string if type is strict
      const pdfPayload = mapToPdfPayload(
        quote, 
        profile, 
        quote.clients, // Pass the full client object
        profile.email || '' // Pass email explicitly
      );

      const blob = await generatePdf(pdfPayload);

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