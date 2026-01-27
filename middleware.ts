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
     * - /api/init (database initialization)
     * - /_next (Next.js internals)
     * - /favicon.ico, /icons, etc.
     */
    '/((?!login|api/auth|api/cron|api/init|_next|favicon.ico|icons).*)',
  ],
};
