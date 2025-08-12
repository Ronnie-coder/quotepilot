import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  // These are the pages everyone can see, even if they are not signed in.
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)'
  ],
});

export const config = {
  // This makes sure the middleware runs on all pages except for static files.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};