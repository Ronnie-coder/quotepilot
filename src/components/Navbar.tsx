// src/components/Navbar.tsx

import { createSupabaseServerClient } from '@/lib/supabase/server';
import NavbarClient from './NavbarClient';

export default async function Navbar() {
  // 1. Initialize Supabase on the server
  const supabase = createSupabaseServerClient();
  
  // 2. Fetch the current user session securely
  const { data: { user } } = await supabase.auth.getUser();

  // 3. Pass the user object to the Client Component
  return <NavbarClient user={user} />;
}