const prisma = require('../config/database');
const { emailQueue } = require('../jobs/queue');

const EXCHANGE_RATES = { KZT: 1, USD: 450 };

const create = async (guestId, data) => {
  const { giftItemId, amountOriginal, currency, idempotencyKey } = data;

  const gift = await prisma.giftItem.findUnique({
    where: { id: giftItemId },
    include: { weddingProfile: { include: { couple: { select: { email: true } } } } }
  });
  if (!gift) throw { status: 404, message: 'Gift not found' };
  if (!gift.isPoolGift) throw { status: 400, message: 'This gift does not accept contributions' };
  if (gift.status === 'FUNDED') throw { status: 400, message: 'This gift is already fully funded' };

  const exchangeRate = EXCHANGE_RATES[currency] || 1;
  const amountKzt = amountOriginal * exchangeRate;
  const remaining = gift.targetAmount - gift.currentAmount;
  if (amountKzt > remaining) throw { status: 400, message: 'Contribution exceeds remaining pool amount' };

  if (idempotencyKey) {
    const existing = await prisma.transaction.findUnique({ where: { idempotencyKey } });
    if (existing) throw { status: 409, message: 'Duplicate idempotency key' };
  }

  const contribution = await prisma.poolContribution.create({
    data: { giftItemId, guestId, amountOriginal, currency, amountKzt, exchangeRate, lockedAt: new Date(), status: 'PENDING' }
  });

  if (idempotencyKey) {
    await prisma.transaction.create({
      data: { contributionId: contribution.id, type: 'CONTRIBUTION', status: 'PENDING', amountKzt, idempotencyKey }
    });
  }

  const newAmount = gift.currentAmount + amountKzt;
  const isFunded = newAmount >= gift.targetAmount;
  const newStatus = isFunded ? 'FUNDED' : 'PARTIALLY_FUNDED';

  await prisma.giftItem.update({ where: { id: giftItemId }, data: { currentAmount: newAmount, status: newStatus } });

  const coupleEmail = gift.weddingProfile?.couple?.email;
  if (coupleEmail) {
    await emailQueue.add('contribution-confirmed', {
      type: 'CONTRIBUTION_CONFIRMED',
      payload: { email: coupleEmail, giftName: gift.name, amountKzt }
    });
    if (isFunded) {
      await emailQueue.add('gift-funded', {
        type: 'GIFT_FUNDED',
        payload: { email: coupleEmail, giftName: gift.name }
      });
    }
  }

  return contribution;
};

const list = async ({ giftItemId, status, cursor, limit = 20 }) => {
  const where = { giftItemId };
  if (status) where.status = status;
  const items = await prisma.poolContribution.findMany({
    where, take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' }
  });
  let nextCursor = null;
  if (items.length > limit) { nextCursor = items[limit].id; items.pop(); }
  return { data: items, nextCursor };
};

const getById = async (id) => {
  const contribution = await prisma.poolContribution.findUnique({ where: { id } });
  if (!contribution) throw { status: 404, message: 'Contribution not found' };
  return contribution;
};

const updateStatus = async (id, status) => {
  const contribution = await prisma.poolContribution.findUnique({ where: { id } });
  if (!contribution) throw { status: 404, message: 'Contribution not found' };
  return await prisma.poolContribution.update({ where: { id }, data: { status } });
};

module.exports = { create, list, getById, updateStatus };