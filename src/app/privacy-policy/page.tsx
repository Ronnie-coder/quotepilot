import { Container, Heading, Text, VStack, UnorderedList, ListItem } from '@chakra-ui/react';

export default function PrivacyPolicyPage() {
  return (
    <Container maxW="container.lg" py={12}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="2xl">Privacy Policy</Heading>
        <Text>Last Updated: {new Date().toLocaleDateString()}</Text>

        <Text>Coderon (Pty) Ltd ("us", "we", or "our") operates the QuotePilot web application (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data, in compliance with the Protection of Personal Information Act (POPIA) of South Africa.</Text>

        <Heading as="h2" size="lg" mt={4}>1. Information Collection and Use</Heading>
        <Text>We collect several different types of information for various purposes to provide and improve our Service to you.</Text>
        <UnorderedList spacing={2} pl={6}>
          <ListItem><Text as="strong">Personal Data:</Text> While using our Service, we may ask you to provide us with certain personally identifiable information, including but not limited to: Email address, Full name, Company name, and Financial data related to invoices and quotes.</ListItem>
          <ListItem><Text as="strong">Usage Data:</Text> We may collect information on how the Service is accessed and used. This Usage Data may include information such as your computer's IP address, browser type, and browser version.</ListItem>
        </UnorderedList>

        <Heading as="h2" size="lg" mt={4}>2. Use of Data</Heading>
        <Text>QuotePilot uses the collected data for various purposes:</Text>
        <UnorderedList spacing={2} pl={6}>
            <ListItem>To provide and maintain our Service</ListItem>
            <ListItem>To notify you about changes to our Service</ListItem>
            <ListItem>To provide customer support</ListItem>
            <ListItem>To monitor the usage of our Service</ListItem>
            <ListItem>To detect, prevent and address technical issues</ListItem>
        </UnorderedList>

        <Heading as="h2" size="lg" mt={4}>3. Data Storage and Security</Heading>
        <Text>Your information is securely stored using Supabase, our backend service provider. The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure.</Text>

        <Heading as="h2" size="lg" mt={4}>4. Your Data Protection Rights under POPIA</Heading>
        <Text>As a South African user, you have the right to:</Text>
        <UnorderedList spacing={2} pl={6}>
            <ListItem>Request access to the personal information we hold about you.</ListItem>
            <ListItem>Request the correction of inaccurate personal information.</ListItem>
            <ListItem>Object to the processing of your personal information.</ListItem>
            <ListItem>Request the deletion of your personal information.</ListItem>
        </UnorderedList>

        <Heading as="h2" size="lg" mt={4}>5. Service Providers</Heading>
        <Text>We use third-party services for authentication (Google, GitHub) and analytics (Vercel Analytics). These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</Text>

        <Heading as="h2" size="lg" mt={4}>6. Changes to This Privacy Policy</Heading>
        <Text>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</Text>

        <Heading as="h2" size="lg" mt={4}>7. Contact Us</Heading>
        <Text>If you have any questions about this Privacy Policy, please contact us at ronnie@coderon.co.za.</Text>
      </VStack>
    </Container>
  );
}