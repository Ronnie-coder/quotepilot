import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/', // The landing page is public
  '/sign-in(.*)', // Sign-in pages are public
  '/sign-up(.*)', // Sign-up pages are public
  '/api/(.*)', // Your API routes are public
]);

export default clerkMiddleware((auth, req) => {
  // If the route is NOT public, then protect it.
  // The middleware will automatically handle the redirection.
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internal paths (_next) and static files
    '/((?!_next|static|favicon.ico|.*\\..*).*)',
    // Run on API routes
    '/(api|trpc)(.*)',
  ],
};
