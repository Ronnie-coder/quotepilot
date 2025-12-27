import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsForm from './settings-form';

export default async function SettingsPage() {
  // 🟢 FIX: Added await here
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    // We remove the layout styling here because the SettingsForm will handle the animations and layout
    <SettingsForm user={user} profile={profile} />
  );
}