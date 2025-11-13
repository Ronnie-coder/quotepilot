import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsForm from './settings-form';
import { Box, Heading, Text, VStack, useColorModeValue } from '@chakra-ui/react';

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
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading as="h1" size="xl">
          Settings
        </Heading>
        <Text color="gray.500">
          Manage your company profile, branding, and payment details.
        </Text>
      </Box>
      <SettingsForm user={user} profile={profile} />
    </VStack>
  );
}