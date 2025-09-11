// src/middleware.ts

import { clerkMiddleware } from "@clerk/nextjs/server";

// This is the standard, default middleware from Clerk.
// It automatically protects all routes except for those specified
// in the `publicRoutes` array.
export default clerkMiddleware({
  // The home page is accessible to everyone, logged in or not.
  publicRoutes: ['/']
});

export const config = {
  // This matcher ensures the middleware runs on all routes except
  // static assets and Next.js internal paths.
  // This is the key part that will include your /api routes.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};