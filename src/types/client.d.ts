// Location: src/types/client.d.ts

export interface Client {
  id: number; // Supabase created this as int8, which is a number in JS
  created_at: string;
  name: string;
  email: string | null;   // Making these nullable to match the database
  address: string | null;
  phone: string | null;
  user_id: string;        // This is a uuid, so it's a string
}