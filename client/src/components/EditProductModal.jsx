import { useState } from 'react';
import { api } from '../api.js';
import Modal from './Modal.jsx';
import AttributesEditor from './AttributesEditor.jsx';

export default function EditProductModal({ product, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    sku: product.sku || '',
    barcode: product.barcode || '',
    name: product.name || '',
    width_mm: product.width_mm ?? '',
    height_mm: product.height_mm ?? '',
    depth_mm: product.depth_mm ?? '',
    volume_m3: product.volume_m3 ?? '',
    weight_kg: product.weight_kg ?? '',
    attributes: product.attributes || {},
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  function set(patch) {
    setForm({ ...form, ...patch });
  }

  function numOrNull(v) {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.updateProduct(product.id, {
        sku: form.sku,
        barcode: form.barcode || null,
        name: form.name,
        width_mm: numOrNull(form.width_mm),
        height_mm: numOrNull(form.height_mm),
        depth_mm: numOrNull(form.depth_mm),
        volume_m3: numOrNull(form.volume_m3),
        weight_kg: numOrNull(form.weight_kg),
        attributes: form.attributes,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Удалить товар «${product.name}»? Это действие необратимо.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await api.deleteProduct(product.id);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <Modal title="Редактировать товар" onClose={onClose}>
      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <label>Артикул *<br />
            <input type="text" value={form.sku} required
              onChange={(e) => set({ sku: e.target.value })}
              style={{ width: '100%', padding: 8 }} />
          </label>
          <label>Штрихкод<br />
            <input type="text" value={form.barcode}
              onChange={(e) => set({ barcode: e.target.value })}
              style={{ width: '100%', padding: 8 }} />
          </label>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Название *<br />
            <input type="text" value={form.name} required
              onChange={(e) => set({ name: e.target.value })}
              style={{ width: '100%', padding: 8 }} />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          <label>Ширина, мм<br />
            <input type="number" step="0.01" value={form.width_mm}
              onChange={(e) => set({ width_mm: e.target.value })}
              style={{ width: '100%', padding: 8 }} />
          </label>
          <label>Высота, мм<br />
            <input type="number" step="0.01" value={form.height_mm}
              onChange={(e) => set({ height_mm: e.target.value })}
              style={{ width: '100%', padding: 8 }} />
          </label>
          <label>Глубина, мм<br />
            <input type="number" step="0.01" value={form.depth_mm}
              onChange={(e) => set({ depth_mm: e.target.value })}
              style={{ width: '100%', padding: 8 }} />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <label>Объём, м³<br />
            <input type="number" step="0.000001" value={form.volume_m3}
              onChange={(e) => set({ volume_m3: e.target.value })}
              style={{ width: '100%', padding: 8 }} />
          </label>
          <label>Вес, кг<br />
            <input type="number" step="0.001" value={form.weight_kg}
              onChange={(e) => set({ weight_kg: e.target.value })}
              style={{ width: '100%', padding: 8 }} />
          </label>
        </div>

        <div style={{ marginBottom: 14 }}>
          <AttributesEditor
            value={form.attributes}
            onChange={(attributes) => set({ attributes })}
          />
        </div>

        {error && <div className="error" style={{ marginBottom: 12 }}>Ошибка: {error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" onClick={handleDelete} disabled={deleting}
            style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 4, cursor: 'pointer' }}>
            {deleting ? 'Удаление…' : 'Удалить'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
