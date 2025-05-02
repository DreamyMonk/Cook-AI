
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { verifyJwtToken } from '@/lib/auth';

// const AUTH_PAGES = ['/auth']; // Pages related to authentication

// const isAuthPage = (url: string) => AUTH_PAGES.some((page) => url.startsWith(page));

// export async function middleware(request: NextRequest) {
//   const { url, nextUrl, cookies } = request;
//   const token = cookies.get('token')?.value;
//   const isAuthRoute = isAuthPage(nextUrl.pathname);

//   // Try to verify the token
//   const hasVerifiedToken = token && (await verifyJwtToken(token));

//   // Redirect authenticated users away from auth pages
//   if (isAuthRoute && hasVerifiedToken) {
//     return NextResponse.redirect(new URL('/', url));
//   }

//   // Redirect unauthenticated users trying to access protected pages (root '/' in this case)
//   // Adjust this if you have other protected routes
//   if (!isAuthRoute && !hasVerifiedToken && nextUrl.pathname === '/') {
//     // Allow access to root even if not logged in for this app
//     return NextResponse.next();
//   }
//   if (!isAuthRoute && !hasVerifiedToken && nextUrl.pathname !== '/') {
//      // If accessing any other page requires login, redirect here
//      // Example: return NextResponse.redirect(new URL('/auth', url));
//   }


//   // Allow the request to proceed if none of the above conditions are met
//   return NextResponse.next();
// }

// // See "Matching Paths" below to learn more
// export const config = {
//     // Match all routes except for API routes, static files, and image optimization files
//   matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
// };


// --- Authentication Disabled ---
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simply pass through all requests
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
