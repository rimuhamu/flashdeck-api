import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { registerSchema } from '../lib/zodSchemas';
import { hash, genSalt } from 'bcrypt';
import { db } from '../db';
import { successResponse, errorResponse } from '../util/response';
import { users } from '../db/schema';

const app = new Hono();
const BCRYPT_SALT_ROUNDS = 10;

app.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  try {
    const salt = await genSalt(BCRYPT_SALT_ROUNDS);
    const hashedPassword = await hash(password, salt);
    const [user] = await db
      .insert(users)
      .values({
        email,
        hashedPassword,
      })
      .returning();

    return c.json(successResponse({ id: user.id, email: user.email }));
  } catch (error: any) {
    if (
      error.code === '23505' ||
      error.message?.includes('duplicate key value')
    ) {
      return c.json(errorResponse('User with this email already exists'), 409);
    }
    console.error('Registration error:', error);
    return c.json(
      errorResponse('Registration failed. Please try again later.'),
      500
    );
  }
});

export default app;
