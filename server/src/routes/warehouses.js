const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/warehouses — список складов
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM warehouses ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /warehouses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/warehouses/:id — склад + остатки на нём
router.get('/:id', async (req, res) => {
  try {
    const wh = await pool.query('SELECT * FROM warehouses WHERE id = $1', [req.params.id]);
    if (wh.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const stock = await pool.query(
      `SELECT s.product_id, p.sku, p.name, s.quantity
       FROM stock s
       JOIN products p ON p.id = s.product_id
       WHERE s.warehouse_id = $1
       ORDER BY p.name`,
      [req.params.id]
    );

    res.json({ warehouse: wh.rows[0], stock: stock.rows });
  } catch (err) {
    console.error('GET /warehouses/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/warehouses — создать склад
router.post('/', async (req, res) => {
  const { name, location } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const result = await pool.query(
      `INSERT INTO warehouses (name, location) VALUES ($1, $2) RETURNING *`,
      [name, location || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Warehouse with this name already exists' });
    }
    console.error('POST /warehouses error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
