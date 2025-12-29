"use server";

import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { generatePdf } from "@/utils/pdfGenerator";
import { mapToPdfPayload } from "@/utils/pdfMapper";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvoiceEmail(quoteId: string) {
  // Validate Environment
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is missing from environment variables.");
    return { success: false, message: "Server configuration error: Missing API Key." };
  }

  const supabase = createSupabaseAdminClient();

  // 1. Fetch Quote Data with COMPLETE Relations
  const { data: quote, error: dbError } = await supabase
    .from("quotes")
    .select(`
      *,
      clients ( * ),
      profiles ( * ) 
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

  // Validate Recipient
  if (!client?.email) {
    console.warn(`⚠️ Client missing email for Quote ID: ${quoteId}`);
    return { success: false, message: "Client has no email address." };
  }

  // 3. Fetch the Freelancer's Real Email
  const { data: userData } = await supabase.auth.admin.getUserById(quote.user_id);
  const freelancerEmail = userData?.user?.email || "support@coderon.co.za";

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const publicLink = `${origin}/p/${quoteId}`;
  const senderDisplayName = profile?.company_name || "QuotePilot User";
  
  // Validate Sender
  const fromEmail = 'QuotePilot <billing@coderon.co.za>';

  try {
    // 4. Generate the PDF for Attachment
    console.log(`📄 Generating PDF for Quote ${quoteId}...`);
    const pdfPayload = mapToPdfPayload(quote, profile, client, freelancerEmail);
    const pdfBlob = await generatePdf(pdfPayload);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // 5. Render Email
    const { render } = await import("@react-email/render");
    const { default: InvoiceEmail } = await import("@/components/email/InvoiceEmail");

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

    // 6. Send Email with Attachment
    console.log(`📧 Sending email via Resend to: ${client.email}`);

    const { error: resendError } = await resend.emails.send({
      from: fromEmail, 
      to: [client.email], 
      replyTo: freelancerEmail,
      subject: `Invoice #${quote.invoice_number} from ${senderDisplayName}`,
      html: emailHtml,
      attachments: [
        {
          filename: `${quote.document_type || 'Invoice'}_${quote.invoice_number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (resendError) {
      console.error("❌ Resend API Error:", resendError);
      return { success: false, message: `Email delivery failed: ${resendError.message}` };
    }

    // 7. Auto-update status to 'Sent' if it was draft
    if (quote.status === 'Draft') {
        console.log(`🔄 Updating Quote ${quoteId} status to Sent`);
        await supabase.from('quotes').update({ status: 'Sent' }).eq('id', quoteId);
    }

    return { success: true, message: `Email sent to ${client.email}` };

  } catch (error: any) {
    console.error("❌ Server Action Error:", error);
    return { success: false, message: error.message || "Internal Server Error during email processing." };
  }
}