import { z } from 'zod';

export const deckSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export const cardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  hint: z.string().optional(),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
