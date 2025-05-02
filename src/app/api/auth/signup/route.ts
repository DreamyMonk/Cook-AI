
// import { NextResponse } from 'next/server';
// import clientPromise from '@/lib/mongodb';
// import bcrypt from 'bcryptjs';

// const DEFAULT_TOKENS = 30; // Default number of tokens for new users

// export async function POST(request: Request) {
//   try {
//     const { email, password, name } = await request.json();

//     if (!email || !password || !name) {
//       return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
//     }

//     // Validate email format (basic)
//     if (!/\S+@\S+\.\S+/.test(email)) {
//       return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
//     }

//     // Validate password strength (example: min 6 chars)
//     if (password.length < 6) {
//       return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
//     }

//     const client = await clientPromise;
//     const db = client.db(); // Use default DB from connection string

//     // Check if user already exists
//     const existingUser = await db.collection('users').findOne({ email });
//     if (existingUser) {
//       return NextResponse.json({ error: 'User already exists' }, { status: 409 }); // 409 Conflict
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

//     // Insert new user
//     const result = await db.collection('users').insertOne({
//       email,
//       password: hashedPassword,
//       name,
//       tokens: DEFAULT_TOKENS, // Assign default tokens
//       createdAt: new Date(),
//     });

//     // Don't return sensitive info
//     return NextResponse.json({ message: 'User created successfully', userId: result.insertedId }, { status: 201 });

//   } catch (error) {
//     console.error('Signup error:', error);
//     // Avoid leaking detailed database errors
//     return NextResponse.json({ error: 'Internal Server Error during signup' }, { status: 500 });
//   }
// }

// --- Authentication Disabled ---
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Authentication is currently disabled' }, { status: 503 });
}
