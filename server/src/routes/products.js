const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET /api/products — список всех товаров
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id — один товар
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /products/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — создать товар
router.post("/", async (req, res) => {
  const { sku, barcode, name, weight_kg } = req.body;
  if (!sku || !name)
    return res.status(400).json({ error: "sku and name required" });
  try {
    const result = await pool.query(
      `INSERT INTO products (sku, barcode, name, weight_kg)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sku, barcode || null, name, weight_kg || null],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "SKU or barcode already exists" });
    }
    console.error("POST /products error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
