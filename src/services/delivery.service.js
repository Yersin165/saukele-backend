const prisma = require('../config/database');

const create = async (data) => {
  const order = await prisma.order.findUnique({ where: { id: data.orderId } });
  if (!order) throw { status: 404, message: 'Order not found' };

  const existing = await prisma.delivery.findUnique({ where: { orderId: data.orderId } });
  if (existing) throw { status: 409, message: 'Delivery already exists for this order' };

  return await prisma.delivery.create({
    data: {
      orderId: data.orderId,
      giftItemId: order.giftItemId,
      courierId: data.courierId,
      isFragile: data.isFragile || false,
      destinationLat: data.destinationLat,
      destinationLng: data.destinationLng
    }
  });
};

const getById = async (id) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: { order: true, giftItem: true, courier: { select: { id: true, email: true } } }
  });
  if (!delivery) throw { status: 404, message: 'Delivery not found' };
  return delivery;
};

const list = async ({ courierId, status, cursor, limit = 20 }) => {
  const where = {};
  if (courierId) where.courierId = courierId;
  if (status) where.status = status;

  const items = await prisma.delivery.findMany({
    where,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
    include: { order: true, giftItem: true, courier: { select: { id: true, email: true } } }
  });

  let nextCursor = null;
  if (items.length > limit) { nextCursor = items[limit].id; items.pop(); }

  return { data: items, nextCursor };
};

const updateStatus = async (id, status) => {
  const delivery = await prisma.delivery.findUnique({ where: { id } });
  if (!delivery) throw { status: 404, message: 'Delivery not found' };

  const updated = await prisma.delivery.update({
    where: { id },
    data: {
      status,
      ...(status === 'DELIVERED' && { autoCompletedAt: new Date() })
    }
  });

  return updated;
};

const remove = async (id) => {
  const delivery = await prisma.delivery.findUnique({ where: { id } });
  if (!delivery) throw { status: 404, message: 'Delivery not found' };
  await prisma.delivery.delete({ where: { id } });
};

module.exports = { create, getById, list, updateStatus, remove };