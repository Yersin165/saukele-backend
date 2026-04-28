const prisma = require('../config/database');

const approveVendor = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const updated = await prisma.vendor.update({ where: { id: req.params.id }, data: { status: 'APPROVED' } });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const suspendVendor = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const updated = await prisma.vendor.update({ where: { id: req.params.id }, data: { status: 'SUSPENDED' } });
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
      where,
      take: parseInt(limit) + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    let nextCursor = null;
    if (users.length > parseInt(limit)) {
      nextCursor = users[parseInt(limit)].id;
      users.pop();
    }

    res.status(200).json({ data: users, nextCursor });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const banUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User banned' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { approveVendor, suspendVendor, listUsers, banUser };