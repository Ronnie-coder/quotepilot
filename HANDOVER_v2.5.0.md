# ✈️ FLIGHT LOG: QuotePilot Handover (v2.5.0 -> v2.6.0)

**Current Version:** v2.5.0-RC1 (Stable)
**Deployment:** Vercel (Production Live)
**Status:** GREEN 🟢

## 🛠️ Mission Briefing (Context)
QuotePilot is a premier invoice and quote generator built for African freelancers and SMEs. We have successfully stabilized the core application, ensuring 100% SEO/Best Practices scores. The app allows users to create, manage, and download PDF invoices/quotes.

## 🏗️ Technical Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database/Auth:** Supabase (Auth: Email, Google, LinkedIn, Twitter, Notion)
- **UI:** Chakra UI + Framer Motion + Lucide React
- **PDF Engine:** @react-pdf/renderer (Client-side generation)
- **Forms:** React Hook Form + Zod

## ✅ Accomplishments in v2.5.0
1.  **Dynamic Currency:** Added support for ZAR, USD, EUR, NGN, KES, GHS, NAD, BWP.
2.  **Extended Profiles:** Manually extended TypeScript interfaces in `InvoiceForm.tsx` to support banking details (bank_name, branch_code, etc.) and contact info despite Supabase type lags.
3.  **Authentication:** Integrated OAuth providers (LinkedIn, Twitter, Notion).
4.  **UI Polish:** Fixed 3D transform CSS in Landing Page, fixed "Unknown Client" bug in Dashboard, improved "BackToTop" visibility.
5.  **Performance:** Achieved 100% SEO and Best Practices on Lighthouse.

## 🚧 Critical Code Notes (DO NOT REVERT)
*   **`src/components/InvoiceForm.tsx`:** We are manually casting `defaultValues` to `any` and using a custom `ExtendedProfile` type that allows `null` values. **Do not strict-type this back to the generated Supabase types** without updating the database schema first, or the build will fail.
*   **`src/components/LandingPageClient.tsx`:** The `transformStyle` prop is passed via the `style={{}}` object, not as a direct prop. This prevents React DOM warnings.

## 🗺️ Roadmap: Operation Velocity (v2.6.0)
We are shifting from "Creation" to "Distribution".

### Stage Alpha: Public View (Priority 1)
**Goal:** Allow a read-only view of an invoice via a public URL.
- Create route: `app/p/[id]/page.tsx`
- Logic: Fetch invoice by ID (bypass RLS for specific public-read function OR use a signed URL).
- UI: Render `DocumentViewer` or a read-only `InvoiceForm` stripped of edit controls.

### Stage Bravo: WhatsApp Integration (Priority 2)
**Goal:** One-click sharing to WhatsApp.
- Action: Add "Share on WhatsApp" button next to "Download PDF".
- Logic: `window.open('https://wa.me/?text=...')` containing the Public Link from Stage Alpha.

### Stage Charlie: Email Integration (Priority 3)
**Goal:** Send PDF directly from the app.
- Stack: Resend API + React-Email.
- Logic: Server Action `sendInvoiceEmail`.
- UI: Modal to confirm recipient email and subject line.

### Stage Delta: Payment Links
**Goal:** Bridge to getting paid.
- Action: Add `payment_link` field to `profiles` table.
- UI: If a link exists, render a "PAY NOW" button on the Public View and PDF.

---
**Commander's Note:** We are building for Africa. Speed and Mobile accessibility are key. Keep the bundle size low.