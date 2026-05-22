const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const emailQueue = new Queue('emails', { connection });
const giftQueue = new Queue('gifts', { connection });

async function closeQueues() {
  await Promise.all([emailQueue.close(), giftQueue.close()]);
  await connection.quit();
}

module.exports = { emailQueue, giftQueue, connection, closeQueues };