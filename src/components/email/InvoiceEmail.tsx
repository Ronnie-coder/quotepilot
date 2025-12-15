import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img, // 🟢 New Import
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
  senderName: string;
}

export const InvoiceEmail = ({
  clientName,
  invoiceNumber,
  amount,
  dueDate,
  publicLink,
  senderName,
}: InvoiceEmailProps) => {
  
  // 🟢 Define the Base URL for images
  // When deploying, ensure NEXT_PUBLIC_SITE_URL is set in Vercel
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quotepilot.coderon.co.za/'; 

  return (
    <Html>
      <Head />
      <Preview>Invoice #{invoiceNumber} from {senderName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* 🟢 BRAND HEADER */}
          <Section style={logoSection}>
             <Img
                src={`${baseUrl}/logo.png`} // Ensure 'logo.png' is in your public folder
                width="40"
                height="40"
                alt="QuotePilot"
                style={logo}
             />
             <Text style={brandName}>QuotePilot</Text>
          </Section>

          <Heading style={h1}>New Invoice</Heading>
          
          <Text style={text}>Hi {clientName},</Text>
          <Text style={text}>
            <strong>{senderName}</strong> has sent you an invoice for <strong>{amount}</strong>.
          </Text>

          <Section style={statsContainer}>
            <Text style={statLabel}>INVOICE NUMBER</Text>
            <Text style={statValue}>#{invoiceNumber}</Text>
            
            <Text style={statLabel}>DUE DATE</Text>
            <Text style={statValue}>{dueDate}</Text>
          </Section>

          <Section style={btnContainer}>
            <Button style={button} href={publicLink}>
              View & Download Invoice
            </Button>
          </Section>

          <Text style={text}>
            or copy this link: <Link href={publicLink} style={link}>{publicLink}</Link>
          </Text>

          <Hr style={hr} />

          {/* 🟢 BRAND FOOTER */}
          <Section style={footer}>
            <Text style={footerText}>Powered by</Text>
            <Img
              src={`${baseUrl}/logo.png`}
              width="20"
              height="20"
              alt="QuotePilot"
              style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '5px' }}
            />
            <Text style={{...footerText, fontWeight: 'bold', display: 'inline-block', marginLeft: '5px'}}>QuotePilot</Text>
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
  backgroundColor: "#319795", // Brand Color
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
  color: "#8898aa",
  fontSize: "12px",
  display: "inline-block",
};