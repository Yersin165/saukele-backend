require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { swaggerUi, swaggerDocument } = require('./config/swagger');

const authRoutes = require('./routes/auth.routes');
const weddingRoutes = require('./routes/wedding.routes');
const giftRoutes = require('./routes/gift.routes');
const contributionRoutes = require('./routes/contribution.routes');
const familyMemberRoutes = require('./routes/familyMember.routes');
const vendorRoutes = require('./routes/vendor.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/auth', authRoutes);
app.use('/api/weddings', weddingRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/family-members', familyMemberRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;