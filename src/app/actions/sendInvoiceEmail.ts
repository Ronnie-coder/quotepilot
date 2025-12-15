"use server";

import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { render } from "@react-email/render";
import InvoiceEmail from "@/components/email/InvoiceEmail"; 

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvoiceEmail(quoteId: string) {
  // We use the Admin client so we can look up the user's email in auth.users
  const supabase = createSupabaseAdminClient();

  // 1. Fetch Quote Data
  const { data: quote, error: dbError } = await supabase
    .from("quotes")
    .select(`
      *,
      clients ( name, email ),
      profiles ( company_name ) 
    `)
    .eq("id", quoteId)
    .single();

  if (dbError || !quote) {
    console.error("❌ DB Error:", dbError); 
    return { success: false, message: "Quote data not found." };
  }

  // 2. Normalize Data
  const client = Array.isArray(quote.clients) ? quote.clients[0] : quote.clients;
  const profile = Array.isArray(quote.profiles) ? quote.profiles[0] : quote.profiles;

  if (!client?.email) {
    return { success: false, message: "Client has no email address." };
  }

  // 3. Fetch the Freelancer's Real Email (The Sender)
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(quote.user_id);
  
  // Fallback: If we can't find the user, replies go to support
  const freelancerEmail = userData?.user?.email || "support@coderon.co.za";

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const publicLink = `${origin}/p/${quoteId}`;
  const senderDisplayName = profile?.company_name || "QuotePilot User";

  try {
    // 4. Render Email
    const emailHtml = await render(
      InvoiceEmail({
        clientName: client.name || "Valued Client",
        invoiceNumber: quote.invoice_number || "Draft",
        amount: `${quote.currency || 'ZAR'} ${Number(quote.total).toFixed(2)}`,
        dueDate: new Date(quote.due_date).toLocaleDateString(),
        publicLink: publicLink,
        senderName: senderDisplayName,
      })
    );

    // 5. Send Email
    const data = await resend.emails.send({
      // 🔒 SENDER: Must be your verified domain
      from: 'QuotePilot <billing@coderon.co.za>', 
      
      // 🎯 RECIPIENT: The Client
      to: [client.email], 
      
      // ↩️ REPLY-TO: The Freelancer (User)
      // ✅ FIXED: Changed 'reply_to' to 'replyTo' (camelCase)
      replyTo: freelancerEmail,

      subject: `Invoice #${quote.invoice_number} from ${senderDisplayName}`,
      html: emailHtml,
    });

    if (data.error) {
      console.error("❌ Resend Error:", data.error);
      return { success: false, message: "Email delivery failed." };
    }

    console.log(`✅ Email sent to ${client.email} (Replies to: ${freelancerEmail})`);
    return { success: true, message: `Email sent to ${client.email}` };

  } catch (error) {
    console.error("❌ Server Error:", error);
    return { success: false, message: "Internal Server Error." };
  }
}