"use server";

import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { generatePdf } from "@/utils/pdfGenerator";
import { mapToPdfPayload } from "@/utils/pdfMapper";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper type for JSON column
interface PaymentSettings {
  default_provider?: string;
  providers?: { id: string; url: string; }[];
}

export async function sendInvoiceEmail(quoteId: string, forceReminder: boolean = false) {
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

  // 3. Determine Context (Invoice vs Quote, New vs Reminder)
  const docType = (quote.document_type || 'invoice').toLowerCase() as 'invoice' | 'quote';
  
  // Logic: It's a reminder if explicitly requested OR if the invoice is marked Overdue
  const isReminder = forceReminder || (docType === 'invoice' && quote.status === 'Overdue');
  
  const senderDisplayName = profile?.company_name || "QuotePilot User";
  
  // 4. Construct Links & Subject Lines
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const viewLink = `${origin}/p/${quoteId}`;
  
  // PAYMENT LINK LOGIC:
  // - Quotes: undefined (hidden)
  // - Invoices: Try to find DIRECT provider link (PayPal/PayStack) first. 
  //   Fallback to Public View with ?action=pay if no direct link exists.
  let paymentLink: string | undefined = undefined;

  if (docType === 'invoice') {
    // 1. Check for a specific override on the quote itself (if you have that field)
    if (quote.payment_link) {
        paymentLink = quote.payment_link;
    } 
    // 2. Check Profile Payment Settings
    else if (profile?.payment_settings) {
        const settings = profile.payment_settings as unknown as PaymentSettings;
        if (settings.default_provider && Array.isArray(settings.providers)) {
            const provider = settings.providers.find(p => p.id === settings.default_provider);
            if (provider?.url) {
                paymentLink = provider.url;
            }
        }
    }

    // 3. Fallback to Portal Deep Link if no external link found
    if (!paymentLink) {
        paymentLink = `${viewLink}?action=pay`;
    }
  }

  // Set Subject Line
  let emailSubject = "";

  if (docType === 'quote') {
    // TEMPLATE F: QUOTE
    emailSubject = `Proposal from ${senderDisplayName}`;
  } else if (isReminder) {
    // TEMPLATE D: INVOICE REMINDER
    emailSubject = `Payment reminder: Invoice ${quote.invoice_number}`;
  } else {
    // TEMPLATE C: NEW INVOICE
    emailSubject = `Invoice ${quote.invoice_number} from ${senderDisplayName}`;
  }

  // 5. Fetch the Freelancer's Real Email (for Reply-To)
  const { data: userData } = await supabase.auth.admin.getUserById(quote.user_id);
  const freelancerEmail = userData?.user?.email || "support@coderon.co.za";
  const fromEmail = 'QuotePilot <billing@coderon.co.za>';

  try {
    // 6. Generate the PDF for Attachment
    console.log(`📄 Generating PDF for Quote ${quoteId}...`);
    const pdfPayload = mapToPdfPayload(quote, profile, client, freelancerEmail);
    const pdfBlob = await generatePdf(pdfPayload);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // 7. Render Email
    const { render } = await import("@react-email/render");
    const { default: InvoiceEmail } = await import("@/components/email/InvoiceEmail");

    const emailHtml = await render(
      InvoiceEmail({
        clientName: client.name || "Valued Client",
        invoiceNumber: quote.invoice_number || "Draft",
        amount: `${quote.currency || 'ZAR'} ${Number(quote.total).toFixed(2)}`,
        dueDate: new Date(quote.due_date).toLocaleDateString(),
        publicLink: viewLink,
        paymentLink: paymentLink, // Now contains the DIRECT link if available
        senderName: senderDisplayName,
        documentType: docType,    // 'invoice' | 'quote'
        isReminder: isReminder,   // true | false
      })
    );

    // 8. Send Email via Resend
    console.log(`📧 Sending email via Resend to: ${client.email} | Subject: ${emailSubject}`);

    const { error: resendError } = await resend.emails.send({
      from: fromEmail, 
      to: [client.email], 
      replyTo: freelancerEmail,
      subject: emailSubject,
      html: emailHtml,
      attachments: [
        {
          filename: `${docType === 'quote' ? 'Proposal' : 'Invoice'}_${quote.invoice_number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (resendError) {
      console.error("❌ Resend API Error:", resendError);
      return { success: false, message: `Email delivery failed: ${resendError.message}` };
    }

    // 9. Auto-update status to 'Sent' if it was draft
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