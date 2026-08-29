import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/db';
import { createToken, verifyPassword } from '@/lib/auth';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Find user
    const users = await client`
      SELECT id, email, name, role, password_hash, active
      FROM users
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = users[0];

    if (!user.active) {
      return NextResponse.json(
        { success: false, error: 'User account is inactive' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create token
    const token = createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
