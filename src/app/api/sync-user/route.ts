// src/app/api/sync-user/route.ts
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// --- TEMPORARY MODIFICATION FOR MANUAL SYNC ---
export async function GET() { // <-- MODIFIED FROM POST to GET
  const { userId, sessionClaims } = auth();

  if (!userId) {
    return new Response("Not authenticated", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("users").upsert({
    id: userId,
    email: sessionClaims?.email,
    first_name: sessionClaims?.first_name || null,
    last_name: sessionClaims?.last_name || null,
    image_url: sessionClaims?.image_url || null,
  });

  if (error) {
    console.error("Error syncing user:", error);
    return new Response("Failed: " + error.message, { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, message: "User synced successfully!" }), { status: 200 });
}