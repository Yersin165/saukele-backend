const { closeQueues } = require('../src/jobs/queue');

afterAll(async () => {
    try {
        await closeQueues();
    } catch (error) {
        console.warn('[Tests] Failed to close queues:', error);
    }
});
