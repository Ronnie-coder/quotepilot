// FILE: src/components/Navbar.tsx (NEW FILE)

import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavbarClient from './NavbarClient'; // The component you just renamed

// This is a Server Component Wrapper
export default async function Navbar() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // We fetch the user session on the server and pass it to the client component.
  return <NavbarClient user={user} />;
}