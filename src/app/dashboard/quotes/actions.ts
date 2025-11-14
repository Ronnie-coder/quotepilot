'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { InvoiceFormData } from '@/types/invoice';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generatePdf } from '@/utils/pdfGenerator';

// --- CORRECTION IMPLEMENTED ---
// The InvoiceFormData type is augmented locally to include the missing property.
// This resolves the TypeScript error without needing to modify the original type file.
type FormDataWithVat = InvoiceFormData & {
  applyVat?: boolean;
};

type QuotePayload = {
  formData: FormDataWithVat;
  documentType: 'Quote' | 'Invoice';
  total: number;
};

type UpdateQuotePayload = {
  quoteId: string;
  formData: FormDataWithVat;
  documentType: 'Quote' | 'Invoice';
  total: number;
};

export const createQuoteAction = async ({ formData, documentType, total }: QuotePayload) => {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { throw new Error('Authentication Error: User not found.'); }
    
    const userId = user.id;
    try {
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
      const documentPayload = {
        document_type: documentType, user_id: userId, client_id: clientId, line_items: formData.lineItems as any, 
        notes: formData.notes, total: total, invoice_number: formData.invoiceNumber, invoice_date: formData.invoiceDate,
        due_date: (documentType === 'Invoice' && formData.dueDate) ? formData.dueDate : null, 
        // This line is now type-safe
        vat_rate: formData.applyVat ? formData.vatRate : 0,
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
        // This line is now type-safe
        vat_rate: formData.applyVat ? formData.vatRate : 0,
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
          const errorMessage = `PDF Data Fetch Error: ${quoteError?.message || profileError?.message}`;
          console.error(errorMessage);
          return { success: false, error: 'Failed to fetch complete document data for PDF generation.' };
        }
    
        const client = quote.clients as any;
        const subtotal = (quote.line_items as any[])?.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0) || 0;
        const vatAmount = subtotal * ((quote.vat_rate || 0) / 100);
    
        const pdfData = {
          documentType: quote.document_type,
          invoiceNumber: quote.invoice_number,
          invoiceDate: quote.invoice_date,
          dueDate: quote.due_date,
          logo: profile.logo_url,
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
    
        const { pdfBase64, fileName } = await generatePdf(pdfData as any);
    
        return { success: true, pdfData: pdfBase64, fileName };
    
      } catch (error: any) {
        console.error("Generate PDF Action Failed:", error);
        return { success: false, error: error.message || 'An unknown server error occurred during PDF generation.' };
      }
};

export async function updateDocumentStatusAction(documentId: string, newStatus: string) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required.' };
  }

  const validStatuses = ['draft', 'sent', 'paid', 'overdue'];
  if (!validStatuses.includes(newStatus)) {
    return { success: false, error: 'Invalid status provided.' };
  }

  const { error } = await supabase
    .from('quotes')
    .update({ status: newStatus })
    .eq('id', documentId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Status Update Error:', error);
    return { success: false, error: 'Failed to update document status.' };
  }

  revalidatePath('/dashboard/quotes');

  return { success: true };
}