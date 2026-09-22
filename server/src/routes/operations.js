const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/operations — список операций с позициями
router.get('/', async (req, res) => {
  try {
    const ops = await pool.query(
      `SELECT o.*, sw.name AS source_name, dw.name AS destination_name
       FROM operations o
       LEFT JOIN warehouses sw ON sw.id = o.source_warehouse_id
       LEFT JOIN warehouses dw ON dw.id = o.destination_warehouse_id
       ORDER BY o.created_at DESC`
    );
    if (ops.rows.length === 0) return res.json([]);
    const ids = ops.rows.map((o) => o.id);
    const items = await pool.query(
      `SELECT oi.operation_id, oi.product_id, oi.quantity, p.sku, p.name
       FROM operation_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.operation_id = ANY($1) ORDER BY oi.id`,
      [ids]
    );
    const byOp = {};
    for (const it of items.rows) (byOp[it.operation_id] ||= []).push(it);
    res.json(ops.rows.map((o) => ({ ...o, items: byOp[o.id] || [] })));
  } catch (err) {
    console.error('GET /operations error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/operations — создать операцию
router.post('/', async (req, res) => {
  const { type, source_warehouse_id, destination_warehouse_id,
          created_by = 'operator', comment, items } = req.body;

  if (!['receipt', 'transfer', 'sale', 'writeoff'].includes(type))
    return res.status(400).json({ error: 'invalid type' });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'items required' });
  if (type === 'receipt' && !destination_warehouse_id)
    return res.status(400).json({ error: 'destination_warehouse_id required' });
  if (type === 'transfer' && (!source_warehouse_id || !destination_warehouse_id))
    return res.status(400).json({ error: 'both warehouses required' });
  if ((type === 'sale' || type === 'writeoff') && !source_warehouse_id)
    return res.status(400).json({ error: 'source_warehouse_id required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const initialStatus = type === 'transfer' ? 'created' : 'completed';

    const opRes = await client.query(
      `INSERT INTO operations (type, status, source_warehouse_id, destination_warehouse_id, created_by, comment)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [type, initialStatus, source_warehouse_id || null, destination_warehouse_id || null,
       created_by, comment || null]
    );
    const op = opRes.rows[0];

    for (const it of items) {
      if (!it.product_id || !it.quantity || it.quantity <= 0)
        throw new Error('invalid item');
      await client.query(
        `INSERT INTO operation_items (operation_id, product_id, quantity) VALUES ($1, $2, $3)`,
        [op.id, it.product_id, it.quantity]
      );
    }

    if (type === 'receipt') {
      await applyIncoming(client, destination_warehouse_id, items);
    } else if (type === 'transfer') {
      // Остатки НЕ меняем — ждём статуса unloaded
    } else {
      await applyOutgoing(client, source_warehouse_id, items);
    }

    await client.query('COMMIT');
    res.status(201).json(op);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /operations error:', err);
    const code = err.message.includes('Недостаточно') ? 409 : 500;
    res.status(code).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PATCH /api/operations/:id/status — сменить статус перемещения
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowed = ['created', 'assembling', 'in_transit', 'arrived', 'unloaded'];
  if (!allowed.includes(status))
    return res.status(400).json({ error: 'invalid status' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const opRes = await client.query('SELECT * FROM operations WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (opRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Operation not found' });
    }
    const op = opRes.rows[0];

    if (op.type !== 'transfer') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'status change only for transfer' });
    }

    await client.query('UPDATE operations SET status = $1 WHERE id = $2', [status, op.id]);

    if (status === 'unloaded') {
      const items = await client.query(
        'SELECT product_id, quantity FROM operation_items WHERE operation_id = $1',
        [op.id]
      );
      try {
        await applyOutgoing(client, op.source_warehouse_id, items.rows);
        await applyIncoming(client, op.destination_warehouse_id, items.rows);
      } catch (err) {
        await client.query('ROLLBACK');
        const code = err.message.includes('Недостаточно') ? 409 : 500;
        return res.status(code).json({ error: err.message });
      }
    }

    await client.query('COMMIT');
    res.json({ id: op.id, status });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PATCH /operations/:id/status error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

async function applyIncoming(client, warehouseId, items) {
  for (const it of items) {
    await client.query(
      `INSERT INTO stock (warehouse_id, product_id, quantity, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (warehouse_id, product_id)
       DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity, updated_at = NOW()`,
      [warehouseId, it.product_id, it.quantity]
    );
  }
}

async function applyOutgoing(client, warehouseId, items) {
  for (const it of items) {
    const r = await client.query(
      `UPDATE stock SET quantity = quantity - $3, updated_at = NOW()
       WHERE warehouse_id = $1 AND product_id = $2 AND quantity >= $3 RETURNING quantity`,
      [warehouseId, it.product_id, it.quantity]
    );
    if (r.rowCount === 0) {
      throw new Error(`Недостаточно остатка товара id=${it.product_id} на складе id=${warehouseId}`);
    }
  }
}

module.exports = router;
