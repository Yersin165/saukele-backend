const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');

let adminToken, vendorToken, vendorProfileId;

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

  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin@example.com', password: 'StrongPass123!', role: 'ADMIN' });
  adminToken = adminRes.body.accessToken;
  await prisma.user.update({ where: { email: 'admin@example.com' }, data: { isVerified: true } });

  const vRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'vendor@example.com', password: 'StrongPass123!', role: 'VENDOR' });
  vendorToken = vRes.body.accessToken;
  await prisma.user.update({ where: { email: 'vendor@example.com' }, data: { isVerified: true } });
});

afterAll(async () => { await prisma.$disconnect(); });

describe('Vendor registration', () => {
  it('creates a vendor profile', async () => {
    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ shopName: 'Dala Gifts', phone: '+77001234567', description: 'Handmade gifts' });
    expect(res.status).toBe(201);
    expect(res.body.shopName).toBe('Dala Gifts');
    expect(res.body.status).toBe('PENDING');
    vendorProfileId = res.body.id;
  });

  it('rejects duplicate vendor profile for same user', async () => {
    await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ shopName: 'Dala Gifts', phone: '+77001234567' });

    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ shopName: 'Dala Gifts 2', phone: '+77001234567' });
    expect(res.status).toBe(409);
  });
});

describe('Admin vendor approval flow', () => {
  beforeEach(async () => {
    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ shopName: 'Dala Gifts', phone: '+77001234567' });
    vendorProfileId = res.body.id;
  });

  it('admin can approve a pending vendor', async () => {
    const res = await request(app)
      .patch(`/api/admin/vendors/${vendorProfileId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
  });

  it('admin can suspend an approved vendor', async () => {
    await request(app)
      .patch(`/api/admin/vendors/${vendorProfileId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .patch(`/api/admin/vendors/${vendorProfileId}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SUSPENDED');
  });

  it('returns 409 when approving an already-approved vendor', async () => {
    await request(app)
      .patch(`/api/admin/vendors/${vendorProfileId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .patch(`/api/admin/vendors/${vendorProfileId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
  });

  it('non-admin cannot approve vendors', async () => {
    const res = await request(app)
      .patch(`/api/admin/vendors/${vendorProfileId}/approve`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Admin user management', () => {
  it('admin can ban a user', async () => {
    const user = await prisma.user.findUnique({ where: { email: 'vendor@example.com' } });
    const res = await request(app)
      .patch(`/api/admin/users/${user.id}/ban`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated.isBanned).toBe(true);
  });

  it('banned user cannot access protected routes', async () => {
    const user = await prisma.user.findUnique({ where: { email: 'vendor@example.com' } });
    await request(app)
      .patch(`/api/admin/users/${user.id}/ban`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .get('/api/vendors')
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(403);
  });

  it('admin cannot ban another admin', async () => {
    const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
    const res = await request(app)
      .patch(`/api/admin/users/${admin.id}/ban`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('admin can unban a user', async () => {
    const user = await prisma.user.findUnique({ where: { email: 'vendor@example.com' } });
    await request(app).patch(`/api/admin/users/${user.id}/ban`).set('Authorization', `Bearer ${adminToken}`);
    const res = await request(app)
      .patch(`/api/admin/users/${user.id}/unban`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated.isBanned).toBe(false);
  });
});