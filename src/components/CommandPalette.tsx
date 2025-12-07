// FILE: src/components/CommandPalette.tsx
'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk'; // The Engine
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { 
  Box, 
  Kbd, 
  HStack, 
  Text, 
  Icon, 
  useColorModeValue, 
  Modal, 
  ModalContent, 
  ModalOverlay 
} from '@chakra-ui/react';
import { 
  Search, 
  FileText, 
  User, 
  Plus, 
  Settings, 
  LayoutDashboard,
  LogOut 
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [results, setResults] = useState<{ clients: any[], quotes: any[] }>({ clients: [], quotes: [] });

  // Styles
  const bg = useColorModeValue('white', '#1A202C');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const itemHoverBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');

  // Fetch Data when opened
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [clients, quotes] = await Promise.all([
          supabase.from('clients').select('id, name').eq('user_id', user.id).limit(5),
          supabase.from('quotes').select('id, invoice_number, clients(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
        ]);

        setResults({ 
          clients: clients.data || [], 
          quotes: quotes.data || [] 
        });
      };
      fetchData();
    }
  }, [isOpen]);

  const handleSelect = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent 
        bg="transparent" 
        shadow="none" 
        mt="15vh"
        maxW="600px"
      >
        <Box 
          bg={bg} 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor} 
          overflow="hidden"
          boxShadow="2xl"
          sx={{
            '[cmdk-root]': { width: '100%' },
            '[cmdk-input]': { 
              fontFamily: 'inherit', 
              border: 'none', 
              width: '100%', 
              fontSize: '16px', 
              padding: '20px', 
              outline: 'none', 
              background: 'transparent',
              color: textColor,
              borderBottom: `1px solid var(--chakra-colors-gray-200)`
            },
            '[cmdk-item]': { 
              contentVisibility: 'auto', 
              cursor: 'pointer', 
              height: '48px', 
              borderRadius: '8px', 
              fontSize: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '0 16px', 
              color: textColor,
              userSelect: 'none',
              transition: 'background 0.1s ease',
              margin: '4px 8px'
            },
            '[cmdk-item][data-selected="true"]': { background: itemHoverBg },
            '[cmdk-group-heading]': {
              userSelect: 'none',
              fontSize: '12px',
              color: subTextColor,
              padding: '8px 16px',
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: '0.5px'
            },
            '[cmdk-empty]': {
                fontSize: '14px',
                textAlign: 'center',
                padding: '32px',
                color: subTextColor
            }
          }}
        >
          <Command loop>
            <Box position="relative" borderBottomWidth="1px" borderColor={borderColor}>
               <Box position="absolute" left={5} top="22px" color={subTextColor} pointerEvents="none">
                  <Search size={18} />
               </Box>
               <Command.Input placeholder="Type a command or search..." autoFocus style={{ paddingLeft: '50px' }} />
               <Box position="absolute" right={4} top="22px">
                  <Kbd>ESC</Kbd>
               </Box>
            </Box>

            <Command.List style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px 0' }}>
              <Command.Empty>No results found.</Command.Empty>

              <Command.Group heading="Navigation">
                <Command.Item onSelect={() => handleSelect('/dashboard')}>
                  <Icon as={LayoutDashboard} /> Dashboard
                </Command.Item>
                <Command.Item onSelect={() => handleSelect('/dashboard/quotes')}>
                  <Icon as={FileText} /> All Documents
                </Command.Item>
                <Command.Item onSelect={() => handleSelect('/dashboard/clients')}>
                  <Icon as={User} /> All Clients
                </Command.Item>
                <Command.Item onSelect={() => handleSelect('/dashboard/settings')}>
                  <Icon as={Settings} /> Settings
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Quick Actions">
                <Command.Item onSelect={() => handleSelect('/quote/new')}>
                  <Icon as={Plus} color="teal.500" /> Create New Document
                </Command.Item>
              </Command.Group>

              {results.clients.length > 0 && (
                <Command.Group heading="Recent Clients">
                  {results.clients.map((client: any) => (
                    <Command.Item key={client.id} onSelect={() => handleSelect(`/dashboard/clients?q=${client.name}`)}>
                      <Icon as={User} color="blue.400" /> {client.name}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {results.quotes.length > 0 && (
                <Command.Group heading="Recent Documents">
                  {results.quotes.map((quote: any) => (
                    <Command.Item 
                      key={quote.id} 
                      // FIX: Combined value allows searching by Number OR Client Name
                      value={`${quote.invoice_number} ${quote.clients?.name} quote invoice`}
                      onSelect={() => handleSelect(`/quote/${quote.id}`)}
                    >
                      <Icon as={FileText} color="purple.400" /> 
                      <HStack>
                        <Text>#{quote.invoice_number}</Text>
                        <Text color={subTextColor} fontSize="xs">• {quote.clients?.name}</Text>
                      </HStack>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </Box>
      </ModalContent>
    </Modal>
  );
};