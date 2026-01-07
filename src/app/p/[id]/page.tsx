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
  
  // 1. Fetch minimal data for metadata
  const { data: quote } = await supabase
    .from('quotes')
    .select('invoice_number, document_type, profiles(company_name)')
    .eq('id', id)
    .single();

  if (!quote) return { title: 'QuotePilot Document' };

  const anyQuote = quote as any;
  const profileData = Array.isArray(anyQuote.profiles) ? anyQuote.profiles[0] : anyQuote.profiles;
  const company = profileData?.company_name || 'Freelancer';
  
  // 2. LOGIC: Distinguish between Invoice and Proposal (Quote)
  const rawType = anyQuote.document_type || 'invoice';
  const isProposal = rawType.toLowerCase() === 'quote';
  
  const displayType = isProposal ? 'Proposal' : 'Invoice';
  const number = anyQuote.invoice_number;

  // 3. BROWSER TITLE (Dynamic)
  // We keep this specific so users can distinguish tabs in Chrome/Safari
  const browserTitle = `${displayType} #${number} from ${company}`;

  // 4. OG METADATA (Strict Static)
  // We override this specifically for WhatsApp/LinkedIn to look clean and secure
  const ogTitle = isProposal 
    ? "Proposal via QuotePilot" 
    : "Invoice via QuotePilot";

  const ogDescription = isProposal 
    ? "Review the proposal outlining the work and pricing." 
    : "View the invoice and payment details.";

  return {
    title: browserTitle,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'QuotePilot Secure Document',
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
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

  // 2. Fetch the User's Real Email from Auth Admin
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
      <PublicView quote={quote} userEmail={realUserEmail} />
    </div>
  );
}