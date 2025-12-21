'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];

const fileSchema = z.object({
  file: z
    .any()
    .refine((file) => file && file.size > 0, 'A file is required.')
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 2MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only .jpg, .jpeg, .png, .svg, and .webp files are accepted.'
    ),
});

// --- EXISTING LOGO ACTION (Unchanged) ---
export async function uploadLogoAction(prevState: any, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'Authentication Error' };

  // Validate specifically for 'logo' key
  const file = formData.get('logo') as File;
  if (!file || file.size === 0) return { success: false, message: 'No file provided' };
  
  const fileExtension = file.name.split('.').pop();
  const sanitizedUserId = user.id.replace(/[^a-zA-Z0-9-]/g, '');
  const filePath = `${sanitizedUserId}/logo-${Date.now()}.${fileExtension}`;

  try {
    const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(filePath);
    
    await supabase.from('profiles').update({ logo_url: publicUrlData.publicUrl }).eq('id', user.id);
    
    revalidatePath('/dashboard/settings');
    return { success: true, message: 'Logo uploaded successfully.' };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// --- 🟢 NEW: SIGNATURE ACTION ---
export async function uploadSignatureAction(prevState: any, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'Authentication Error' };

  const file = formData.get('signature') as File;
  
  const validatedFields = fileSchema.safeParse({ file });
  if (!validatedFields.success) return { success: false, message: 'Invalid file (Max 2MB).' };

  const fileExtension = file.name.split('.').pop();
  const sanitizedUserId = user.id.replace(/[^a-zA-Z0-9-]/g, '');
  // Using same bucket 'logos' but naming it 'signature-'
  const filePath = `${sanitizedUserId}/signature-${Date.now()}.${fileExtension}`;

  try {
    const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(filePath);
    
    const { error: dbError } = await supabase.from('profiles').update({ signature_url: publicUrlData.publicUrl }).eq('id', user.id);
    if (dbError) throw dbError;

    revalidatePath('/dashboard/settings');
    return { success: true, message: 'Signature uploaded successfully.' };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}