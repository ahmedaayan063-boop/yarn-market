const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'ABC XYZ Yarn Market API' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  loadRoutes();
});

async function loadRoutes() {
  try {
    const { execSync } = require('child_process');

    console.log('Running prisma generate...');
    execSync('npx prisma generate', { stdio: 'inherit', env: { ...process.env } });

    console.log('Running prisma migrate deploy...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit', env: { ...process.env } });

    const partyRoutes       = require('./routes/party.routes');
    const itemRoutes        = require('./routes/item.routes');
    const contractRoutes    = require('./routes/contract.routes');
    const transactionRoutes = require('./routes/transaction.routes');

    app.use('/api/parties',      partyRoutes);
    app.use('/api/items',        itemRoutes);
    app.use('/api/contracts',    contractRoutes);
    app.use('/api/transactions', transactionRoutes);

    app.use((req, res) => res.status(404).json({ error: 'Not found' }));

    console.log('All routes loaded successfully');
  } catch (err) {
    console.error('Route load error:', err.message);
  }
}
