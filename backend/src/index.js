const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(morgan('dev'));

const allowedOrigins = [
  'http://localhost:3000',
  'https://yarn-market-frontend-production-5c09.up.railway.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true); // allow all for now
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// Health check — no database needed
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, time: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'ABC XYZ Yarn Market API is running' });
});

// Lazy load routes after DB is ready
async function startServer() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Test DB connection
    await prisma.$connect();
    console.log('Database connected successfully');

    // Run migrations
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('Migrations applied');
    } catch (e) {
      console.log('Migration note:', e.message);
    }

    await prisma.$disconnect();

    // Load routes
    const partyRoutes       = require('./routes/party.routes');
    const itemRoutes        = require('./routes/item.routes');
    const contractRoutes    = require('./routes/contract.routes');
    const transactionRoutes = require('./routes/transaction.routes');

    app.use('/api/parties',      partyRoutes);
    app.use('/api/items',        itemRoutes);
    app.use('/api/contracts',    contractRoutes);
    app.use('/api/transactions', transactionRoutes);

    app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Internal server error' });
    });

  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.log('Starting without database routes...');

    app.use('/api', (req, res) => {
      res.status(503).json({ error: 'Database not available', details: err.message });
    });
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
