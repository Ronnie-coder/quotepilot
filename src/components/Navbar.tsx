import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavbarClient from './NavbarClient';

export default async function Navbar() {
  const supabase = await createSupabaseServerClient();
  
  // 1. Fetch the current user
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;

  // 2. If user exists, fetch their profile
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  // 3. Pass data to Client Component
  return <NavbarClient user={user} profile={profile} />;
}