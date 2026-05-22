const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');

let coupleToken, guestToken;

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

  const cRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'couple@example.com', password: 'StrongPass123!', role: 'COUPLE' });
  coupleToken = cRes.body.accessToken;
  await prisma.user.update({ where: { email: 'couple@example.com' }, data: { isVerified: true } });

  const gRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'guest@example.com', password: 'StrongPass123!', role: 'GUEST' });
  guestToken = gRes.body.accessToken;
  await prisma.user.update({ where: { email: 'guest@example.com' }, data: { isVerified: true } });
});

afterAll(async () => { await prisma.$disconnect(); });

describe('Wedding profile creation', () => {
  it('COUPLE can create a wedding profile', async () => {
    const res = await request(app)
      .post('/api/weddings')
      .set('Authorization', `Bearer ${coupleToken}`)
      .send({ brideName: 'Aisha', groomName: 'Daniyar', weddingDate: '2026-09-01T00:00:00.000Z', location: 'Almaty', weddingType: 'CITY' });
    expect(res.status).toBe(201);
    expect(res.body.brideName).toBe('Aisha');
    expect(res.body).toHaveProperty('inviteCode');
    expect(res.body.isActive).toBe(true);
  });

  it('accepts date-only weddingDate string values', async () => {
    const res = await request(app)
      .post('/api/weddings')
      .set('Authorization', `Bearer ${coupleToken}`)
      .send({ brideName: 'Alua', groomName: 'Zhangir', weddingDate: '2027-02-02', location: 'Almaty', weddingType: 'CITY' });
    expect(res.status).toBe(201);
    expect(new Date(res.body.weddingDate).toISOString().startsWith('2027-02-02')).toBe(true);
  });

  it('GUEST cannot create a wedding profile', async () => {
    const res = await request(app)
      .post('/api/weddings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ brideName: 'Aisha', groomName: 'Daniyar', weddingDate: '2026-09-01T00:00:00.000Z', location: 'Almaty' });
    expect(res.status).toBe(403);
  });

  it('COUPLE cannot create a second wedding profile', async () => {
    await request(app)
      .post('/api/weddings')
      .set('Authorization', `Bearer ${coupleToken}`)
      .send({ brideName: 'Aisha', groomName: 'Daniyar', weddingDate: '2026-09-01T00:00:00.000Z', location: 'Almaty' });

    const res = await request(app)
      .post('/api/weddings')
      .set('Authorization', `Bearer ${coupleToken}`)
      .send({ brideName: 'Aisha', groomName: 'Daniyar', weddingDate: '2026-09-01T00:00:00.000Z', location: 'Almaty' });
    expect(res.status).toBe(409);
  });
});

describe('Wedding profile retrieval', () => {
  let weddingId, inviteCode;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/weddings')
      .set('Authorization', `Bearer ${coupleToken}`)
      .send({ brideName: 'Aisha', groomName: 'Daniyar', weddingDate: '2026-09-01T00:00:00.000Z', location: 'Almaty', weddingType: 'VILLAGE' });
    weddingId = res.body.id;
    inviteCode = res.body.inviteCode;
  });

  it('fetches a wedding by id', async () => {
    const res = await request(app)
      .get(`/api/weddings/${weddingId}`)
      .set('Authorization', `Bearer ${coupleToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(weddingId);
    expect(res.body.weddingType).toBe('VILLAGE');
  });

  it('returns 404 for unknown wedding id', async () => {
    const res = await request(app)
      .get('/api/weddings/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${coupleToken}`);
    expect(res.status).toBe(404);
  });

  it('looks up wedding by invite code', async () => {
    const res = await request(app)
      .get(`/api/weddings/invite/${inviteCode}`)
      .set('Authorization', `Bearer ${guestToken}`);
    expect(res.status).toBe(200);
    expect(res.body.inviteCode).toBe(inviteCode);
  });

  it('returns 404 for invalid invite code', async () => {
    const res = await request(app)
      .get('/api/weddings/invite/bad-code-that-does-not-exist')
      .set('Authorization', `Bearer ${guestToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Wedding profile update', () => {
  let weddingId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/weddings')
      .set('Authorization', `Bearer ${coupleToken}`)
      .send({ brideName: 'Aisha', groomName: 'Daniyar', weddingDate: '2026-09-01T00:00:00.000Z', location: 'Almaty' });
    weddingId = res.body.id;
  });

  it('COUPLE can update their wedding profile', async () => {
    const res = await request(app)
      .patch(`/api/weddings/${weddingId}`)
      .set('Authorization', `Bearer ${coupleToken}`)
      .send({ location: 'Astana' });
    expect(res.status).toBe(200);
    expect(res.body.location).toBe('Astana');
  });

  it('COUPLE can deactivate their wedding', async () => {
    const res = await request(app)
      .patch(`/api/weddings/${weddingId}/deactivate`)
      .set('Authorization', `Bearer ${coupleToken}`);
    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });
});