'use client';

import {
  Box, Button, FormControl, FormLabel, Input, VStack, useToast, Textarea, Heading, HStack, Flex, Grid, GridItem, Icon, useColorModeValue, SimpleGrid, Select, Divider
} from '@chakra-ui/react';
import { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/supabase';
import { uploadLogoAction } from './actions';
import LogoUploader from '@/components/LogoUploader';
import { Building, Banknote, FileText, UploadCloud, Save, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

type ProfileWithBanking = Tables<'profiles'> & {
  bank_name?: string | null;
  account_holder?: string | null;
  account_number?: string | null;
  account_type?: string | null;
  branch_code?: string | null;
  branch_name?: string | null;
  currency?: string | null; 
};

type SettingsFormProps = {
  user: User;
  profile: ProfileWithBanking | null;
};

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// --- SETTINGS SECTION COMPONENT ---
const SettingsSection = ({ title, icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.800', 'white');
  const iconBg = useColorModeValue('cyan.50', 'gray.700');
  const iconColor = useColorModeValue('cyan.500', 'cyan.300');

  return (
    <Box 
      as={motion.div} 
      variants={itemVariants}
      bg={cardBg} 
      p={{ base: 6, md: 8 }} 
      borderRadius="xl"
      shadow="sm" 
      borderWidth="1px" 
      borderColor={borderColor}
      transition="all 0.2s"
      _hover={{ shadow: 'md' }}
      h="full"
    >
      <HStack as="header" spacing={4} mb={6}>
        <Flex p={2} borderRadius="lg" bg={iconBg} color={iconColor}>
          <Icon as={icon} boxSize={5} />
        </Flex>
        <Heading as="h2" size="md" color={headingColor}>{title}</Heading>
      </HStack>
      <VStack spacing={6} align="stretch">
        {children}
      </VStack>
    </Box>
  );
};

export default function SettingsForm({ user, profile }: SettingsFormProps) {
  const supabase = createSupabaseBrowserClient();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastShownRef = useRef(false);
  
  // --- THEME COLORS ---
  const focusBorderColor = useColorModeValue('cyan.500', 'cyan.300');
  const buttonBg = useColorModeValue('cyan.500', 'cyan.400');
  const buttonHoverBg = useColorModeValue('cyan.600', 'cyan.500');
  const buttonText = 'white';

  const initialLogoState = { success: false, message: '' };
  const [logoState, logoFormAction] = useFormState(uploadLogoAction, initialLogoState);

  // Logo Upload Toast Logic
  useEffect(() => {
    if (logoState.message) {
      toast({
        title: logoState.success ? 'Success' : 'Error',
        description: logoState.message,
        status: logoState.success ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
      if (logoState.success) { router.refresh(); }
    }
  }, [logoState, toast, router]);
  
  // Onboarding Toast Logic
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

  // Form Field States
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [companyAddress, setCompanyAddress] = useState(profile?.company_address || '');
  const [companyPhone, setCompanyPhone] = useState(profile?.company_phone || '');
  const [vatNumber, setVatNumber] = useState(profile?.vat_number || '');
  const [currency, setCurrency] = useState(profile?.currency || 'ZAR');
  const [terms, setTerms] = useState(profile?.terms_conditions || '');
  
  // Banking States
  const [bankName, setBankName] = useState(profile?.bank_name || '');
  const [accountHolder, setAccountHolder] = useState(profile?.account_holder || '');
  const [accountNumber, setAccountNumber] = useState(profile?.account_number || '');
  const [branchCode, setBranchCode] = useState(profile?.branch_code || '');
  const [branchName, setBranchName] = useState(profile?.branch_name || '');
  const [accountType, setAccountType] = useState(profile?.account_type || '');
  
  const [isLoading, setIsLoading] = useState(false);

  // Form Submission Logic
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const payload = {
      id: user.id, 
      company_name: companyName, 
      company_address: companyAddress,
      company_phone: companyPhone, 
      vat_number: vatNumber, 
      currency: currency,
      terms_conditions: terms,
      bank_name: bankName, 
      account_holder: accountHolder, 
      account_number: accountNumber,
      branch_code: branchCode, 
      branch_name: branchName, 
      account_type: accountType,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload as any);

    if (error) {
      toast({ title: 'Error Updating Profile', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Profile Updated Successfully', status: 'success' });
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <Box as={motion.div} variants={containerVariants} initial="hidden" animate="visible">
      <VStack spacing={8} align="stretch">
        
        {/* Top Section: Profile & Logo */}
        <Grid templateColumns={{ base: '1fr', lg: '3fr 2fr' }} gap={8}>
          <GridItem as="form" onSubmit={handleDetailsSubmit}>
            <SettingsSection title="Company Profile" icon={Building}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired gridColumn={{ md: 'span 2' }}>
                  <FormLabel>Company Name</FormLabel>
                  <Input focusBorderColor={focusBorderColor} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </FormControl>
                
                {/* --- PAN-AFRICAN CURRENCY SELECTOR --- */}
                <FormControl isRequired>
                  <FormLabel>Billing Currency</FormLabel>
                  <Select 
                    focusBorderColor={focusBorderColor} 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <optgroup label="Common">
                      <option value="ZAR">ZAR (R) - South Africa</option>
                      <option value="USD">USD ($) - International</option>
                    </optgroup>
                    
                    <optgroup label="Southern Africa">
                      <option value="NAD">NAD (N$) - Namibia</option>
                      <option value="BWP">BWP (P) - Botswana</option>
                      <option value="ZMW">ZMW (K) - Zambia</option>
                      <option value="MZN">MZN (MT) - Mozambique</option>
                      <option value="AOA">AOA (Kz) - Angola</option>
                      <option value="LSL">LSL (L) - Lesotho</option>
                      <option value="SZL">SZL (E) - Eswatini</option>
                    </optgroup>

                    <optgroup label="East Africa">
                      <option value="KES">KES (KSh) - Kenya</option>
                      <option value="TZS">TZS (TSh) - Tanzania</option>
                      <option value="UGX">UGX (USh) - Uganda</option>
                      <option value="RWF">RWF (FRw) - Rwanda</option>
                      <option value="ETB">ETB (Br) - Ethiopia</option>
                    </optgroup>

                    <optgroup label="West Africa">
                      <option value="NGN">NGN (₦) - Nigeria</option>
                      <option value="GHS">GHS (₵) - Ghana</option>
                      <option value="XOF">XOF (CFA) - West Africa</option>
                      <option value="SLL">SLL (Le) - Sierra Leone</option>
                    </optgroup>

                    <optgroup label="North Africa">
                      <option value="EGP">EGP (E£) - Egypt</option>
                      <option value="MAD">MAD (DH) - Morocco</option>
                    </optgroup>

                    <optgroup label="Central Africa / Islands">
                      <option value="XAF">XAF (CFA) - Central Africa</option>
                      <option value="MUR">MUR (₨) - Mauritius</option>
                    </optgroup>

                    <optgroup label="Global">
                      <option value="EUR">EUR (€) - Europe</option>
                      <option value="GBP">GBP (£) - United Kingdom</option>
                      <option value="AUD">AUD ($) - Australia</option>
                    </optgroup>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Company Phone</FormLabel>
                  <Input focusBorderColor={focusBorderColor} value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
                </FormControl>

                <FormControl gridColumn={{ md: 'span 2' }}>
                  <FormLabel>Company Address</FormLabel>
                  <Input focusBorderColor={focusBorderColor} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
                </FormControl>

                <FormControl>
                  <FormLabel>VAT Number (Optional)</FormLabel>
                  <Input focusBorderColor={focusBorderColor} value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
                </FormControl>
              </SimpleGrid>
            </SettingsSection>
          </GridItem>
          
          <GridItem>
            <SettingsSection title="Branding" icon={UploadCloud}>
              <LogoUploader profile={profile} formAction={logoFormAction} state={logoState} />
            </SettingsSection>
          </GridItem>
        </Grid>

        {/* Bottom Section: Banking & Terms */}
        <Box as="form" onSubmit={handleDetailsSubmit}>
          <VStack spacing={8} align="stretch">
            <SettingsSection title="Banking & Payment Details" icon={Banknote}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl>
                  <FormLabel>Bank Name</FormLabel>
                  <Input focusBorderColor={focusBorderColor} placeholder="e.g. FNB" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Account Holder</FormLabel>
                  <Input focusBorderColor={focusBorderColor} placeholder="e.g. Coderon (Pty) Ltd" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Account Number</FormLabel>
                  <Input focusBorderColor={focusBorderColor} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Account Type</FormLabel>
                  <Input focusBorderColor={focusBorderColor} placeholder="e.g. Current Account" value={accountType} onChange={(e) => setAccountType(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Branch Code</FormLabel>
                  <Input focusBorderColor={focusBorderColor} value={branchCode} onChange={(e) => setBranchCode(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Branch Name</FormLabel>
                  <Input focusBorderColor={focusBorderColor} value={branchName} onChange={(e) => setBranchName(e.target.value)} />
                </FormControl>
              </SimpleGrid>
            </SettingsSection>
            
            <SettingsSection title="Terms & Conditions" icon={FileText}>
              <FormControl>
                <FormLabel>Default Footer Text</FormLabel>
                <Textarea 
                  focusBorderColor={focusBorderColor} 
                  value={terms} 
                  onChange={(e) => setTerms(e.target.value)} 
                  placeholder="e.g., Payment due within 30 days. Banking details above." 
                  rows={4} 
                  resize="none"
                />
              </FormControl>
            </SettingsSection>

            {/* Save Button */}
            <Flex justify="flex-end" pt={4}>
              <Button 
                type="submit" 
                size="lg" 
                isLoading={isLoading} 
                bg={buttonBg} 
                color={buttonText} 
                leftIcon={<Icon as={Save} />}
                _hover={{ bg: buttonHoverBg, transform: 'translateY(-2px)', shadow: 'md' }}
                transition="all 0.2s"
              >
                Save All Settings
              </Button>
            </Flex>
          </VStack>
        </Box>

      </VStack>
    </Box>
  );
}