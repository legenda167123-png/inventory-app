const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../db');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/import/products
router.post('/products', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });

  let rows;
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  } catch (err) {
    return res.status(400).json({ error: 'Cannot parse xlsx: ' + err.message });
  }

  if (rows.length === 0) return res.status(400).json({ error: 'empty file' });

  const result = { added: 0, updated: 0, errors: [] };
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2;

      const sku     = String(r.sku     ?? r.SKU     ?? r['Артикул'] ?? '').trim();
      const barcode = String(r.barcode ?? r.Barcode ?? r['Штрихкод'] ?? '').trim() || null;
      const name    = String(r.name    ?? r.Name    ?? r['Название'] ?? '').trim();
      const weight  = Number(r.weight_kg ?? r.weight ?? r['Вес'] ?? 0) || null;

      if (!sku || !name) {
        result.errors.push({ row: rowNum, reason: 'Пустой артикул или название' });
        continue;
      }

      const existing = await client.query('SELECT id FROM products WHERE sku = $1', [sku]);

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE products SET barcode = $1, name = $2, weight_kg = $3 WHERE id = $4`,
          [barcode, name, weight, existing.rows[0].id]
        );
        result.updated++;
      } else {
        try {
          await client.query(
            `INSERT INTO products (sku, barcode, name, weight_kg) VALUES ($1, $2, $3, $4)`,
            [sku, barcode, name, weight]
          );
          result.added++;
        } catch (err) {
          if (err.code === '23505') {
            result.errors.push({ row: rowNum, reason: 'Дубликат штрихкода' });
          } else {
            throw err;
          }
        }
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import error:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }

  res.json(result);
});

module.exports = router;
