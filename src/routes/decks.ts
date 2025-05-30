import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { deckSchema, cardSchema } from '../libs/zodSchemas';
import { db } from '../db';
import { decks, cards } from '../db/schema';
import { successResponse, errorResponse } from '../utils/response';
import { eq } from 'drizzle-orm';

const app = new Hono();

app.post('/', zValidator('json', deckSchema), async (c) => {
  const userId = 'some-user-id'; //TODO: Add auth
  const data = c.req.valid('json');

  const [deck] = await db
    .insert(decks)
    .values({
      userId,
      title: data.title,
      description: data.description ?? null,
    })
    .returning();

  return c.json(successResponse(deck));
});

app.get('/', async (c) => {
  const allDecks = await db.select().from(decks);
  return c.json(successResponse(allDecks));
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const deck = await db.query.decks.findFirst({
    where: eq(decks.id, id),
    with: { cards: true },
  });

  if (!deck) return c.json(errorResponse('Deck not found'), 404);
  return c.json(successResponse(deck));
});

app.put('/:id', zValidator('json', deckSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  await db.update(decks).set(data).where(eq(decks.id, id));
  return c.json(successResponse({ message: 'Deck updated' }));
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await db.delete(decks).where(eq(decks.id, id));
  return c.json(successResponse({ message: 'Deck deleted' }));
});

app.post('/:id/cards', zValidator('json', cardSchema), async (c) => {
  const deckId = c.req.param('id');
  const data = c.req.valid('json');

  const [card] = await db
    .insert(cards)
    .values({
      deckId,
      front: data.front,
      back: data.back,
      hint: data.hint ?? null,
    })
    .returning();

  return c.json(successResponse(card));
});

app.get('/:id/cards', async (c) => {
  const deckId = c.req.param('id');
  const allCards = await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId));
  return c.json(successResponse(allCards));
});

app.put('/cards/:cardId', zValidator('json', cardSchema), async (c) => {
  const cardId = c.req.param('cardId');
  const data = c.req.valid('json');

  await db.update(cards).set(data).where(eq(cards.id, cardId));
  return c.json(successResponse({ message: 'Card updated' }));
});

app.delete('/cards/:cardId', async (c) => {
  const cardId = c.req.param('cardId');
  await db.delete(cards).where(eq(cards.id, cardId));
  return c.json(successResponse({ message: 'Card deleted' }));
});
