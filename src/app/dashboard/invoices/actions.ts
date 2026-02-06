'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { InvoiceFormData } from '@/types/invoice';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

type QuotePayload = {
  formData: InvoiceFormData;
  documentType: 'Quote' | 'Invoice';
  total: number;
  status?: string; 
};

type UpdateQuotePayload = {
  quoteId: string;
  formData: InvoiceFormData;
  documentType: 'Quote' | 'Invoice';
  total: number;
  status?: string; 
};

// --- HELPER: Cryptographic Hash Generation ---
const generateInvoiceHash = (userId: string, clientId: string, invoiceNumber: string, total: number, currency: string, date: string) => {
  const canonicalString = `${userId}:${clientId}:${invoiceNumber}:${total.toFixed(2)}:${currency}:${date}`;
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
};

// --- 1. CREATE ACTION ---
export const createQuoteAction = async ({ formData, documentType, total, status = 'Draft' }: QuotePayload) => {
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
          phone: formData.to.phone,
          user_id: userId 
        }).select('id').single();
        if (clientError || !newClient) throw new Error(`Client Creation Failed: ${clientError?.message || 'Unknown error'}`);
        clientId = newClient.id;
      }

      // Logic: Only generate hash if status is NOT Draft
      let invoiceHash = null;
      let verifiedAt = null;

      if (status !== 'Draft') {
        invoiceHash = generateInvoiceHash(userId, clientId, formData.invoiceNumber, total, formData.currency || 'USD', formData.invoiceDate);
        verifiedAt = new Date().toISOString();
      }

      const documentPayload = {
        document_type: documentType, 
        user_id: userId, 
        client_id: clientId, 
        line_items: formData.lineItems as any, 
        notes: formData.notes, 
        total: total, 
        status: status, 
        invoice_number: formData.invoiceNumber, 
        invoice_date: formData.invoiceDate,
        due_date: (documentType === 'Invoice' && formData.dueDate) ? formData.dueDate : null, 
        vat_rate: formData.applyVat ? formData.vatRate : 0,
        brand_color: formData.brandColor || '#319795',
        currency: formData.currency || 'USD',
        payment_link: formData.paymentLink || null,
        invoice_hash: invoiceHash,
        verified_at: verifiedAt
      };

      const { error: quoteError } = await supabase.from('quotes').insert(documentPayload);
      if (quoteError) { throw new Error(`DATABASE INSERT FAILED: ${quoteError.message}`); }

    } catch (error: any) {
      console.error("CREATE ACTION FAILED:", error.message);
      return { success: false, message: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
};

// --- 2. UPDATE ACTION (Editing Form) ---
export const updateQuoteAction = async ({ quoteId, formData, documentType, total, status }: UpdateQuotePayload) => {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { throw new Error('Authentication Error: User not found.'); }
  
    const userId = user.id;
  
    try {
      const { data: client } = await supabase.from('clients').select('id').eq('name', formData.to.name).eq('user_id', userId).single();
      if (!client) throw new Error('Client not found during update.');
  
      const { data: currentQuote } = await supabase.from('quotes').select('invoice_hash, status').eq('id', quoteId).single();

      let invoiceHash = currentQuote?.invoice_hash;
      let verifiedAt = (currentQuote as any)?.verified_at;
      let newStatus = status || currentQuote?.status || 'Draft';

      // Logic: If finalizing or previously verified, ensure hash exists
      if (newStatus !== 'Draft' && !invoiceHash) {
         invoiceHash = generateInvoiceHash(userId, client.id, formData.invoiceNumber, total, formData.currency || 'USD', formData.invoiceDate);
         verifiedAt = new Date().toISOString();
      }

      const documentPayload = {
        document_type: documentType,
        client_id: client.id,
        line_items: formData.lineItems as any,
        notes: formData.notes,
        total: total,
        status: newStatus,
        invoice_number: formData.invoiceNumber,
        invoice_date: formData.invoiceDate,
        due_date: (documentType === 'Invoice' && formData.dueDate) ? formData.dueDate : null,
        vat_rate: formData.applyVat ? formData.vatRate : 0,
        brand_color: formData.brandColor || '#319795',
        currency: formData.currency || 'USD',
        payment_link: formData.paymentLink || null,
        invoice_hash: invoiceHash,
        verified_at: verifiedAt
      };
  
      const { error: updateError } = await supabase.from('quotes').update(documentPayload).eq('id', quoteId).eq('user_id', userId);
      if (updateError) { throw new Error(`DATABASE UPDATE FAILED: ${updateError.message}`); }
      
    } catch (error: any) {
      console.error("UPDATE ACTION FAILED:", error.message);
      return { success: false, message: error.message };
    }
  
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/invoices/${quoteId}`);
    redirect('/dashboard/invoices');
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
    revalidatePath('/dashboard/invoices');
    return { success: 'Document purged successfully.' };
};

// --- 4. MARK AS PAID (CRYPTO) ---
export const markInvoicePaidAction = async (invoiceId: string, txHash: string, method: 'USDT' | 'Bank' = 'USDT') => {
  const supabase = await createSupabaseServerClient();
  
  const { error } = await supabase
    .from('quotes')
    .update({ 
      status: 'Paid', 
      payment_tx_hash: txHash,
      payment_method: method 
    })
    .eq('id', invoiceId);

  if (error) throw new Error(`Failed to mark paid: ${error.message}`);
  
  revalidatePath(`/p/${invoiceId}`); 
  revalidatePath('/dashboard/invoices');
  return { success: true };
};

// --- 5. UPDATE STATUS ACTION (List View Dropdown) ---
export async function updateDocumentStatusAction(documentId: string, newStatus: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Authentication required.' };
  
  const validStatuses = ['draft', 'sent', 'paid', 'overdue'];
  const lowerStatus = newStatus.toLowerCase();
  
  if (!validStatuses.includes(lowerStatus)) return { success: false, error: 'Invalid status.' };
  
  const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();

  try {
    // 🟢 FETCH QUOTE to check for existing hash
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('invoice_hash, client_id, invoice_number, total, currency, invoice_date')
      .eq('id', documentId)
      .single();

    if (fetchError || !quote) return { success: false, error: 'Document not found.' };

    const updates: any = { status: formattedStatus };

    // 🟢 LOGIC: If moving to Sent/Paid AND no hash exists, generate it now
    if (lowerStatus !== 'draft' && !quote.invoice_hash) {
       const hash = generateInvoiceHash(
          user.id, 
          quote.client_id, 
          quote.invoice_number, 
          quote.total, 
          quote.currency || 'USD', 
          quote.invoice_date
       );
       updates.invoice_hash = hash;
       updates.verified_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('quotes')
      .update(updates)
      .eq('id', documentId)
      .eq('user_id', user.id);

    if (error) return { success: false, error: 'Failed to update status.' };
    
    revalidatePath('/dashboard/invoices');
    // Also revalidate the specific invoice page in case user is viewing it
    revalidatePath(`/dashboard/invoices/${documentId}`);
    
    return { success: true };

  } catch (err) {
    console.error("Status Update Failed", err);
    return { success: false, error: 'Server error updating status.' };
  }
}

// --- 6. GET QUOTE HELPER ---
export async function getQuoteForPdf(quoteId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: quote, error: quoteError } = await supabase.from('quotes').select(`*, clients ( * )`).eq('id', quoteId).single();
  if (quoteError || !quote) return { error: 'Document not found' };

  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profileError) return { error: 'User profile missing' };

  profile.email = user.email;
  return { quote, profile };
}