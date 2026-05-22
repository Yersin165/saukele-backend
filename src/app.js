require('dotenv').config();

if (process.env.NODE_ENV !== 'test') {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'REDIS_URL', 'RESEND_API_KEY', 'APP_URL'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) { console.error(`[FATAL] Missing env vars: ${missing.join(', ')}`); process.exit(1); }
}

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const weddingRoutes = require('./routes/wedding.routes');
const giftRoutes = require('./routes/gift.routes');
const contributionRoutes = require('./routes/contribution.routes');
const familyMemberRoutes = require('./routes/familyMember.routes');
const vendorRoutes = require('./routes/vendor.routes');
const adminRoutes = require('./routes/admin.routes');
const orderRoutes = require('./routes/order.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const errorHandler = require('./middleware/error.middleware');
const { swaggerUi, swaggerDocument } = require('./config/swagger');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/auth', authRoutes);
app.use('/api/weddings', weddingRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/family-members', familyMemberRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use(errorHandler);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((req, res) => res.status(404).json({ error: { message: 'Route not found', status: 404 } }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: { message: err.message || 'Internal server error', status: err.status || 500 } });
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    try {
      const { startCronJobs } = require('./jobs/cron');
      await startCronJobs();
    } catch (e) {
      console.warn('[Cron] Could not start:', e.message);
    }
  });
}

module.exports = app;