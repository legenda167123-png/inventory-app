import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Modal from '../components/Modal.jsx';

const titles = {
  receipt: 'Поступления',
  transfer: 'Перемещения',
  sale: 'Реализация',
  writeoff: 'Списание',
};

const STATUS_CHAIN = ['created', 'assembling', 'in_transit', 'arrived', 'unloaded'];

const STATUS_LABELS = {
  created: 'Создано',
  assembling: 'В сборке',
  in_transit: 'В пути',
  arrived: 'Приехало',
  unloaded: 'Разгружено',
  completed: 'Проведено',
  draft: 'Черновик',
  in_progress: 'В работе',
  accepted: 'Принято',
  cancelled: 'Отменено',
};

export default function Operations({ type }) {
  const [operations, setOperations] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    source_warehouse_id: '',
    destination_warehouse_id: '',
    comment: '',
    items: [{ product_id: '', quantity: '' }],
  });

  function load() {
    setLoading(true);
    Promise.all([api.getOperations(), api.getProducts(), api.getWarehouses()])
      .then(([ops, prods, whs]) => {
        setOperations(ops);
        setProducts(prods);
        setWarehouses(whs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = operations.filter((o) => o.type === type);

  function updateItem(i, patch) {
    const items = form.items.slice();
    items[i] = { ...items[i], ...patch };
    setForm({ ...form, items });
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, { product_id: '', quantity: '' }] });
  }

  function removeItem(i) {
    setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const grouped = {};
    for (const i of form.items) {
      if (!i.product_id || !i.quantity) continue;
      const pid = Number(i.product_id);
      grouped[pid] = (grouped[pid] || 0) + Number(i.quantity);
    }
    const items = Object.entries(grouped).map(([product_id, quantity]) => ({
      product_id: Number(product_id),
      quantity,
    }));

    if (items.length === 0) {
      alert('Добавьте хотя бы одну позицию с товаром и количеством');
      return;
    }

    setSaving(true);
    try {
      await api.createOperation({
        type,
        source_warehouse_id: form.source_warehouse_id ? Number(form.source_warehouse_id) : null,
        destination_warehouse_id: form.destination_warehouse_id ? Number(form.destination_warehouse_id) : null,
        comment: form.comment,
        items,
      });
      setShowModal(false);
      setForm({
        source_warehouse_id: '',
        destination_warehouse_id: '',
        comment: '',
        items: [{ product_id: '', quantity: '' }],
      });
      load();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function advanceStatus(op) {
    const idx = STATUS_CHAIN.indexOf(op.status);
    if (idx === -1 || idx === STATUS_CHAIN.length - 1) return;
    const next = STATUS_CHAIN[idx + 1];
    try {
      await api.updateOperationStatus(op.id, next);
      load();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  }

  if (loading) return <p>Загрузка…</p>;
  if (error) return <div className="error">Ошибка: {error}</div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{titles[type]}</h1>
        <button onClick={() => setShowModal(true)}>+ Создать</button>
      </div>

      {filtered.length === 0 ? (
        <p>Операций пока нет.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Дата</th>
              <th>Откуда</th>
              <th>Куда</th>
              <th>Позиции</th>
              <th>Статус</th>
              <th>Автор</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const isTransfer = o.type === 'transfer';
              const idx = STATUS_CHAIN.indexOf(o.status);
              const canAdvance = isTransfer && idx >= 0 && idx < STATUS_CHAIN.length - 1;
              return (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{new Date(o.created_at).toLocaleString('ru-RU')}</td>
                  <td>{o.source_name || '—'}</td>
                  <td>{o.destination_name || '—'}</td>
                  <td>{o.items.map((it) => `${it.sku} × ${it.quantity}`).join(', ')}</td>
                  <td>{STATUS_LABELS[o.status] || o.status}</td>
                  <td>{o.created_by}</td>
                  <td>
                    {canAdvance && (
                      <button onClick={() => advanceStatus(o)}>
                        → {STATUS_LABELS[STATUS_CHAIN[idx + 1]]}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showModal && (
        <Modal title={`Новая операция: ${titles[type]}`} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            {(type === 'transfer' || type === 'sale' || type === 'writeoff') && (
              <div style={{ marginBottom: 12 }}>
                <label>Склад-источник *<br />
                  <select
                    value={form.source_warehouse_id}
                    onChange={(e) => setForm({ ...form, source_warehouse_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: 8 }}
                  >
                    <option value="">— выберите —</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {(type === 'receipt' || type === 'transfer') && (
              <div style={{ marginBottom: 12 }}>
                <label>Склад-приёмник *<br />
                  <select
                    value={form.destination_warehouse_id}
                    onChange={(e) => setForm({ ...form, destination_warehouse_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: 8 }}
                  >
                    <option value="">— выберите —</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label>Комментарий<br />
                <input
                  type="text"
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  style={{ width: '100%', padding: 8 }}
                />
              </label>
            </div>

            <div style={{ marginBottom: 8 }}>
              <strong>Позиции</strong>
            </div>

            {form.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select
                  value={it.product_id}
                  onChange={(e) => updateItem(i, { product_id: e.target.value })}
                  required
                  style={{ flex: 1, padding: 8 }}
                >
                  <option value="">— товар —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.001"
                  placeholder="Кол-во"
                  value={it.quantity}
                  onChange={(e) => updateItem(i, { quantity: e.target.value })}
                  required
                  style={{ width: 100, padding: 8 }}
                />
                {form.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)}>×</button>
                )}
              </div>
            ))}

            <button type="button" onClick={addItem} style={{ marginBottom: 16 }}>
              + Добавить позицию
            </button>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)}>Отмена</button>
              <button type="submit" disabled={saving}>
                {saving ? 'Проведение…' : 'Провести'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
