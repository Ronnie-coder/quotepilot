import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PublicView from "./PublicView";
import { Metadata } from 'next';

type PageProps = {
  params: { id: string };
};

// 🟢 NEW: GENERATE METADATA FOR WHATSAPP/SOCIALS
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createSupabaseServerClient();
  
  // Fetch just enough info for the preview card
  const { data: quote } = await supabase
    .from('quotes')
    .select('invoice_number, document_type, profiles(company_name)')
    .eq('id', params.id)
    .single();

  if (!quote) return { title: 'QuotePilot Document' };

  // Handle array/object quirk for profiles
  const company = quote.profiles 
    ? (Array.isArray(quote.profiles) ? quote.profiles[0].company_name : quote.profiles.company_name) 
    : 'Freelancer';
    
  const type = quote.document_type || 'Invoice';
  const number = quote.invoice_number;

  return {
    title: `${type} #${number} from ${company}`,
    description: `View, download, and pay securely via QuotePilot.`,
    openGraph: {
      title: `${type} #${number} from ${company}`,
      description: 'Secure Payment Link',
      // Ensure 'og-image.png' exists in your /public folder
      images: ['/og-image.png'], 
    },
  };
}

export default async function PublicQuotePage({ params }: PageProps) {
  const supabase = createSupabaseServerClient();

  // 1. Fetch Quote
  const { data: rawQuote, error } = await supabase
    .from("quotes")
    .select(`
      *,
      clients ( * ),
      profiles ( * )
    `)
    .eq("id", params.id)
    .single();

  if (error || !rawQuote) {
    console.error("Error fetching quote:", error);
    return notFound();
  }

  // 2. DATA NORMALIZATION
  const quote = {
    ...rawQuote,
    clients: Array.isArray(rawQuote.clients) ? rawQuote.clients[0] : rawQuote.clients,
    profiles: Array.isArray(rawQuote.profiles) ? rawQuote.profiles[0] : rawQuote.profiles,
    items: rawQuote.line_items || [], 
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">
      <PublicView quote={quote} />
    </div>
  );
}