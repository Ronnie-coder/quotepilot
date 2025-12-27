import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavbarClient from './NavbarClient';

export default async function Navbar() {
  // 🟢 FIX: Added await here
  const supabase = await createSupabaseServerClient();
  
  // 2. Fetch the current user
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;

  // 3. If user exists, fetch their profile (to get the logo)
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  // 4. Pass both user and profile to Client Component
  return <NavbarClient user={user} profile={profile} />;
}