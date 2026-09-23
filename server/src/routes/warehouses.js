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
  const { name, location, contact_person, phone, working_hours, attributes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const result = await pool.query(
      `INSERT INTO warehouses (name, location, contact_person, phone, working_hours, attributes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, location || null, contact_person || null, phone || null,
       working_hours || null, attributes || {}]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Склад с таким названием уже существует' });
    }
    console.error('POST /warehouses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/warehouses/:id — обновить склад
router.patch('/:id', async (req, res) => {
  const { name, location, contact_person, phone, working_hours, attributes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const result = await pool.query(
      `UPDATE warehouses
       SET name = $1, location = $2, contact_person = $3, phone = $4,
           working_hours = $5, attributes = $6
       WHERE id = $7
       RETURNING *`,
      [name, location || null, contact_person || null, phone || null,
       working_hours || null, attributes || {}, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Склад с таким названием уже существует' });
    }
    console.error('PATCH /warehouses/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/warehouses/:id — удалить склад (если нет остатков и операций)
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const stock = await client.query(
      'SELECT 1 FROM stock WHERE warehouse_id = $1 AND quantity > 0 LIMIT 1',
      [req.params.id]
    );
    if (stock.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'На складе есть остатки — удаление невозможно' });
    }

    const ops = await client.query(
      'SELECT 1 FROM operations WHERE source_warehouse_id = $1 OR destination_warehouse_id = $1 LIMIT 1',
      [req.params.id]
    );
    if (ops.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'По складу есть операции — удаление невозможно' });
    }

    const result = await client.query('DELETE FROM warehouses WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }

    await client.query('COMMIT');
    res.json({ id: result.rows[0].id, deleted: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DELETE /warehouses/:id error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
