'use server';

import { auth } from '@clerk/nextjs/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type FormState = {
  success: boolean;
  message: string;
};

export async function uploadLogoAction(currentState: FormState, formData: FormData): Promise<FormState> {
  const { userId } = auth();
  if (!userId) {
    return { success: false, message: 'Authentication failed. Please sign in.' };
  }

  const file = formData.get('logo') as File;
  if (!file || file.size === 0) {
    return { success: false, message: 'No file selected for upload.' };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const filePath = `${userId}/logo.${file.name.split('.').pop()}`;

  try {
    const { error: uploadError } = await supabaseAdmin.storage
      .from('logos')
      .upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabaseAdmin.storage
      .from('logos')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', userId);
    if (dbError) throw dbError;

    revalidatePath('/dashboard/settings');
    return { success: true, message: 'Logo uploaded successfully!' };

  } catch (error: any) {
    console.error('Adjudicator Action Failed:', error);
    return { success: false, message: `An error occurred: ${error.message}` };
  }
}