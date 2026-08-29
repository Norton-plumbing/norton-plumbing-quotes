import { verifyPassword, hashPassword, createToken, verifyToken } from '@/lib/auth';
import { User } from '@/types';

describe('Authentication', () => {
  describe('Password hashing and verification', () => {
    it('should hash and verify passwords correctly', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT tokens', () => {
    it('should create and verify tokens', () => {
      const user: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'owner',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const token = createToken(user);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.user_id).toBe(user.id);
      expect(decoded?.email).toBe(user.email);
      expect(decoded?.role).toBe(user.role);
    });

    it('should reject invalid tokens', () => {
      const decoded = verifyToken('invalid.token.here');
      expect(decoded).toBeNull();
    });
  });
});
