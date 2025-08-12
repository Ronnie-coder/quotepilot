import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  // Mark all routes as protected, except for the ones listed below.
  // These routes will be accessible to everyone, signed-in or not.
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/(.*)'
  ],
});

export const config = {
  // This matcher runs the middleware on all routes except for static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
