import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken, AuthToken } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  auth?: AuthToken;
}

/**
 * Verify JWT token from request
 */
export function verifyAuth(request: NextRequest): AuthToken | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = extractTokenFromHeader(authHeader);
  if (!token) return null;

  return verifyToken(token);
}

/**
 * Middleware to require authentication
 */
export function requireAuth(handler: Function) {
  return async (request: NextRequest) => {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    (request as AuthenticatedRequest).auth = auth;
    return handler(request);
  };
}

/**
 * Middleware to require specific roles
 */
export function requireRole(roles: string[], handler: Function) {
  return requireAuth(async (request: NextRequest) => {
    const auth = (request as AuthenticatedRequest).auth;
    if (!auth || !roles.includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }
    return handler(request);
  });
}
