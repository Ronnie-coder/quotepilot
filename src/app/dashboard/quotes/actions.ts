'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { InvoiceFormData } from '@/types/invoice';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generatePdf } from '@/utils/pdfGenerator';
import { PaymentSettings } from '@/types/profile';

type QuotePayload = {
  formData: InvoiceFormData;
  documentType: 'Quote' | 'Invoice';
  total: number;
};

type UpdateQuotePayload = {
  quoteId: string;
  formData: InvoiceFormData;
  documentType: 'Quote' | 'Invoice';
  total: number;
};

// --- 1. CREATE ACTION ---
export const createQuoteAction = async ({ formData, documentType, total }: QuotePayload) => {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { throw new Error('Authentication Error: User not found.'); }
    
    const userId = user.id;
    try {
      // 1. Handle Client Logic
      let { data: existingClient } = await supabase.from('clients').select('id').eq('name', formData.to.name).eq('user_id', userId).single();
      let clientId: string;
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase.from('clients').insert({ 
          name: formData.to.name, 
          email: formData.to.email, 
          address: formData.to.address, 
          user_id: userId 
        }).select('id').single();
        if (clientError || !newClient) throw new Error(`Client Creation Failed: ${clientError?.message || 'Unknown error'}`);
        clientId = newClient.id;
      }

      // 2. Prepare Payload
      const documentPayload = {
        document_type: documentType, 
        user_id: userId, 
        client_id: clientId, 
        line_items: formData.lineItems as any, 
        notes: formData.notes, 
        total: total, 
        invoice_number: formData.invoiceNumber, 
        invoice_date: formData.invoiceDate,
        due_date: (documentType === 'Invoice' && formData.dueDate) ? formData.dueDate : null, 
        vat_rate: formData.applyVat ? formData.vatRate : 0,
        brand_color: formData.brandColor || '#319795',
        currency: formData.currency || 'USD',
        payment_link: formData.paymentLink || null 
      };

      const { error: quoteError } = await supabase.from('quotes').insert(documentPayload);
      if (quoteError) { throw new Error(`DATABASE INSERT FAILED: ${quoteError.message}`); }

    } catch (error: any) {
      console.error("CREATE ACTION FAILED:", error.message);
      return { success: false, message: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/quotes');
    redirect('/dashboard/quotes');
};

// --- 2. UPDATE ACTION ---
export const updateQuoteAction = async ({ quoteId, formData, documentType, total }: UpdateQuotePayload) => {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { throw new Error('Authentication Error: User not found.'); }
  
    const userId = user.id;
  
    try {
      const { data: client } = await supabase.from('clients').select('id').eq('name', formData.to.name).eq('user_id', userId).single();
      if (!client) throw new Error('Client not found.');
  
      const documentPayload = {
        document_type: documentType,
        client_id: client.id,
        line_items: formData.lineItems as any,
        notes: formData.notes,
        total: total,
        invoice_number: formData.invoiceNumber,
        invoice_date: formData.invoiceDate,
        due_date: (documentType === 'Invoice' && formData.dueDate) ? formData.dueDate : null,
        vat_rate: formData.applyVat ? formData.vatRate : 0,
        brand_color: formData.brandColor || '#319795',
        currency: formData.currency || 'USD',
        payment_link: formData.paymentLink || null
      };
  
      const { error: updateError } = await supabase
        .from('quotes')
        .update(documentPayload)
        .eq('id', quoteId)
        .eq('user_id', userId);
  
      if (updateError) { throw new Error(`DATABASE UPDATE FAILED: ${updateError.message}`); }
      
    } catch (error: any) {
      console.error("UPDATE ACTION FAILED:", error.message);
      return { success: false, message: error.message };
    }
  
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/quotes');
    revalidatePath(`/quote/${quoteId}`);
    redirect('/dashboard/quotes');
};

// --- 3. DELETE ACTION ---
export const deleteQuoteAction = async (quoteId: string) => {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { return { error: 'Authentication Error: User not found.' }; }
    try {
      const { error } = await supabase.from('quotes').delete().eq('id', quoteId).eq('user_id', user.id);
      if (error) { throw new Error(`DATABASE DELETE FAILED: ${error.message}`); }
    } catch (error: any) {
      console.error("DELETE ACTION FAILED:", error.message);
      return { error: error.message };
    }
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/quotes');
    return { success: 'Document purged successfully.' };
};

// --- 4. GENERATE PDF ACTION (FOR EMAIL/DOWNLOAD AFTER SAVE) ---
export const generatePdfAction = async (quoteId: string) => {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return { success: false, error: 'Authentication Error: User not found.' };
        }
    
        const { data: quote, error: quoteError } = await supabase.from('quotes').select(`*, clients ( * )`).eq('id', quoteId).eq('user_id', user.id).single();
        const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        if (quoteError || profileError || !quote || !profile) {
          return { success: false, error: 'Failed to fetch complete document data for PDF generation.' };
        }
        
        // --- RESOLVE PAYMENT LINK ---
        let activePaymentLink = quote.payment_link;

        if (!activePaymentLink && profile.payment_settings) {
          const settings = profile.payment_settings as unknown as PaymentSettings;
          if (settings.default_provider) {
            const provider = settings.providers.find((p) => p.id === settings.default_provider);
            if (provider && provider.url) {
              activePaymentLink = provider.url;
            }
          }
        }
        // -----------------------------
    
        const client = quote.clients as any;
        const subtotal = (quote.line_items as any[])?.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0) || 0;
        const vatAmount = subtotal * ((quote.vat_rate || 0) / 100);
    
        const pdfData = {
          documentType: quote.document_type,
          invoiceNumber: quote.invoice_number,
          invoiceDate: quote.invoice_date,
          dueDate: quote.due_date,
          // 🟢 MAP LOGO & SIGNATURE CORRECTLY
          logo: profile.logo_url,
          signature: profile.signature_url, 
          brandColor: quote.brand_color || '#319795', 
          currency: quote.currency || 'USD', 
          paymentLink: activePaymentLink, 
          
          from: { name: profile.company_name, address: profile.company_address, email: user.email },
          to: { name: client.name, address: client.address, email: client.email },
          lineItems: quote.line_items as any,
          notes: quote.notes,
          vatRate: quote.vat_rate,
          payment: {
            bankName: profile.bank_name, accountHolder: profile.account_holder, accNumber: profile.account_number,
            accountType: profile.account_type, branchCode: profile.branch_code, branchName: profile.branch_name,
          },
          subtotal: subtotal, vatAmount: vatAmount, total: quote.total,
        };
    
        const pdfBlob = await generatePdf(pdfData as any);
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const pdfBase64 = buffer.toString('base64');
        const fileName = `${quote.document_type || 'Document'}_${quote.invoice_number}.pdf`;
    
        return { success: true, pdfData: pdfBase64, fileName };
    
      } catch (error: any) {
        console.error("Generate PDF Action Failed:", error);
        return { success: false, error: error.message || 'An unknown server error occurred.' };
      }
};

// --- 5. UPDATE STATUS ACTION ---
export async function updateDocumentStatusAction(documentId: string, newStatus: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Authentication required.' };

  const validStatuses = ['draft', 'sent', 'paid', 'overdue'];
  if (!validStatuses.includes(newStatus.toLowerCase())) {
     return { success: false, error: 'Invalid status.' };
  }

  const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();

  const { error } = await supabase.from('quotes').update({ status: formattedStatus }).eq('id', documentId).eq('user_id', user.id);

  if (error) return { success: false, error: 'Failed to update status.' };
  revalidatePath('/dashboard/quotes');
  return { success: true };
}

// --- 6. GET QUOTE HELPER ---
export async function getQuoteForPdf(quoteId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: quote, error: quoteError } = await supabase.from('quotes').select(`*, clients ( name, email, address )`).eq('id', quoteId).single();
  if (quoteError || !quote) return { error: 'Document not found' };

  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profileError) return { error: 'User profile missing' };

  return { quote, profile };
}