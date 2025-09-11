// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This new configuration block is the final piece for Objective Charlie.
  // It increases the allowed payload size for Server Actions,
  // ensuring our logo files can reach the Adjudicator.
  serverActions: {
    bodySizeLimit: '4mb',
  },
  // Any other Next.js specific config options go here
};

export default nextConfig;