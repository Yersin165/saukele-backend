const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');

let coupleToken, guestToken, weddingId, giftId;

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
  await prisma.user.deleteMany();

  const coupleRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'couple@example.com', password: 'StrongPass123!', role: 'COUPLE' });
  coupleToken = coupleRes.body.accessToken;

  const guestRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'guest@example.com', password: 'StrongPass123!', role: 'GUEST' });
  guestToken = guestRes.body.accessToken;

  const weddingRes = await request(app)
    .post('/api/weddings')
    .set('Authorization', `Bearer ${coupleToken}`)
    .send({
      brideName: 'Aisha',
      groomName: 'Daniyar',
      weddingDate: '2025-06-15T00:00:00.000Z',
      location: 'Almaty',
      weddingType: 'CITY'
    });
  weddingId = weddingRes.body.id;

  const giftRes = await request(app)
    .post('/api/gifts')
    .set('Authorization', `Bearer ${coupleToken}`)
    .send({
      weddingProfileId: weddingId,
      name: 'Kilem',
      price: 150000,
      isPoolGift: true,
      targetAmount: 150000
    });
  giftId = giftRes.body.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Contributions', () => {
  it('should make a contribution to a pool gift', async () => {
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ giftItemId: giftId, amountOriginal: 5000, currency: 'KZT', idempotencyKey: 'key-1' });
    expect(res.status).toBe(201);
    expect(res.body.amountKzt).toBe(5000);
    expect(res.body.status).toBe('PENDING');
  });

  it('should reject contribution exceeding pool amount', async () => {
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ giftItemId: giftId, amountOriginal: 999999, currency: 'KZT', idempotencyKey: 'key-2' });
    expect(res.status).toBe(400);
  });

  it('should reject duplicate idempotency key', async () => {
    await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ giftItemId: giftId, amountOriginal: 5000, currency: 'KZT', idempotencyKey: 'key-3' });
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ giftItemId: giftId, amountOriginal: 5000, currency: 'KZT', idempotencyKey: 'key-3' });
    expect(res.status).toBe(409);
  });
});