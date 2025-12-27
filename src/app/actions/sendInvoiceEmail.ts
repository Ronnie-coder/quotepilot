"use server";

import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { generatePdf } from "@/utils/pdfGenerator";
import { mapToPdfPayload } from "@/utils/pdfMapper";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvoiceEmail(quoteId: string) {
  const supabase = createSupabaseAdminClient();

  // 1. Fetch Quote Data with COMPLETE Relations ( * )
  // 🟢 FIX: We now select ALL fields from clients and profiles
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

  if (!client?.email) {
    return { success: false, message: "Client has no email address." };
  }

  // 3. Fetch the Freelancer's Real Email
  const { data: userData } = await supabase.auth.admin.getUserById(quote.user_id);
  const freelancerEmail = userData?.user?.email || "support@coderon.co.za";

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const publicLink = `${origin}/p/${quoteId}`;
  const senderDisplayName = profile?.company_name || "QuotePilot User";

  try {
    // 🟢 4. Generate the PDF for Attachment
    // Uses the MASTER MAPPER to ensure 100% match with client download
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
    const data = await resend.emails.send({
      from: 'QuotePilot <billing@coderon.co.za>', 
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

    if (data.error) {
      console.error("❌ Resend Error:", data.error);
      return { success: false, message: "Email delivery failed." };
    }

    // 🟢 7. Auto-update status to 'Sent' if it was draft
    if (quote.status === 'Draft') {
        await supabase.from('quotes').update({ status: 'Sent' }).eq('id', quoteId);
    }

    return { success: true, message: `Email sent to ${client.email}` };

  } catch (error) {
    console.error("❌ Server Error:", error);
    return { success: false, message: "Internal Server Error." };
  }
}