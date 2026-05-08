const prisma = require('../config/database');

const TIER_MAP = {
  CITY: { ATA_ANA: 'TIER_1', AGA_INI: 'TIER_2', ZHIEN: 'TIER_3', QUDA: 'TIER_2', OTHER: 'TIER_3' },
  VILLAGE: { ATA_ANA: 'TIER_1', AGA_INI: 'TIER_2', ZHIEN: 'TIER_3', QUDA: 'TIER_2', OTHER: 'TIER_4' }
};

const create = async (data) => {
  const { weddingProfileId, guestId, kinshipType, parentId } = data;

  const wedding = await prisma.weddingProfile.findUnique({ where: { id: weddingProfileId } });
  if (!wedding) throw { status: 404, message: 'Wedding profile not found' };

  const existing = await prisma.familyMember.findUnique({
    where: { weddingProfileId_guestId: { weddingProfileId, guestId } }
  });
  if (existing) throw { status: 409, message: 'Guest already in family list' };

  const giftTier = TIER_MAP[wedding.weddingType][kinshipType] || 'TIER_5';

  return await prisma.familyMember.create({
    data: { weddingProfileId, guestId, kinshipType, giftTier, parentId }
  });
};

const list = async ({ weddingProfileId, cursor, limit = 20 }) => {
  const items = await prisma.familyMember.findMany({
    where: { weddingProfileId },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
    include: { guest: { select: { email: true } } }
  });

  let nextCursor = null;
  if (items.length > limit) {
    nextCursor = items[limit].id;
    items.pop();
  }

  return { data: items, nextCursor };
};

const getTree = async (weddingProfileId) => {
  const allMembers = await prisma.familyMember.findMany({
    where: { weddingProfileId },
    include: { guest: { select: { email: true } } },
    orderBy: { createdAt: 'asc' }
  });

  const buildNode = (member, depth) => ({
    ...member,
    depth,
    children: allMembers
      .filter(m => m.parentId === member.id)
      .map(child => buildNode(child, depth + 1))
  });

  return allMembers
    .filter(m => m.parentId === null)
    .map(root => buildNode(root, 0));
};

const update = async (id, data) => {
  const member = await prisma.familyMember.findUnique({ where: { id } });
  if (!member) throw { status: 404, message: 'Family member not found' };
  return await prisma.familyMember.update({ where: { id }, data });
};

const remove = async (id) => {
  const member = await prisma.familyMember.findUnique({ where: { id } });
  if (!member) throw { status: 404, message: 'Family member not found' };
  await prisma.familyMember.delete({ where: { id } });
};

module.exports = { create, list, getTree, update, remove };