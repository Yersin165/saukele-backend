const { giftQueue } = require('./queue');

const startCronJobs = async () => {
  await giftQueue.add(
    'expire-deadlines',
    { type: 'EXPIRE_DEADLINES' },
    { repeat: { pattern: '0 * * * *' }, removeOnComplete: 10, removeOnFail: 20 }
  );
  console.log('[Cron] Gift deadline expiry scheduled — every hour');
};

module.exports = { startCronJobs };