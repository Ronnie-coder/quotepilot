import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define the routes that are publicly accessible.
// Everyone can see these pages, even if they are not signed in.
const isPublicRoute = createRouteMatcher([
  '/', // The landing page
  '/sign-in(.*)', // The sign-in pages
  '/sign-up(.*)', // The sign-up pages
  '/api/(.*)', // Any API routes you have
]);

export default clerkMiddleware((auth, req) => {
  // If the route is not public, then protect it.
  // Clerk will handle the redirection to the sign-in page.
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