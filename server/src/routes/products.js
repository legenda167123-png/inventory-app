const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/products — список всех товаров
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id — товар + остатки по всем складам
router.get('/:id', async (req, res) => {
  try {
    const p = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (p.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const stock = await pool.query(
      `SELECT s.warehouse_id, w.name AS warehouse_name, w.location AS warehouse_location, s.quantity
       FROM stock s
       JOIN warehouses w ON w.id = s.warehouse_id
       WHERE s.product_id = $1
       ORDER BY w.name`,
      [req.params.id]
    );

    res.json({ product: p.rows[0], stock: stock.rows });
  } catch (err) {
    console.error('GET /products/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — создать товар
router.post('/', async (req, res) => {
  const { sku, barcode, name, width_mm, height_mm, depth_mm, volume_m3, weight_kg, attributes } = req.body;
  if (!sku || !name) return res.status(400).json({ error: 'sku and name required' });
  try {
    const result = await pool.query(
      `INSERT INTO products (sku, barcode, name, width_mm, height_mm, depth_mm, volume_m3, weight_kg, attributes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [sku, barcode || null, name,
       width_mm ?? null, height_mm ?? null, depth_mm ?? null,
       volume_m3 ?? null, weight_kg ?? null, attributes || {}]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Товар с таким артикулом или штрихкодом уже существует' });
    }
    console.error('POST /products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/products/:id — обновить товар
router.patch('/:id', async (req, res) => {
  const { sku, barcode, name, width_mm, height_mm, depth_mm, volume_m3, weight_kg, attributes } = req.body;
  if (!sku || !name) return res.status(400).json({ error: 'sku and name required' });
  try {
    const result = await pool.query(
      `UPDATE products
       SET sku = $1, barcode = $2, name = $3,
           width_mm = $4, height_mm = $5, depth_mm = $6,
           volume_m3 = $7, weight_kg = $8, attributes = $9
       WHERE id = $10
       RETURNING *`,
      [sku, barcode || null, name,
       width_mm ?? null, height_mm ?? null, depth_mm ?? null,
       volume_m3 ?? null, weight_kg ?? null, attributes || {}, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Товар с таким артикулом или штрихкодом уже существует' });
    }
    console.error('PATCH /products/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id — удалить товар (если нет остатков и операций)
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const stock = await client.query(
      'SELECT 1 FROM stock WHERE product_id = $1 AND quantity > 0 LIMIT 1',
      [req.params.id]
    );
    if (stock.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'По товару есть остатки — удаление невозможно' });
    }

    const ops = await client.query(
      'SELECT 1 FROM operation_items WHERE product_id = $1 LIMIT 1',
      [req.params.id]
    );
    if (ops.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'По товару есть операции — удаление невозможно' });
    }

    const result = await client.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }

    await client.query('COMMIT');
    res.json({ id: result.rows[0].id, deleted: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DELETE /products/:id error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
