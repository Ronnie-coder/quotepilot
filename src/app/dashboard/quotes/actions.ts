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
          phone: formData.to.phone, // 🟢 Ensure phone is saved
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
      // Check for client by name (simple lookup for now)
      const { data: client } = await supabase.from('clients').select('id').eq('name', formData.to.name).eq('user_id', userId).single();
      
      // If client exists, optionally update their details here, or just use their ID.
      // For safety in this "Finalisation" mode, we just grab the ID.
      if (!client) throw new Error('Client not found. Please ensure the client name matches exactly or create a new one.');
  
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

// --- 4. GENERATE PDF ACTION (Legacy/Optional) ---
// Note: Ideally replaced by the client-side mapper, but kept for compatibility.
export const generatePdfAction = async (quoteId: string) => {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Auth Error' };
    
        const { data: quote } = await supabase.from('quotes').select(`*, clients ( * )`).eq('id', quoteId).single();
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        if (!quote || !profile) return { success: false, error: 'Data missing' };
        
        // Use the new mapper here too if needed, but this function returns base64 string
        // which implies it's used differently. For now, we leave it as a backup.
        return { success: false, error: 'Use client-side generation for consistency.' };
    
      } catch (error: any) {
        return { success: false, error: error.message };
      }
};

// --- 5. UPDATE STATUS ACTION ---
export async function updateDocumentStatusAction(documentId: string, newStatus: string) {
  const supabase = await createSupabaseServerClient();
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

// --- 6. GET QUOTE HELPER (The Critical Fix) ---
export async function getQuoteForPdf(quoteId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 🟢 FIX: Select ALL client fields (*), not just name/email/address
  // This ensures 'phone' is available for the PDF mapper
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select(`*, clients ( * )`) 
    .eq('id', quoteId)
    .single();

  if (quoteError || !quote) return { error: 'Document not found' };

  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profileError) return { error: 'User profile missing' };

  // 🟢 Append the User's Real Auth Email (often more reliable than profile email)
  profile.email = user.email;

  return { quote, profile };
}