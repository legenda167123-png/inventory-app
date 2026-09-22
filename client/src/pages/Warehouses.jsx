import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Modal from '../components/Modal.jsx';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', location: '' });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.getWarehouses()
      .then(setWarehouses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createWarehouse(form);
      setShowModal(false);
      setForm({ name: '', location: '' });
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
        <h1>Склады</h1>
        <button onClick={() => setShowModal(true)}>+ Добавить склад</button>
      </div>

      {loading && <p>Загрузка…</p>}
      {error && <div className="error">Ошибка: {error}</div>}

      {!loading && !error && (
        <>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Адрес</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id}>
                  <td>{w.id}</td>
                  <td>{w.name}</td>
                  <td>{w.location || '—'}</td>
                  <td><Link to={`/warehouses/${w.id}`}>Открыть</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {warehouses.length === 0 && <p>Складов пока нет.</p>}
        </>
      )}

      {showModal && (
        <Modal title="Новый склад" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label>Название *<br />
                <input type="text" value={form.name} required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: 8 }} />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Адрес<br />
                <input type="text" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
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
    </>
  );
}
