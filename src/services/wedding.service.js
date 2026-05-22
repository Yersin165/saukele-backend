const prisma = require('../config/database');

const parseDateTime = (value) => {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw { status: 400, message: 'Invalid weddingDate' };
    return value;
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw { status: 400, message: 'Invalid weddingDate' };
    return date;
  }
  throw { status: 400, message: 'Invalid weddingDate' };
};

const normalizeWeddingData = (data) => {
  if (!data || typeof data !== 'object') return data;
  return {
    ...data,
    weddingDate: data.weddingDate !== undefined ? parseDateTime(data.weddingDate) : undefined
  };
};

const create = async (coupleId, data) => {
  const existing = await prisma.weddingProfile.findUnique({ where: { coupleId } });
  if (existing) throw { status: 409, message: 'Wedding profile already exists' };

  const wedding = await prisma.weddingProfile.create({
    data: { coupleId, ...normalizeWeddingData(data) }
  });
  return wedding;
};

const getById = async (id) => {
  const wedding = await prisma.weddingProfile.findUnique({ where: { id } });
  if (!wedding) throw { status: 404, message: 'Wedding profile not found' };
  return wedding;
};

const update = async (id, data) => {
  const wedding = await prisma.weddingProfile.findUnique({ where: { id } });
  if (!wedding) throw { status: 404, message: 'Wedding profile not found' };
  return await prisma.weddingProfile.update({ where: { id }, data: normalizeWeddingData(data) });
};

const deactivate = async (id) => {
  const wedding = await prisma.weddingProfile.findUnique({ where: { id } });
  if (!wedding) throw { status: 404, message: 'Wedding profile not found' };
  return await prisma.weddingProfile.update({ where: { id }, data: { isActive: false } });
};

const getByInviteCode = async (inviteCode) => {
  const wedding = await prisma.weddingProfile.findUnique({ where: { inviteCode } });
  if (!wedding) throw { status: 404, message: 'Invalid invite code' };
  return wedding;
};

module.exports = { create, getById, update, deactivate, getByInviteCode };