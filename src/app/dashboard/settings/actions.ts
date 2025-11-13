// src/app/dashboard/settings/actions.ts

'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];

// Schema to validate the uploaded file
const fileSchema = z.object({
  logo: z
    .any()
    .refine((file) => file && file.size > 0, 'A file is required.')
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 2MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only .jpg, .jpeg, .png, .svg, and .webp files are accepted.'
    ),
});

export async function uploadLogoAction(prevState: any, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Authentication Error: User not found.' };
  }

  const validatedFields = fileSchema.safeParse({
    logo: formData.get('logo'),
  });

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.flatten().fieldErrors.logo?.[0] || 'Invalid file provided.';
    return {
      success: false,
      message: errorMessage,
    };
  }
  
  const file = formData.get('logo') as File;
  const fileExtension = file.name.split('.').pop();
  // Sanitize file path to prevent traversal attacks
  const sanitizedUserId = user.id.replace(/[^a-zA-Z0-9-]/g, '');
  const filePath = `${sanitizedUserId}/logo-${Date.now()}.${fileExtension}`;

  try {
    // Perform upload with upsert to overwrite existing logo if named the same, though timestamp prevents this.
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true 
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError.message);
      return { success: false, message: `Storage Error: ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(filePath);
    
    if (!publicUrlData.publicUrl) {
      return { success: false, message: 'Could not retrieve public URL for the logo.' };
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ logo_url: publicUrlData.publicUrl })
      .eq('id', user.id);
      
    if (profileError) {
        console.error('Profile Update Error:', profileError.message);
        return { success: false, message: `Database Error: ${profileError.message}` };
    }

    revalidatePath('/dashboard/settings');
    return { success: true, message: 'Logo uploaded successfully.' };

  } catch (e) {
    const error = e as Error;
    console.error('Unexpected Error:', error.message);
    return { success: false, message: `An unexpected error occurred: ${error.message}` };
  }
}