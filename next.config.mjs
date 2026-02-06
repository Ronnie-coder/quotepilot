/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Canonicalize Dashboard List
      {
        source: '/dashboard/quotes',
        destination: '/dashboard/invoices',
        permanent: true,
      },
      // Canonicalize New Invoice Wizard
      {
        source: '/quote/new',
        destination: '/dashboard/invoices/new',
        permanent: true,
      },
      // Canonicalize Edit/View Invoice
      // We catch /quote/:id but exclude 'new' via order or specificity if needed,
      // but strictly 'new' is caught above.
      {
        source: '/quote/:id',
        destination: '/dashboard/invoices/:id',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;