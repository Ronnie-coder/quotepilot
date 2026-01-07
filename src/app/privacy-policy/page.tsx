import { Container, Heading, Text, VStack, UnorderedList, ListItem } from '@chakra-ui/react';

export default function PrivacyPolicyPage() {
  return (
    <Container maxW="container.lg" py={12}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="2xl">Privacy Policy</Heading>
        <Text>Last updated: 15 January 2026</Text>

        <Text>
          Coderon (Pty) Ltd (“us”, “we”, or “our”) operates the QuotePilot web application
          (the “Service”). This Privacy Policy explains how we collect, store, use, and
          protect your personal information in accordance with the Protection of Personal
          Information Act (POPIA) of South Africa.
        </Text>

        <Heading as="h2" size="lg" mt={4}>1. Information We Collect</Heading>
        <Text>We collect different types of information to provide and improve the Service:</Text>
        <UnorderedList spacing={2} pl={6}>
          <ListItem>
            <Text as="strong">Personal Data:</Text> Includes information such as your full name,
            email address, company name, billing details, and invoice/quote financial data.
          </ListItem>
          <ListItem>
            <Text as="strong">Usage Data:</Text> Includes IP address, browser type, device
            information, and interactions with the Service.
          </ListItem>
        </UnorderedList>

        <Heading as="h2" size="lg" mt={4}>2. How We Use Your Data</Heading>
        <Text>QuotePilot uses collected information for the following purposes:</Text>
        <UnorderedList spacing={2} pl={6}>
          <ListItem>To provide, maintain, and improve our Service</ListItem>
          <ListItem>To notify you about updates or changes</ListItem>
          <ListItem>To provide customer and technical support</ListItem>
          <ListItem>To monitor and analyze usage</ListItem>
          <ListItem>To detect, prevent, and resolve technical issues</ListItem>
        </UnorderedList>

        <Heading as="h2" size="lg" mt={4}>3. Data Storage and Security</Heading>
        <Text>
          Your data is securely stored through Supabase, our backend provider. We take
          reasonable technical and organizational measures to protect your information.
          However, no method of transmission or storage over the Internet is completely secure.
        </Text>

        <Heading as="h2" size="lg" mt={4}>4. Your Rights Under POPIA</Heading>
        <Text>You have the legal right to:</Text>
        <UnorderedList spacing={2} pl={6}>
          <ListItem>Request access to the personal information we hold about you</ListItem>
          <ListItem>Request corrections to inaccurate personal information</ListItem>
          <ListItem>Object to the processing of your personal data</ListItem>
          <ListItem>Request the deletion of your personal information</ListItem>
        </UnorderedList>

        <Heading as="h2" size="lg" mt={4}>5. Service Providers</Heading>
        <Text>
          We use trusted third-party providers such as Google and GitHub for authentication,
          and Vercel Analytics for performance and usage insights. These providers are
          contracted to process data only on our behalf and are prohibited from using it for
          any other purpose.
        </Text>

        <Heading as="h2" size="lg" mt={4}>6. Changes to This Privacy Policy</Heading>
        <Text>
          We may update this policy from time to time. Any changes will be posted on this
          page, and the “Last updated” date will be revised accordingly.
        </Text>

        <Heading as="h2" size="lg" mt={4}>7. Contact Us</Heading>
        <Text>
          If you have any questions about this Privacy Policy or your personal information,
          please contact us:
        </Text>

        <UnorderedList spacing={2} pl={6}>
          <ListItem>Support email: support@coderon.co.za</ListItem>
          <ListItem>General email: info@coderon.co.za</ListItem>
        </UnorderedList>
      </VStack>
    </Container>
  );
}