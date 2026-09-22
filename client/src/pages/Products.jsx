import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Modal from '../components/Modal.jsx';
import ImportProductsModal from '../components/ImportProductsModal.jsx';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({ sku: '', barcode: '', name: '', weight_kg: '' });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.getProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createProduct({
        sku: form.sku,
        barcode: form.barcode || null,
        name: form.name,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      });
      setShowModal(false);
      setForm({ sku: '', barcode: '', name: '', weight_kg: '' });
      load();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Номенклатура</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowImport(true)}>Импорт из Excel</button>
          <button onClick={() => setShowModal(true)}>+ Добавить товар</button>
        </div>
      </div>

      {loading && <p>Загрузка…</p>}
      {error && <div className="error">Ошибка: {error}</div>}

      {!loading && !error && (
        <>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Артикул</th>
                <th>Штрихкод</th>
                <th>Название</th>
                <th>Вес, кг</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.sku}</td>
                  <td>{p.barcode || '—'}</td>
                  <td>{p.name}</td>
                  <td>{p.weight_kg || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <p>Товаров пока нет.</p>}
        </>
      )}

      {showModal && (
        <Modal title="Новый товар" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label>Артикул *<br />
                <input type="text" value={form.sku} required
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  style={{ width: '100%', padding: 8 }} />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Штрихкод<br />
                <input type="text" value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  style={{ width: '100%', padding: 8 }} />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Название *<br />
                <input type="text" value={form.name} required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: 8 }} />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Вес, кг<br />
                <input type="number" step="0.001" value={form.weight_kg}
                  onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                  style={{ width: '100%', padding: 8 }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)}>Отмена</button>
              <button type="submit" disabled={saving}>{saving ? 'Сохранение…' : 'Создать'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showImport && (
        <ImportProductsModal
          onClose={() => setShowImport(false)}
          onDone={load}
        />
      )}
    </>
  );
}
