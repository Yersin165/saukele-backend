require('dotenv').config();
const { Worker } = require('bullmq');
const { connection } = require('./queue');
const emailService = require('../services/email.service');
const prisma = require('../config/database');

const emailWorker = new Worker('emails', async (job) => {
  const { type, payload } = job.data;
  switch (type) {
    case 'VERIFICATION':
      await emailService.sendVerificationEmail(payload.email, payload.token);
      break;
    case 'PASSWORD_RESET':
      await emailService.sendPasswordResetEmail(payload.email, payload.token);
      break;
    case 'CONTRIBUTION_CONFIRMED':
      await emailService.sendContributionConfirmedEmail(payload.email, payload.giftName, payload.amountKzt);
      break;
    case 'GIFT_FUNDED':
      await emailService.sendGiftFundedEmail(payload.email, payload.giftName);
      break;
    case 'VENDOR_STATUS':
      await emailService.sendVendorStatusEmail(payload.email, payload.shopName, payload.status);
      break;
    case 'REGISTRY_INVITATION':
      await emailService.sendRegistryInvitationEmail(
        payload.email,
        payload.brideName,
        payload.groomName,
        payload.inviteCode,
        payload.appUrl
      );
      break;
    case 'DELIVERY_CONFIRMED':
      await emailService.sendDeliveryConfirmedEmail(payload.email, payload.giftName);
      break;
    default:
      throw new Error(`Unknown email job type: ${type}`);
  }
  console.log(`[EmailWorker] Processed job ${job.id} — type: ${type}`);
}, { connection, attempts: 3, backoff: { type: 'exponential', delay: 5000 } });

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job.id} failed:`, err.message);
});

const giftWorker = new Worker('gifts', async (job) => {
  if (job.data.type === 'EXPIRE_DEADLINES') {
    const expired = await prisma.giftItem.updateMany({
      where: { deadlineAt: { lte: new Date() }, status: { in: ['AVAILABLE', 'PARTIALLY_FUNDED'] } },
      data: { status: 'AVAILABLE' }
    });
    console.log(`[GiftWorker] Processed ${expired.count} expired gift(s)`);
  }
}, { connection });

giftWorker.on('failed', (job, err) => {
  console.error(`[GiftWorker] Job ${job.id} failed:`, err.message);
});

console.log('[Workers] Started');