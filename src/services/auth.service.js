const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/database');
const { emailQueue } = require('../jobs/queue');

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
};

const register = async ({ email, password, role }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw { status: 409, message: 'Email already exists' };

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: { email, passwordHash, role, verificationToken, verificationTokenExpiresAt }
  });

  await emailQueue.add('send-verification', {
    type: 'VERIFICATION',
    payload: { email, token: verificationToken }
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return {
    user: { id: user.id, email: user.email, role: user.role, isVerified: user.isVerified },
    accessToken,
    refreshToken,
    message: 'Registration successful. Please check your email to verify your account.'
  };
};

const verifyEmail = async (token) => {
  const user = await prisma.user.findUnique({ where: { verificationToken: token } });
  if (!user) throw { status: 400, message: 'Invalid verification token' };
  if (user.verificationTokenExpiresAt < new Date()) throw { status: 400, message: 'Verification token has expired' };
  if (user.isVerified) throw { status: 400, message: 'Email already verified' };

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verificationToken: null, verificationTokenExpiresAt: null }
  });

  return { message: 'Email verified successfully' };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { status: 401, message: 'Invalid credentials' };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw { status: 401, message: 'Invalid credentials' };

  if (!user.isVerified) throw { status: 403, message: 'Please verify your email before logging in' };
  if (user.isBanned) throw { status: 403, message: 'Your account has been suspended' };

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken };
};

const refresh = async (token) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw { status: 401, message: 'Invalid or expired refresh token' };
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw { status: 401, message: 'User not found' };
  if (user.isBanned) throw { status: 403, message: 'Your account has been suspended' };

  const accessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user.id);

  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (token) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (stored && !stored.revokedAt) {
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  }
  return { message: 'Logged out successfully' };
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { message: 'If that email exists, a reset link has been sent' };

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpiresAt } });

  await emailQueue.add('send-password-reset', {
    type: 'PASSWORD_RESET',
    payload: { email, token: resetToken }
  });

  return { message: 'If that email exists, a reset link has been sent' };
};

const resetPassword = async (token, newPassword) => {
  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user) throw { status: 400, message: 'Invalid reset token' };
  if (user.resetTokenExpiresAt < new Date()) throw { status: 400, message: 'Reset token has expired' };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiresAt: null }
  });

  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() }
  });

  return { message: 'Password reset successfully. Please log in again.' };
};

module.exports = { register, verifyEmail, login, refresh, logout, forgotPassword, resetPassword };