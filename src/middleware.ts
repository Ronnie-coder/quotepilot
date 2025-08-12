import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define which routes are publicly accessible
const isPublicRoute = createRouteMatcher([
  '/', // The landing page
  '/sign-in(.*)', // The sign-in pages
  '/sign-up(.*)', // The sign-up pages
  '/api/(.*)', // Allow any API routes if you have them
]);

export default clerkMiddleware((auth, req) => {
  // Protect all routes that are not public
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  // This matcher ensures the middleware runs on all routes except for static files.
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
