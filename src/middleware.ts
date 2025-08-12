// /src/middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  // By default, all routes are protected.
  // We explicitly list the routes that should be accessible to everyone (public).
  publicRoutes: [
    '/', // Allow the landing page
    '/sign-in(.*)', // Allow the sign-in pages
    '/sign-up(.*)', // Allow the sign-up pages
  ],
});

export const config = {
  // This matcher ensures the middleware runs on all routes except for static files.
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};