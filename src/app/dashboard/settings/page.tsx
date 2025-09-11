// src/app/dashboard/settings/page.tsx (FULL REPLACEMENT)
import { Container, Heading } from '@chakra-ui/react';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // <-- USE OUR NEW SERVER CLIENT
import SettingsForm from './settings-form';

export default async function CompanySettingsPage() {
  const { userId } = auth();

  if (!userId) {
    return (
      <Container centerContent py={10}>
        <Heading size="md">Authentication Required</Heading>
        <p>Please sign in to view your company settings.</p>
      </Container>
    );
  }

  // Use the new, authenticated server client for all server-side Supabase calls.
  const supabase = await createSupabaseServerClient(); 
  
  const { data: userData, error } = await supabase
    .from('users')
    .select('logo_url')
    .eq('id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // Ignore 'no rows found' error
      console.error('Error fetching settings:', error);
  }

  const logoUrl = userData?.logo_url || null;

  return (
    <Container maxW="container.lg" py={8}>
      <Heading mb={6}>Company Settings</Heading>
      <SettingsForm initialLogoUrl={logoUrl} />
    </Container>
  );
}