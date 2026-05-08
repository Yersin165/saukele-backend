const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const emailQueue = new Queue('emails', { connection });
const giftQueue = new Queue('gifts', { connection });

module.exports = { emailQueue, giftQueue, connection };