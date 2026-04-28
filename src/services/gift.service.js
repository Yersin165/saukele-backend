const prisma = require('../config/database');

const create = async (data) => {
  const wedding = await prisma.weddingProfile.findUnique({ where: { id: data.weddingProfileId } });
  if (!wedding) throw { status: 404, message: 'Wedding profile not found' };
  return await prisma.giftItem.create({ data });
};

const list = async ({ weddingProfileId, status, cursor, limit = 20 }) => {
  const where = { weddingProfileId };
  if (status) where.status = status;

  const items = await prisma.giftItem.findMany({
    where,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' }
  });

  let nextCursor = null;
  if (items.length > limit) {
    nextCursor = items[limit].id;
    items.pop();
  }

  return { data: items, nextCursor };
};

const getById = async (id) => {
  const gift = await prisma.giftItem.findUnique({ where: { id } });
  if (!gift) throw { status: 404, message: 'Gift not found' };
  return gift;
};

const update = async (id, data) => {
  const gift = await prisma.giftItem.findUnique({ where: { id } });
  if (!gift) throw { status: 404, message: 'Gift not found' };
  return await prisma.giftItem.update({ where: { id }, data });
};

const remove = async (id) => {
  const gift = await prisma.giftItem.findUnique({ where: { id } });
  if (!gift) throw { status: 404, message: 'Gift not found' };
  await prisma.giftItem.delete({ where: { id } });
};

module.exports = { create, list, getById, update, remove };