const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

// Health check — always works
app.get('/', (req, res) => res.json({ message: 'ABC XYZ Yarn Market API' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  initDB();
});

async function initDB() {
  try {
    console.log('Connecting to database...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('Migrations done');

    const partyRoutes       = require('./routes/party.routes');
    const itemRoutes        = require('./routes/item.routes');
    const contractRoutes    = require('./routes/contract.routes');
    const transactionRoutes = require('./routes/transaction.routes');

    app.use('/api/parties',      partyRoutes);
    app.use('/api/items',        itemRoutes);
    app.use('/api/contracts',    contractRoutes);
    app.use('/api/transactions', transactionRoutes);

    app.use((req, res) => res.status(404).json({ error: 'Not found' }));
    app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

    console.log('All routes loaded. App ready.');
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}
