const prisma = require('../config/database');

const create = async (data) => {
  const gift = await prisma.giftItem.findUnique({ where: { id: data.giftItemId } });
  if (!gift) throw { status: 404, message: 'Gift not found' };
  if (gift.isPoolGift) throw { status: 400, message: 'Pool gifts cannot be ordered directly' };
  if (gift.status === 'PURCHASED') throw { status: 400, message: 'Gift already purchased' };

  const order = await prisma.order.create({
    data: {
      giftItemId: data.giftItemId,
      vendorId: gift.vendorId,
      totalAmount: gift.price,
      notes: data.notes
    }
  });

  await prisma.giftItem.update({ where: { id: data.giftItemId }, data: { status: 'PURCHASED' } });

  return order;
};

const getById = async (id) => {
  const order = await prisma.order.findUnique({ where: { id }, include: { giftItem: true, vendor: true } });
  if (!order) throw { status: 404, message: 'Order not found' };
  return order;
};

const list = async ({ vendorId, status, cursor, limit = 20 }) => {
  const where = {};
  if (vendorId) where.vendorId = vendorId;
  if (status) where.status = status;

  const items = await prisma.order.findMany({
    where,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
    include: { giftItem: true, vendor: true }
  });

  let nextCursor = null;
  if (items.length > limit) { nextCursor = items[limit].id; items.pop(); }

  return { data: items, nextCursor };
};

const updateStatus = async (id, status) => {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw { status: 404, message: 'Order not found' };
  return await prisma.order.update({ where: { id }, data: { status } });
};

const remove = async (id) => {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw { status: 404, message: 'Order not found' };
  
  // Reset gift status back to AVAILABLE when order is deleted
  await prisma.giftItem.update({
    where: { id: order.giftItemId },
    data: { status: 'AVAILABLE' }
  });

  await prisma.order.delete({ where: { id } });
};

module.exports = { create, getById, list, updateStatus, remove };