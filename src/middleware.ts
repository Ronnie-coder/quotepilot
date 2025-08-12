import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/', // The landing page is public
  '/sign-in(.*)', // Sign-in pages are public
  '/sign-up(.*)', // Sign-up pages are public
  '/api/(.*)' // Allow API routes to be public
]);

export default clerkMiddleware((auth, req) => {
  // If the route is not public, then protect it.
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internal paths and static files
    '/((?!_next|static|favicon.ico|.*\\..*).*)',
    '/(api|trpc)(.*)',
  ],
};
