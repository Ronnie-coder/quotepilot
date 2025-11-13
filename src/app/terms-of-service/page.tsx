import { Container, Heading, Text, VStack, UnorderedList, ListItem } from '@chakra-ui/react';

export default function TermsOfServicePage() {
  return (
    <Container maxW="container.lg" py={12}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="2xl">Terms of Service</Heading>
        <Text>Last Updated: {new Date().toLocaleDateString()}</Text>

        <Heading as="h2" size="lg" mt={4}>1. Introduction</Heading>
        <Text>Welcome to QuotePilot ("we", "us", "our"). These Terms of Service govern your use of our web application located at app.coderon.co.za (the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</Text>

        <Heading as="h2" size="lg" mt={4}>2. Accounts</Heading>
        <Text>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</Text>
        
        <Heading as="h2" size="lg" mt={4}>3. User Content</Heading>
        <Text>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness. By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service for the purpose of operating and providing the Service to you.</Text>
        
        <Heading as="h2" size="lg" mt={4}>4. Intellectual Property</Heading>
        <Text>The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Coderon (Pty) Ltd and its licensors. The Service is protected by copyright, trademark, and other laws of both South Africa and foreign countries.</Text>

        <Heading as="h2" size="lg" mt={4}>5. Termination</Heading>
        <Text>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</Text>

        <Heading as="h2" size="lg" mt={4}>6. Limitation Of Liability</Heading>
        <Text>In no event shall Coderon (Pty) Ltd, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</Text>

        <Heading as="h2" size="lg" mt={4}>7. Governing Law</Heading>
        <Text>These Terms shall be governed and construed in accordance with the laws of South Africa, without regard to its conflict of law provisions.</Text>

        <Heading as="h2" size="lg" mt={4}>8. Changes</Heading>
        <Text>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</Text>

        <Heading as="h2" size="lg" mt={4}>9. Contact Us</Heading>
        <Text>If you have any questions about these Terms, please contact us at ronnie@coderon.co.za.</Text>
      </VStack>
    </Container>
  );
}