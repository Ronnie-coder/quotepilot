// src/app/quote/new/page.tsx

import { InvoiceForm } from "@/components/InvoiceForm"; // Adjust path if necessary

export default function NewQuotePage() {
  return (
    <div className="container mx-auto p-4">
      {/* We render the InvoiceForm with NO defaultValues prop.
          This automatically puts it into "Create Mode". */}
      <InvoiceForm />
    </div>
  );
}