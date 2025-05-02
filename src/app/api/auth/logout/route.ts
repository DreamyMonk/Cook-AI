
// import { NextResponse } from 'next/server';
// import { cookies } from 'next/headers';

// export async function POST() {
//   try {
//     // Clear the token cookie
//     cookies().set('token', '', {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       maxAge: -1, // Expire immediately
//       path: '/',
//     });

//     return NextResponse.json({ message: 'Logged out successfully' });
//   } catch (error) {
//     console.error('Logout error:', error);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }

// --- Authentication Disabled ---
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Authentication is currently disabled' }, { status: 503 });
}
