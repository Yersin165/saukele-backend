const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');

let coupleToken, weddingId;

beforeEach(async () => {
  await prisma.transaction.deleteMany();
  await prisma.poolContribution.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.order.deleteMany();
  await prisma.giftItem.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.weddingProfile.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'couple@example.com', password: 'StrongPass123!', role: 'COUPLE' });
  coupleToken = res.body.accessToken;
  await prisma.user.update({ where: { email: 'couple@example.com' }, data: { isVerified: true } });

  const wRes = await request(app)
    .post('/api/weddings')
    .set('Authorization', `Bearer ${coupleToken}`)
    .send({ brideName: 'Aisha', groomName: 'Daniyar', weddingDate: '2026-09-01T00:00:00.000Z', location: 'Almaty', weddingType: 'CITY' });
  weddingId = wRes.body.id;
});

afterAll(async () => { await prisma.$disconnect(); });

describe('Gift creation', () => {
  it('creates a standard gift', async () => {
    const res = await request(app)
      .post('/api/gifts')
      .set('Authorization', `Bearer ${coupleToken}`)
      .send({ weddingProfileId: weddingId, name: 'Kettle', price: 20000 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Kettle');
    expect(res.body.status).toBe('AVAILABLE');
  });

  it('creates a pool gift with targetAmount', async () => {
    const res = await request(app)
      .post('/api/gifts')
      .set('Authorization', `Bearer ${coupleToken}`)
      .send({ weddingProfileId: weddingId, name: 'Kilem', price: 150000, isPoolGift: true, targetAmount: 150000 });
    expect(res.status).toBe(201);
    expect(res.body.isPoolGift).toBe(true);
    expect(res.body.currentAmount).toBe(0);
  });

  it('rejects gift for non-existent wedding', async () => {
    const res = await request(app)
      .post('/api/gifts')
      .set('Authorization', `Bearer ${coupleToken}`)
      .send({ weddingProfileId: 'non-existent-id', name: 'Kettle', price: 20000 });
    expect(res.status).toBe(404);
  });
});

describe('Gift status transitions via contributions', () => {
  let guestToken, giftId;

  beforeEach(async () => {
    const gRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'guest@example.com', password: 'StrongPass123!', role: 'GUEST' });
    guestToken = gRes.body.accessToken;
    await prisma.user.update({ where: { email: 'guest@example.com' }, data: { isVerified: true } });

    const gifRes = await request(app)
      .post('/api/gifts')
      .set('Authorization', `Bearer ${coupleToken}`)
      .send({ weddingProfileId: weddingId, name: 'Kilem', price: 10000, isPoolGift: true, targetAmount: 10000 });
    giftId = gifRes.body.id;
  });

  it('transitions gift to PARTIALLY_FUNDED after partial contribution', async () => {
    await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ giftItemId: giftId, amountOriginal: 5000, currency: 'KZT', idempotencyKey: 'partial-1' });

    const gift = await prisma.giftItem.findUnique({ where: { id: giftId } });
    expect(gift.status).toBe('PARTIALLY_FUNDED');
    expect(gift.currentAmount).toBe(5000);
  });

  it('transitions gift to FUNDED when fully contributed', async () => {
    await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ giftItemId: giftId, amountOriginal: 10000, currency: 'KZT', idempotencyKey: 'full-1' });

    const gift = await prisma.giftItem.findUnique({ where: { id: giftId } });
    expect(gift.status).toBe('FUNDED');
    expect(gift.currentAmount).toBe(10000);
  });

  it('rejects contribution to already FUNDED gift', async () => {
    await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ giftItemId: giftId, amountOriginal: 10000, currency: 'KZT', idempotencyKey: 'full-2' });

    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ giftItemId: giftId, amountOriginal: 1000, currency: 'KZT', idempotencyKey: 'extra-1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already fully funded/i);
  });

  it('rejects contribution to a non-pool gift', async () => {
    const normalGift = await request(app)
      .post('/api/gifts')
      .set('Authorization', `Bearer ${coupleToken}`)
      .send({ weddingProfileId: weddingId, name: 'Vase', price: 5000 });

    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ giftItemId: normalGift.body.id, amountOriginal: 1000, currency: 'KZT', idempotencyKey: 'nonpool-1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not accept contributions/i);
  });

  it('applies USD exchange rate correctly', async () => {
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ giftItemId: giftId, amountOriginal: 10, currency: 'USD', idempotencyKey: 'usd-1' });
    expect(res.status).toBe(201);
    expect(res.body.amountKzt).toBe(4500);
  });
});

describe('Gift retrieval and update', () => {
  let giftId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/gifts')
      .set('Authorization', `Bearer ${coupleToken}`)
      .send({ weddingProfileId: weddingId, name: 'Lamp', price: 8000 });
    giftId = res.body.id;
  });

  it('fetches a gift by id', async () => {
    const res = await request(app)
      .get(`/api/gifts/${giftId}`)
      .set('Authorization', `Bearer ${coupleToken}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Lamp');
  });

  it('returns 404 for unknown gift id', async () => {
    const res = await request(app)
      .get('/api/gifts/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${coupleToken}`);
    expect(res.status).toBe(404);
  });

  it('lists gifts for a wedding', async () => {
    const res = await request(app)
      .get(`/api/gifts?weddingProfileId=${weddingId}`)
      .set('Authorization', `Bearer ${coupleToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('nextCursor');
  });
});