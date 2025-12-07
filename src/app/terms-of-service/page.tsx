import { Container, Heading, Text, VStack, UnorderedList, ListItem } from '@chakra-ui/react';

export default function TermsOfServicePage() {
  return (
    <Container maxW="container.lg" py={12}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="2xl">Terms of Service</Heading>
        <Text>Last Updated: {new Date().toLocaleDateString()}</Text>

        <Heading as="h2" size="lg" mt={4}>1. Introduction</Heading>
        <Text>
          Welcome to QuotePilot (“we”, “us”, “our”). QuotePilot is a software service
          owned and operated by CODERON. These Terms of Service (“Terms”)
          govern your access to and use of the QuotePilot application located at
          https://quotepilot.coderon.co.za/ (the “Service”).
        </Text>
        <Text>
          By accessing or using the Service, you agree to be bound by these Terms.
          If you do not agree, you may not use the Service.
        </Text>

        <Heading as="h2" size="lg" mt={4}>2. Accounts</Heading>
        <Text>
          When creating an account, you must provide accurate and complete
          information. You are responsible for maintaining the confidentiality of your
          login credentials and for all activities that occur under your account.
        </Text>
        <Text>
          We reserve the right to suspend or terminate accounts that violate these Terms,
          contain false information, or are used for unlawful activities.
        </Text>

        <Heading as="h2" size="lg" mt={4}>3. User Content</Heading>
        <Text>
          You may upload, store, or transmit content such as company information,
          client details, invoices, financial data, or other materials (“Content”).
          You retain ownership of all Content you upload.
        </Text>
        <Text>
          By using the Service, you grant us a limited license to process, store, back up,
          and display your Content solely for the purpose of operating and improving the Service.
        </Text>
        <Text>
          You are responsible for the legality, accuracy, and appropriateness of the Content
          you upload. You agree not to upload unlawful, harmful, or abusive Content.
        </Text>

        <Heading as="h2" size="lg" mt={4}>4. Intellectual Property</Heading>
        <Text>
          All intellectual property related to the Service—including software, branding,
          logos, UI design, and features—is the exclusive property of Coderon (Pty) Ltd.
        </Text>
        <Text>
          You may not copy, modify, redistribute, reverse engineer, or exploit any part of
          the Service unless expressly permitted in writing.
        </Text>

        <Heading as="h2" size="lg" mt={4}>5. Acceptable Use</Heading>
        <Text>Users agree not to:</Text>
        <UnorderedList spacing={2} pl={6}>
          <ListItem>Use QuotePilot for illegal or fraudulent activities</ListItem>
          <ListItem>Attempt to gain unauthorized access to other accounts</ListItem>
          <ListItem>Interfere with the security or performance of the Service</ListItem>
          <ListItem>Copy or resell the Service or any part of it</ListItem>
          <ListItem>Upload harmful scripts, malware, or automated bots</ListItem>
        </UnorderedList>

        <Heading as="h2" size="lg" mt={4}>6. Termination</Heading>
        <Text>
          We may suspend or terminate access to the Service at any time if you violate
          these Terms, misuse the platform, or engage in activities that compromise the
          stability or security of the Service.
        </Text>
        <Text>You may stop using the Service at any time by closing your account.</Text>

        <Heading as="h2" size="lg" mt={4}>7. Limitation of Liability</Heading>
        <Text>
          To the maximum extent permitted by law, Coderon (Pty) Ltd is not liable for:
        </Text>
        <UnorderedList spacing={2} pl={6}>
          <ListItem>Loss of profits or revenue</ListItem>
          <ListItem>Loss of data or business interruption</ListItem>
          <ListItem>Indirect, incidental, or consequential damages</ListItem>
          <ListItem>Issues caused by third-party providers (e.g., Supabase, Vercel, Google)</ListItem>
        </UnorderedList>
        <Text>
          Your use of the Service is at your own risk. The Service is provided on an
          “AS IS” and “AS AVAILABLE” basis.
        </Text>

        <Heading as="h2" size="lg" mt={4}>8. Governing Law</Heading>
        <Text>
          These Terms are governed by the laws of South Africa. Any disputes relating to
          the Service must be handled within South African jurisdiction.
        </Text>

        <Heading as="h2" size="lg" mt={4}>9. Changes to Terms</Heading>
        <Text>
          We may update or modify these Terms from time to time. Changes become effective
          once posted on this page. We will attempt to provide advance notice for
          material changes.
        </Text>

        <Heading as="h2" size="lg" mt={4}>10. Contact Us</Heading>
        <Text>If you have questions about these Terms, please contact:</Text>
        <UnorderedList spacing={2} pl={6}>
          <ListItem>Email (Support): support@coderon.co.za</ListItem>
          <ListItem>Email (General): info@coderon.co.za</ListItem>
          <ListItem>WhatsApp/Phone: 067 818 4898</ListItem>
        </UnorderedList>
      </VStack>
    </Container>
  );
}
