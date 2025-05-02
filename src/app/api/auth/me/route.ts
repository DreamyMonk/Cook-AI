
// import { NextResponse } from 'next/server';
// import { cookies } from 'next/headers';
// import { verifyJwtToken } from '@/lib/auth';

// export async function GET(request: Request) {
//   try {
//     const tokenCookie = cookies().get('token');
//     if (!tokenCookie) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }

//     const tokenValue = tokenCookie.value;
//     const payload = await verifyJwtToken(tokenValue);

//     if (!payload) {
//       // Clear potentially invalid cookie
//       cookies().set('token', '', { maxAge: -1, path: '/' });
//       return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
//     }

//     // Return user info from the token payload
//     // IMPORTANT: Ensure sensitive data wasn't put in the payload initially!
//     // We specifically added userId, email, name, tokens
//     const { iat, exp, ...userInfo } = payload; // Exclude standard JWT fields

//     return NextResponse.json({ user: userInfo });

//   } catch (error) {
//     console.error('Error verifying token:', error);
//     // Clear potentially invalid cookie on error
//     cookies().set('token', '', { maxAge: -1, path: '/' });
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }

// --- Authentication Disabled ---
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Authentication is currently disabled' }, { status: 503 });
}
