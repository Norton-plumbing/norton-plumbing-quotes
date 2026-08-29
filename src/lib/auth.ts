import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { AuthToken, User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Hash password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Create JWT token
 */
export function createToken(user: User): string {
  const payload: AuthToken = {
    user_id: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };

  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * Check if user has required role
 */
export function hasRole(
  userRole: string,
  requiredRoles: string[]
): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Get permission level (numeric for easy comparison)
 */
export function getPermissionLevel(
  role: string
): number {
  const levels: { [key: string]: number } = {
    owner: 4,
    office: 3,
    estimator: 2,
    field: 1,
  };
  return levels[role] || 0;
}

/**
 * Check if user can modify pricing
 */
export function canModifyPricing(role: string): boolean {
  return ['owner', 'office', 'estimator'].includes(role);
}

/**
 * Check if user can manage users and settings
 */
export function canManageSettings(role: string): boolean {
  return role === 'owner';
}
