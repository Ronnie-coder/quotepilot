// src/components/AddClientForm.tsx (FULL REPLACEMENT)
"use client";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client"; // <-- MODIFICATION 1: Use unified client

// --- TACTICAL ENHANCEMENTS: Upgraded Imports ---
import { useToast, FormControl, FormLabel, Input, Button, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

export default function AddClientForm() {
  const { userId } = useAuth(); // <-- MODIFICATION 2: getToken no longer needed
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!userId) {
      toast({ title: "Authentication Error", description: "User ID not available.", status: "error" });
      setIsLoading(false);
      return;
    }

    // --- ENEMY NEUTRALIZED ---
    // The rogue getToken and createSupabaseClient calls have been purged.
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.from("clients").insert({
      name: name,
      user_id: userId,
    });

    if (error) {
      toast({ title: "An error occurred.", description: error.message, status: "error" });
    } else {
      toast({ title: "Client Created", description: `"${name}" has been saved successfully.`, status: "success" });
      setName("");
      router.push('/dashboard/clients');
    }
    
    setIsLoading(false);
  };

  return (
    // --- TACTICAL ENHANCEMENT: Upgraded to Chakra UI Form ---
    <VStack as="form" onSubmit={handleSubmit} spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel>Client Name</FormLabel>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter client's full name or company"
          disabled={isLoading}
        />
      </FormControl>
      <Button type="submit" isLoading={isLoading} colorScheme="brand">
        Save Client
      </Button>
    </VStack>
  );
}