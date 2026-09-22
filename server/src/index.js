const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productsRouter = require('./routes/products');
const warehousesRouter = require('./routes/warehouses');
const operationsRouter = require('./routes/operations');
const importRouter = require('./routes/import');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/products', productsRouter);
app.use('/api/warehouses', warehousesRouter);
app.use('/api/operations', operationsRouter);
app.use('/api/import', importRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
