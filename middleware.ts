import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login
     * - /api/auth (NextAuth routes)
     * - /api/cron (cron jobs need to bypass auth)
     * - /_next (Next.js internals)
     * - /favicon.ico, /icons, etc.
     */
    '/((?!login|api/auth|api/cron|_next|favicon.ico|icons).*)',
  ],
};
