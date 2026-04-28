const prisma = require('../config/database');

const create = async (userId, data) => {
  const existing = await prisma.vendor.findUnique({ where: { userId } });
  if (existing) throw { status: 409, message: 'Vendor profile already exists' };
  return await prisma.vendor.create({ data: { userId, ...data } });
};

const list = async ({ cursor, limit = 20 }) => {
  const items = await prisma.vendor.findMany({
    where: { status: 'APPROVED' },
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
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw { status: 404, message: 'Vendor not found' };
  return vendor;
};

const update = async (id, data) => {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw { status: 404, message: 'Vendor not found' };
  return await prisma.vendor.update({ where: { id }, data });
};

const remove = async (id) => {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw { status: 404, message: 'Vendor not found' };
  await prisma.vendor.delete({ where: { id } });
};

module.exports = { create, list, getById, update, remove };