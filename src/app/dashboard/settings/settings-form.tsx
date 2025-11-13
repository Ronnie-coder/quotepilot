// src/app/dashboard/settings/settings-form.tsx

'use client';

import {
  Box, Button, FormControl, FormLabel, Input, VStack, useToast, Textarea, Heading, HStack, Flex, Grid, GridItem, Text, Icon, useColorModeValue
} from '@chakra-ui/react';
import { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/supabase';
import { uploadLogoAction } from './actions';
import LogoUploader from '@/components/LogoUploader'; // <-- IMPORT NEW COMPONENT
import { Building, Banknote, FileText, UploadCloud } from 'lucide-react';

type SettingsFormProps = {
  user: User;
  profile: Tables<'profiles'> | null;
};

// --- SettingsSection component remains unchanged ---
const SettingsSection = ({ title, icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'white');

  return (
    <Box bg={cardBg} p={{ base: 6, md: 8 }} borderRadius="lg" shadow="md" borderWidth="1px" borderColor={borderColor}>
      <HStack as="header" spacing={4} mb={6}>
        <Icon as={icon} boxSize={6} color="gray.400" />
        <Heading as="h2" size="lg" color={headingColor}>{title}</Heading>
      </HStack>
      <VStack spacing={6} align="stretch">
        {children}
      </VStack>
    </Box>
  );
};


// --- The LogoUploader component is now in its own file and removed from here ---


export default function SettingsForm({ user, profile }: SettingsFormProps) {
  const supabase = createSupabaseBrowserClient();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastShownRef = useRef(false);
  
  const brandGold = useColorModeValue('yellow.500', 'yellow.300');
  const buttonTextColor = useColorModeValue('gray.800', 'gray.900');
  const focusBorderColor = useColorModeValue('yellow.500', 'yellow.300');

  // --- State for the Logo Uploader Server Action ---
  const initialLogoState = { success: false, message: '' };
  const [logoState, logoFormAction] = useFormState(uploadLogoAction, initialLogoState);

  useEffect(() => {
    if (logoState.message) {
      toast({
        title: logoState.success ? 'Success' : 'Error',
        description: logoState.message,
        status: logoState.success ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
      if (logoState.success) {
        router.refresh(); 
      }
    }
  }, [logoState, toast, router]);
  
  // --- Onboarding Toast Logic (unchanged) ---
  useEffect(() => {
    if (searchParams.get('onboarding') === 'true' && !toastShownRef.current) {
      toastShownRef.current = true;
      toast({
        title: 'Welcome to QuotePilot!',
        description: 'Please complete your company profile to begin.',
        status: 'info',
        duration: 8000,
        isClosable: true,
        position: 'top',
      });
      router.replace('/dashboard/settings', { scroll: false });
    }
  }, [searchParams, toast, router]);

  // --- State for the Main Details Form (unchanged) ---
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [companyAddress, setCompanyAddress] = useState(profile?.company_address || '');
  const [companyPhone, setCompanyPhone] = useState(profile?.company_phone || '');
  const [vatNumber, setVatNumber] = useState(profile?.vat_number || '');
  const [terms, setTerms] = useState(profile?.terms_conditions || '');
  const [bankName, setBankName] = useState(profile?.bank_name || '');
  const [accountHolder, setAccountHolder] = useState(profile?.account_holder || '');
  const [accountNumber, setAccountNumber] = useState(profile?.account_number || '');
  const [branchCode, setBranchCode] = useState(profile?.branch_code || '');
  const [branchName, setBranchName] = useState(profile?.branch_name || '');
  const [accountType, setAccountType] = useState(profile?.account_type || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, company_name: companyName, company_address: companyAddress,
      company_phone: companyPhone, vat_number: vatNumber, terms_conditions: terms,
      bank_name: bankName, account_holder: accountHolder, account_number: accountNumber,
      branch_code: branchCode, branch_name: branchName, account_type: accountType,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      toast({ title: 'Error Updating Profile', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Profile Updated Successfully', status: 'success' });
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    // We use a Box here instead of a form, as the forms are now inside the sections
    <Box>
      <VStack spacing={8} align="stretch">
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={8}>
          
          <GridItem as="form" onSubmit={handleDetailsSubmit}>
            <VStack spacing={8} align="stretch" h="full">
                <SettingsSection title="Company Profile" icon={Building}>
                  <FormControl isRequired><FormLabel>Company Name</FormLabel><Input focusBorderColor={focusBorderColor} value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></FormControl>
                  <FormControl><FormLabel>Company Address</FormLabel><Input focusBorderColor={focusBorderColor} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} /></FormControl>
                  <FormControl><FormLabel>Company Phone</FormLabel><Input focusBorderColor={focusBorderColor} value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} /></FormControl>
                  <FormControl><FormLabel>VAT Number (Optional)</FormLabel><Input focusBorderColor={focusBorderColor} value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} /></FormControl>
                </SettingsSection>
            </VStack>
          </GridItem>
          
          <GridItem>
            {/* The LogoUploader now lives here, INSIDE its own section, but NOT nested in the other form */}
            <SettingsSection title="Branding" icon={UploadCloud}>
              <LogoUploader profile={profile} formAction={logoFormAction} state={logoState} />
            </SettingsSection>
          </GridItem>

          <GridItem colSpan={{ base: 1, lg: 2 }}>
            <Box as="form" onSubmit={handleDetailsSubmit}>
              <SettingsSection title="Banking & Payment Details" icon={Banknote}>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                  <FormControl><FormLabel>Bank Name</FormLabel><Input focusBorderColor={focusBorderColor} placeholder="e.g. FNB" value={bankName} onChange={(e) => setBankName(e.target.value)} /></FormControl>
                  <FormControl><FormLabel>Account Holder</FormLabel><Input focusBorderColor={focusBorderColor} placeholder="e.g. Coderon (Pty) Ltd" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} /></FormControl>
                  <FormControl><FormLabel>Account Number</FormLabel><Input focusBorderColor={focusBorderColor} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} /></FormControl>
                  <FormControl><FormLabel>Account Type</FormLabel><Input focusBorderColor={focusBorderColor} placeholder="e.g. Gold Business Account" value={accountType} onChange={(e) => setAccountType(e.target.value)} /></FormControl>
                  <FormControl><FormLabel>Branch Code</FormLabel><Input focusBorderColor={focusBorderColor} value={branchCode} onChange={(e) => setBranchCode(e.target.value)} /></FormControl>
                  <FormControl><FormLabel>Branch Name</FormLabel><Input focusBorderColor={focusBorderColor} value={branchName} onChange={(e) => setBranchName(e.target.value)} /></FormControl>
                </Grid>
              </SettingsSection>
              
              <SettingsSection title="Terms & Conditions" icon={FileText}>
                <FormControl><FormLabel>Default Terms & Conditions</FormLabel><Textarea focusBorderColor={focusBorderColor} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="e.g., Payment due within 30 days." rows={5} /></FormControl>
              </SettingsSection>

              <Flex justify="flex-end" mt={8}>
                <Button type="submit" size="lg" isLoading={isLoading} bg={brandGold} color={buttonTextColor} _hover={{ bg: useColorModeValue('yellow.600', 'yellow.400') }}>
                  Save All Settings
                </Button>
              </Flex>
            </Box>
          </GridItem>
        </Grid>
      </VStack>
    </Box>
  );
}