'use client';

import { FormControl, FormLabel, Select, Text, useColorModeValue } from '@chakra-ui/react';
import { PaymentSettings } from '@/types/profile';

interface Props {
  settings: PaymentSettings | null;
  selectedUrl: string | null;
  onChange: (url: string) => void;
}

export default function PaymentMethodSelector({ settings, selectedUrl, onChange }: Props) {
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const color = useColorModeValue('gray.900', 'white');

  if (!settings || !settings.providers || settings.providers.length === 0) {
    return null;
  }

  const activeProviders = settings.providers.filter(p => p.enabled);

  if (activeProviders.length === 0) return null;

  return (
    <FormControl mb={4}>
      <FormLabel fontSize="sm" fontWeight="bold" color="gray.500">
        Online Payment Link
      </FormLabel>
      <Select 
        size="sm" 
        value={selectedUrl || ''} 
        onChange={(e) => onChange(e.target.value)}
        placeholder="Select a payment link..."
        bg={bg}
        color={color}
        borderColor={borderColor}
        focusBorderColor="brand.500"
        sx={{
          '> option': {
            background: bg,
            color: color,
          },
        }}
      >
        {activeProviders.map((p) => (
          <option key={p.id} value={p.url}>
            {p.name}
          </option>
        ))}
        <option value="">(No Link)</option>
      </Select>
      <Text fontSize="xs" color="gray.400" mt={1}>
        Adds a "Pay Now" button to the invoice.
      </Text>
    </FormControl>
  );
}