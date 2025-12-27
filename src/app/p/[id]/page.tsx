import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PublicView from "./PublicView";
import { Metadata } from 'next';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = await createSupabaseServerClient();
  const { id } = await params;
  
  const { data: quote } = await supabase
    .from('quotes')
    .select('invoice_number, document_type, profiles(company_name)')
    .eq('id', id)
    .single();

  if (!quote) return { title: 'QuotePilot Document' };

  const anyQuote = quote as any;
  const profileData = Array.isArray(anyQuote.profiles) ? anyQuote.profiles[0] : anyQuote.profiles;
  const company = profileData?.company_name || 'Freelancer';
  const type = anyQuote.document_type || 'Invoice';
  const number = anyQuote.invoice_number;

  return {
    title: `${type} #${number} from ${company}`,
    description: `View, download, and pay securely via QuotePilot.`,
    openGraph: {
      title: `${type} #${number} from ${company}`,
      description: 'Secure Payment Link',
      images: ['/og-image.png'], 
    },
  };
}

export default async function PublicQuotePage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  // 1. Fetch Quote & Relations
  const { data: rawQuote, error } = await supabase
    .from("quotes")
    .select(`
      *,
      clients ( * ),
      profiles ( *, signature_url ) 
    `)
    .eq("id", id)
    .single();

  if (error || !rawQuote) {
    console.error("Error fetching quote:", error);
    return notFound();
  }

  // 🟢 2. CRITICAL FIX: Fetch the User's Real Email from Auth Admin
  // (The profiles table often doesn't have the email, but Auth does)
  const { data: userData } = await supabase.auth.admin.getUserById(rawQuote.user_id);
  const realUserEmail = userData?.user?.email || "";

  // 3. Normalize Data
  const quote = {
    ...rawQuote,
    clients: Array.isArray(rawQuote.clients) ? rawQuote.clients[0] : rawQuote.clients,
    profiles: Array.isArray(rawQuote.profiles) ? rawQuote.profiles[0] : rawQuote.profiles,
    items: rawQuote.line_items || [], 
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">
      {/* 🟢 PASS THE EMAIL PROP DOWN */}
      <PublicView quote={quote} userEmail={realUserEmail} />
    </div>
  );
}