const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');

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
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'StrongPass123!', role: 'COUPLE' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('should not register duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'StrongPass123!', role: 'COUPLE' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'StrongPass123!', role: 'COUPLE' });
    expect(res.status).toBe(409);
  });

  it('should login successfully', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'StrongPass123!', role: 'COUPLE' });
    await prisma.user.update({ where: { email: 'test@example.com' }, data: { isVerified: true } });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'StrongPass123!' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('should reject protected route without token', async () => {
    const res = await request(app).get('/api/weddings/some-id');
    expect(res.status).toBe(401);
  });

  it('should reject wrong role', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'guest@example.com', password: 'StrongPass123!', role: 'GUEST' });
    const token = registerRes.body.accessToken;
    const res = await request(app)
      .post('/api/weddings')
      .set('Authorization', `Bearer ${token}`)
      .send({ brideName: 'A', groomName: 'B', weddingDate: '2025-06-15', location: 'Almaty', weddingType: 'CITY' });
    expect(res.status).toBe(403);
  });
});