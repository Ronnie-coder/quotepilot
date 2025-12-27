'use client';

import {
  Box, Button, FormControl, FormLabel, Input, VStack, useToast, Textarea, Heading, HStack, Flex, Grid, GridItem, Icon, useColorModeValue, SimpleGrid, Select, Badge, Tooltip
} from '@chakra-ui/react';
import { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useActionState } from 'react'; // 🟢 FIX: Switched to useActionState
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Tables } from '@/types/supabase';
// 🟢 IMPORT NEW ACTION & COMPONENT
import { uploadLogoAction, uploadSignatureAction } from './actions';
import LogoUploader from '@/components/LogoUploader';
import SignatureUploader from '@/components/SignatureUploader'; 

import { Building, Banknote, FileText, UploadCloud, Save, Link as LinkIcon, CheckCircle, PenTool } from 'lucide-react'; 
import { motion } from 'framer-motion';
import { PaymentSettings, PaymentProviderType } from '@/types/profile';

type ProfileWithBanking = Tables<'profiles'> & {
  bank_name?: string | null;
  account_holder?: string | null;
  account_number?: string | null;
  account_type?: string | null;
  branch_code?: string | null;
  branch_name?: string | null;
  currency?: string | null;
  payment_settings?: PaymentSettings | null; 
  signature_url?: string | null; // 🟢 Added Type
};

type SettingsFormProps = {
  user: User;
  profile: ProfileWithBanking | null;
};

// ... (Variants Constants stay same) ...
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

// ... (SettingsSection Component stays same) ...
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
  const focusBorderColor = useColorModeValue('cyan.500', 'cyan.300');

  // --- LOGO STATE ---
  const initialLogoState = { success: false, message: '' };
  // 🟢 FIX: useActionState instead of useFormState
  const [logoState, logoFormAction] = useActionState(uploadLogoAction, initialLogoState);

  // --- 🟢 NEW: SIGNATURE STATE ---
  const initialSigState = { success: false, message: '' };
  // 🟢 FIX: useActionState instead of useFormState
  const [sigState, sigFormAction] = useActionState(uploadSignatureAction, initialSigState);

  // Toast Logic for Uploads
  useEffect(() => {
    if (logoState.message) {
      toast({ title: logoState.success ? 'Success' : 'Error', description: logoState.message, status: logoState.success ? 'success' : 'error', duration: 4000 });
      if (logoState.success) router.refresh();
    }
  }, [logoState, toast, router]);

  useEffect(() => {
    if (sigState.message) {
      toast({ title: sigState.success ? 'Success' : 'Error', description: sigState.message, status: sigState.success ? 'success' : 'error', duration: 4000 });
      if (sigState.success) router.refresh();
    }
  }, [sigState, toast, router]);
  
  // (Onboarding Toast Logic remains same...)

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

  // Payment Link Logic
  const defaultPaymentSettings: PaymentSettings = {
    providers: [
      { id: 'paystack', name: 'Paystack', url: '', enabled: false },
      { id: 'yoco', name: 'Yoco', url: '', enabled: false },
      { id: 'paypal', name: 'PayPal', url: '', enabled: false },
      { id: 'manual', name: 'Manual / Other', url: '', enabled: false },
    ],
    default_provider: null
  };

  const mergedSettings = profile?.payment_settings 
    ? { ...defaultPaymentSettings, ...profile.payment_settings, providers: defaultPaymentSettings.providers.map(p => { const saved = profile.payment_settings?.providers.find(sp => sp.id === p.id); return saved || p; }) }
    : defaultPaymentSettings;

  const [paymentConfig, setPaymentConfig] = useState<PaymentSettings>(mergedSettings);
  
  const handleLinkChange = (id: PaymentProviderType, url: string) => {
    setPaymentConfig(prev => ({ ...prev, providers: prev.providers.map(p => p.id === id ? { ...p, url, enabled: !!url } : p) }));
  };

  const handleSetDefault = (id: PaymentProviderType) => {
    setPaymentConfig(prev => ({ ...prev, default_provider: prev.default_provider === id ? null : id }));
  };

  const [isLoading, setIsLoading] = useState(false);

  // Main Submit Logic
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const payload = {
      id: user.id, 
      company_name: companyName, company_address: companyAddress, company_phone: companyPhone, vat_number: vatNumber, currency: currency, terms_conditions: terms,
      bank_name: bankName, account_holder: accountHolder, account_number: accountNumber, branch_code: branchCode, branch_name: branchName, account_type: accountType,
      payment_settings: paymentConfig, 
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload as any);

    if (error) {
      toast({ title: 'Error Updating Profile', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Settings Saved', description: 'Your profile has been updated.', status: 'success' });
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <Box as={motion.div} variants={containerVariants} initial="hidden" animate="visible">
      <VStack spacing={8} align="stretch">
        
        {/* Top Section: Profile & Branding */}
        <Grid templateColumns={{ base: '1fr', lg: '3fr 2fr' }} gap={8}>
          
          {/* Left Column: Form Data */}
          <GridItem as="form" onSubmit={handleDetailsSubmit}>
            {/* 🟢 UPDATED: "Business Identity" */}
            <SettingsSection title="Business Identity" icon={Building}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired gridColumn={{ md: 'span 2' }}>
                  <FormLabel>Company Name</FormLabel>
                  <Input focusBorderColor={focusBorderColor} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Billing Currency</FormLabel>
                  <Select focusBorderColor={focusBorderColor} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <optgroup label="Popular">
                        <option value="ZAR">ZAR (South African Rand)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="GBP">GBP (British Pound)</option>
                    </optgroup>
                    <optgroup label="African Currencies">
                        <option value="NGN">NGN (Nigerian Naira)</option>
                        <option value="KES">KES (Kenyan Shilling)</option>
                        <option value="GHS">GHS (Ghanaian Cedi)</option>
                        <option value="UGX">UGX (Ugandan Shilling)</option>
                        <option value="TZS">TZS (Tanzanian Shilling)</option>
                        <option value="RWF">RWF (Rwandan Franc)</option>
                        <option value="BWP">BWP (Botswana Pula)</option>
                        <option value="NAD">NAD (Namibian Dollar)</option>
                        <option value="ZMW">ZMW (Zambian Kwacha)</option>
                        <option value="EGP">EGP (Egyptian Pound)</option>
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
          
          {/* Right Column: Uploaders */}
          <GridItem>
            <VStack spacing={8} align="stretch" h="full">
              {/* 🟢 UPDATED: "Brand Assets" */}
              <SettingsSection title="Brand Assets" icon={UploadCloud}>
                 <LogoUploader profile={profile} formAction={logoFormAction} state={logoState} />
              </SettingsSection>
              
              {/* 🟢 NEW: SIGNATURE SECTION */}
              <SettingsSection title="Digital Signature" icon={PenTool}>
                 <SignatureUploader profile={profile} formAction={sigFormAction} state={sigState} />
              </SettingsSection>
            </VStack>
          </GridItem>
        </Grid>

        {/* Bottom Section: Payments & Bank */}
        <Box as="form" onSubmit={handleDetailsSubmit}>
          <VStack spacing={8} align="stretch">
            
            {/* 🟢 UPDATED: "Payment Gateways" */}
            <SettingsSection title="Payment Gateways" icon={LinkIcon}>
              <Box>
                <Badge colorScheme="cyan" mb={4}>Smart Feature</Badge>
                <Box color="gray.500" fontSize="sm" mb={6}>
                  Set your payment links here. The default link will generate a QR code and Pay button on your invoice.
                </Box>
                <SimpleGrid columns={1} spacing={4}>
                  {paymentConfig.providers.map((provider) => (
                    <Flex key={provider.id} align="center" gap={4} p={4} borderWidth="1px" borderRadius="md" bg={paymentConfig.default_provider === provider.id ? useColorModeValue('cyan.50', 'rgba(0, 200, 200, 0.1)') : 'transparent'} borderColor={paymentConfig.default_provider === provider.id ? 'cyan.400' : 'inherit'}>
                      <Box minW="100px"><FormLabel mb={0} fontWeight="bold" fontSize="sm">{provider.name}</FormLabel></Box>
                      <Input placeholder={`Your ${provider.name} URL`} value={provider.url} onChange={(e) => handleLinkChange(provider.id, e.target.value)} size="sm" borderRadius="md" focusBorderColor={focusBorderColor} />
                      <Tooltip label={!provider.url ? "Add a URL first" : "Set as default for new invoices"}>
                        <Button size="xs" colorScheme={paymentConfig.default_provider === provider.id ? "cyan" : "gray"} variant={paymentConfig.default_provider === provider.id ? "solid" : "outline"} onClick={() => handleSetDefault(provider.id)} isDisabled={!provider.url} leftIcon={paymentConfig.default_provider === provider.id ? <CheckCircle size={12} /> : undefined}>
                          {paymentConfig.default_provider === provider.id ? 'Default' : 'Set Default'}
                        </Button>
                      </Tooltip>
                    </Flex>
                  ))}
                </SimpleGrid>
              </Box>
            </SettingsSection>

            <SettingsSection title="Banking Details (EFT)" icon={Banknote}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl><FormLabel>Bank Name</FormLabel><Input focusBorderColor={focusBorderColor} value={bankName} onChange={(e) => setBankName(e.target.value)} /></FormControl>
                <FormControl><FormLabel>Account Holder</FormLabel><Input focusBorderColor={focusBorderColor} value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} /></FormControl>
                <FormControl><FormLabel>Account Number</FormLabel><Input focusBorderColor={focusBorderColor} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} /></FormControl>
                <FormControl><FormLabel>Branch Code</FormLabel><Input focusBorderColor={focusBorderColor} value={branchCode} onChange={(e) => setBranchCode(e.target.value)} /></FormControl>
              </SimpleGrid>
            </SettingsSection>
            
            <SettingsSection title="Terms & Conditions" icon={FileText}>
              <FormControl>
                <FormLabel>Default Footer Text</FormLabel>
                <Textarea focusBorderColor={focusBorderColor} value={terms} onChange={(e) => setTerms(e.target.value)} rows={4} resize="none"/>
              </FormControl>
            </SettingsSection>

            <Flex justify="flex-end" pt={4}>
              <Button type="submit" size="lg" isLoading={isLoading} bg={useColorModeValue('cyan.500', 'cyan.400')} color="white" leftIcon={<Icon as={Save} />} _hover={{ bg: useColorModeValue('cyan.600', 'cyan.500') }}>
                Save All Settings
              </Button>
            </Flex>
          </VStack>
        </Box>

      </VStack>
    </Box>
  );
}