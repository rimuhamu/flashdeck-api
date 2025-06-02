import { db } from '../db';
import { users } from '../db/schema';
import { genSalt, hash, compare } from 'bcrypt-ts';
import { sign, verify, decode } from 'jsonwebtoken';
import { eq } from 'drizzle-orm';

export interface UserPayload {
  id: string;
  email: string;
}

export class AuthService {
  private readonly JWT_SECRET =
    process.env.JWT_SECRET || 'super-secret-jwt-token';
  private readonly SALT_ROUNDS = 10;
  private readonly TOKEN_EXPIRY = '8h';
  async hashPassword(password: string): Promise<string> {
    const salt = await genSalt(this.SALT_ROUNDS);
    return hash(password, salt);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }

  generateToken(payload: UserPayload): string {
    return sign(payload, this.JWT_SECRET, { expiresIn: this.TOKEN_EXPIRY });
  }

  verifyToken(token: string): UserPayload | null {
    try {
      return verify(token, this.JWT_SECRET) as UserPayload;
    } catch (error) {
      return null;
    }
  }

  async registerUser(
    email: string,
    password: string
  ): Promise<{ user: any; token: string }> {
    const hashedPassword = await this.hashPassword(password);

    return await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email,
          hashedPassword,
        })
        .returning({
          id: users.id,
          email: users.email,
          createdAt: users.createdAt,
        });

      console.log('USER CREATED: ', user);

      const token = this.generateToken({
        id: user.id,
        email: user.email,
      });

      return { user, token };
    });
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: any; token: string } | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) return null;

    const passwordValid = await this.verifyPassword(
      password,
      user.hashedPassword
    );

    if (!passwordValid) return null;

    const token = this.generateToken({
      id: user.id,
      email: user.email,
    });

    const { hashedPassword: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async getUserById(
    user: UserPayload | { userId: string }
  ): Promise<any | null> {
    const userId = 'id' in user ? user.id : user.userId;

    if (!userId) {
      console.error('No user ID provided to getUserById');
      return null;
    }

    console.log(`Looking up user with ID: ${userId}`);

    const foundUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!foundUser) return null;

    const { hashedPassword, ...userWithoutPassword } = foundUser;
    return userWithoutPassword;
  }
}

//singleton export
export const authService = new AuthService();
