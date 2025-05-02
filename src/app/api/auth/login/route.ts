
// import { NextResponse } from 'next/server';
// import clientPromise from '@/lib/mongodb';
// import bcrypt from 'bcryptjs';
// import { SignJWT } from 'jose';
// import { getJwtSecretKey } from '@/lib/auth';
// import { cookies } from 'next/headers';

// export async function POST(request: Request) {
//   try {
//     const { email, password } = await request.json();

//     if (!email || !password) {
//       return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
//     }

//     const client = await clientPromise;
//     const db = client.db(); // Use default DB from connection string

//     const user = await db.collection('users').findOne({ email });

//     if (!user) {
//       return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password);

//     if (!isPasswordValid) {
//       return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
//     }

//     // Generate JWT
//     const token = await new SignJWT({ userId: user._id.toString(), email: user.email, name: user.name, tokens: user.tokens }) // Include name and tokens
//       .setProtectedHeader({ alg: 'HS256' })
//       .setIssuedAt()
//       .setExpirationTime('1h') // Token valid for 1 hour
//       .sign(getJwtSecretKey());

//     // Set cookie
//     cookies().set('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       maxAge: 60 * 60, // 1 hour
//       path: '/',
//     });

//     // Return minimal user info (no password hash!)
//     const { password: _, ...userInfo } = user;
//     return NextResponse.json({ user: userInfo });

//   } catch (error) {
//     console.error('Login error:', error);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }

// --- Authentication Disabled ---
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Authentication is currently disabled' }, { status: 503 });
}
