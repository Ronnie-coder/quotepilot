// FILE: src/app/dashboard/settings/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsForm from './settings-form';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient();

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