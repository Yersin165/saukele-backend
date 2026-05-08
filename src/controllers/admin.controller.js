const prisma = require('../config/database');
const { emailQueue } = require('../jobs/queue');

const approveVendor = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id }, include: { user: { select: { email: true } } } });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    if (vendor.status === 'APPROVED') return res.status(409).json({ message: 'Vendor already approved' });
    const updated = await prisma.vendor.update({ where: { id: req.params.id }, data: { status: 'APPROVED' } });
    await emailQueue.add('vendor-approved', { type: 'VENDOR_STATUS', payload: { email: vendor.user.email, shopName: vendor.shopName, status: 'APPROVED' } });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const suspendVendor = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id }, include: { user: { select: { email: true } } } });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const updated = await prisma.vendor.update({ where: { id: req.params.id }, data: { status: 'SUSPENDED' } });
    await emailQueue.add('vendor-suspended', { type: 'VENDOR_STATUS', payload: { email: vendor.user.email, shopName: vendor.shopName, status: 'SUSPENDED' } });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const listUsers = async (req, res) => {
  try {
    const { role, cursor, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;
    const users = await prisma.user.findMany({
      where, take: parseInt(limit) + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, role: true, isVerified: true, isBanned: true, createdAt: true }
    });
    let nextCursor = null;
    if (users.length > parseInt(limit)) { nextCursor = users[parseInt(limit)].id; users.pop(); }
    res.status(200).json({ data: users, nextCursor });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const banUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'ADMIN') return res.status(403).json({ message: 'Cannot ban an admin' });
    await prisma.user.update({ where: { id: req.params.id }, data: { isBanned: true } });
    await prisma.refreshToken.updateMany({ where: { userId: req.params.id, revokedAt: null }, data: { revokedAt: new Date() } });
    res.status(200).json({ message: 'User banned' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const unbanUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    await prisma.user.update({ where: { id: req.params.id }, data: { isBanned: false } });
    res.status(200).json({ message: 'User unbanned' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getQueueStats = async (req, res) => {
  try {
    const { emailQueue, giftQueue } = require('../jobs/queue');
    const [ew, ea, ef, gw, ga, gf] = await Promise.all([
      emailQueue.getWaitingCount(), emailQueue.getActiveCount(), emailQueue.getFailedCount(),
      giftQueue.getWaitingCount(), giftQueue.getActiveCount(), giftQueue.getFailedCount()
    ]);
    res.status(200).json({
      emailQueue: { waiting: ew, active: ea, failed: ef },
      giftQueue: { waiting: gw, active: ga, failed: gf }
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { approveVendor, suspendVendor, listUsers, banUser, unbanUser, getQueueStats };