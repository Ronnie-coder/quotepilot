// File: src/app/api/profile/route.ts

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { UserProfile } from '@/types/profile';

// GET handler to fetch the user's profile
export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single(); // We expect one or zero rows

    if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found", which is not an error here
      console.error('Supabase GET Error:', error);
      throw error;
    }

    // If no profile exists, return a default empty object
    return NextResponse.json(data || {});

  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch profile' }), { status: 500 });
  }
}


// POST handler to create or update the user's profile
export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const profileData: UserProfile = await request.json();

  // Remove the ID from the payload to prevent users from trying to change it
  delete profileData.id;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    // Upsert is a perfect use case: it updates a row if it exists, or inserts it if it doesn't.
    // The `id` column is the conflict target.
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({ ...profileData, id: userId }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase POST Error:', error);
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: 'Failed to save profile', details: error.message }), { status: 500 });
  }
}