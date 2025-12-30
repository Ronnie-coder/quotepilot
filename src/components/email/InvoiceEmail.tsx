import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface InvoiceEmailProps {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  publicLink: string;
  paymentLink?: string; // Undefined for quotes
  senderName: string;
  documentType?: 'invoice' | 'quote';
  isReminder?: boolean;
}

export const InvoiceEmail = ({
  clientName,
  invoiceNumber,
  amount,
  dueDate,
  publicLink,
  paymentLink,
  senderName,
  documentType = 'invoice',
  isReminder = false,
}: InvoiceEmailProps) => {
  
  // Ensure we have a valid base URL for assets
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quotepilot.coderon.co.za'; 
  const isQuote = documentType === 'quote';

  // --- CONTENT LOGIC BASED ON TEMPLATES ---
  
  let previewText = "";
  let headingText = "";
  let bodyText = "";
  let closingText = "";

  if (isQuote) {
    // TEMPLATE F: QUOTE
    previewText = `Proposal from ${senderName}`;
    headingText = "Proposal for Services";
    bodyText = `Please find the proposal attached for your review. You can also view it online below.`;
    closingText = "If you’re happy to proceed, let me know and I’ll send the invoice.";
  } else if (isReminder) {
    // TEMPLATE D: INVOICE REMINDER
    previewText = `Payment Reminder: Invoice #${invoiceNumber}`;
    headingText = `Payment Reminder: #${invoiceNumber}`;
    bodyText = `This is a friendly reminder that invoice ${invoiceNumber} for ${amount} was due on ${dueDate}.`;
    closingText = "If you’ve already made payment, thank you — please ignore this message.";
  } else {
    // TEMPLATE C: NEW INVOICE
    previewText = `Invoice #${invoiceNumber} from ${senderName}`;
    headingText = `Invoice #${invoiceNumber}`;
    bodyText = `${senderName} has sent you an invoice for ${amount}.`;
    closingText = "If you have any questions, please let us know.";
  }

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          
          {/* HEADER: App Logo */}
          <Section style={logoSection}>
             <Img
                src={`${baseUrl}/logo.png`}
                width="40"
                height="40"
                alt="QuotePilot"
                style={logo}
             />
             <Text style={brandName}>QuotePilot</Text>
          </Section>

          <Heading style={h1}>{headingText}</Heading>
          
          <Text style={text}>Hi {clientName},</Text>
          <Text style={text}>{bodyText}</Text>

          {/* DOCUMENT STATS (Contextual) */}
          <Section style={statsContainer}>
            <Text style={statLabel}>{isQuote ? "PROPOSAL REF" : "INVOICE NUMBER"}</Text>
            <Text style={statValue}>#{invoiceNumber}</Text>
            
            {!isQuote && (
              <>
                <Text style={statLabel}>AMOUNT DUE</Text>
                <Text style={statValue}>{amount}</Text>
                <Text style={statLabel}>DUE DATE</Text>
                <Text style={statValue}>{dueDate}</Text>
              </>
            )}
          </Section>

          {/* PRIMARY ACTION BUTTON */}
          <Section style={btnContainer}>
            {/* If it's an Invoice, button goes to PAYMENT link. If Quote, button goes to VIEW link. */}
            <Button 
              style={button} 
              href={isQuote ? publicLink : (paymentLink || publicLink)}
            >
              {isQuote ? "View Proposal" : "Pay Invoice Now"}
            </Button>
          </Section>

          {/* SECONDARY LINK TEXT */}
          <Text style={text}>
            {isQuote ? "View online:" : "View invoice details:"}{" "}
            <Link href={publicLink} style={link}>{publicLink}</Link>
          </Text>

          {/* CLOSING TEXT */}
          <Text style={text}>{closingText}</Text>

          <Hr style={hr} />

          {/* FOOTER */}
          <Section style={footer}>
            <Text style={footerText}>
              Sent with <Link href="https://quotepilot.coderon.co.za" style={footerLink}>QuotePilot</Link> — Get paid faster
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default InvoiceEmail;

// --- STYLES ---

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  marginBottom: "64px",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  maxWidth: "600px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "30px",
};

const logo = {
  display: "inline-block",
  verticalAlign: "middle",
};

const brandName = {
  display: "inline-block",
  verticalAlign: "middle",
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1a202c",
  marginLeft: "10px",
};

const h1 = {
  color: "#333",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#333",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
};

const statsContainer = {
  backgroundColor: "#f7fafc",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  textAlign: "center" as const,
};

const statLabel = {
  color: "#718096",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  marginBottom: "4px",
  marginTop: "12px",
};

const statValue = {
  color: "#1a202c",
  fontSize: "18px",
  fontWeight: "bold",
  marginBottom: "16px",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#319795", // Brand Color (Teal)
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "12px",
};

const link = {
  color: "#319795",
  textDecoration: "underline",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  textAlign: "center" as const,
  marginTop: "20px",
};

const footerText = {
  color: "#718096", // Gray.500
  fontSize: "12px",
};

const footerLink = {
  color: "#718096",
  textDecoration: "underline",
  fontWeight: "bold" as const,
};