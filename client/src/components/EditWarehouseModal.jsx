import { useState } from 'react';
import { api } from '../api.js';
import Modal from './Modal.jsx';
import AttributesEditor from './AttributesEditor.jsx';

export default function EditWarehouseModal({ warehouse, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    name: warehouse.name || '',
    location: warehouse.location || '',
    contact_person: warehouse.contact_person || '',
    phone: warehouse.phone || '',
    working_hours: warehouse.working_hours || '',
    attributes: warehouse.attributes || {},
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  function set(patch) {
    setForm({ ...form, ...patch });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.updateWarehouse(warehouse.id, form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Удалить склад «${warehouse.name}»? Это действие необратимо.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await api.deleteWarehouse(warehouse.id);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <Modal title="Редактировать склад" onClose={onClose}>
      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 10 }}>
          <label>Название *<br />
            <input type="text" value={form.name} required
              onChange={(e) => set({ name: e.target.value })}
              style={{ width: '100%', padding: 8 }} />
          </label>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Адрес<br />
            <input type="text" value={form.location}
              onChange={(e) => set({ location: e.target.value })}
              style={{ width: '100%', padding: 8 }} />
          </label>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Контактное лицо<br />
            <input type="text" value={form.contact_person}
              onChange={(e) => set({ contact_person: e.target.value })}
              style={{ width: '100%', padding: 8 }} />
          </label>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Телефон<br />
            <input type="text" value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
              style={{ width: '100%', padding: 8 }} />
          </label>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label>Часы работы<br />
            <input type="text" value={form.working_hours}
              placeholder="Например: Пн-Пт 9:00-18:00"
              onChange={(e) => set({ working_hours: e.target.value })}
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
