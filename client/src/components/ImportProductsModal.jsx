import { useState } from 'react';
import { api } from '../api.js';
import Modal from './Modal.jsx';

export default function ImportProductsModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleImport() {
    if (!file) return;
    setSending(true);
    setError(null);
    try {
      const r = await api.importProducts(file);
      setResult(r);
      if (onDone) onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal title="Импорт номенклатуры из Excel" onClose={onClose}>
      {!result && (
        <>
          <p style={{ color: '#666', fontSize: 14 }}>
            Ожидаемые колонки: <b>sku</b>, <b>barcode</b>, <b>name</b>, <b>weight_kg</b> (или русские: Артикул, Штрихкод, Название, Вес).
            Первая строка — заголовки. Существующие SKU обновляются, новые создаются.
          </p>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ marginBottom: 16 }}
          />

          {error && <div className="error" style={{ marginBottom: 12 }}>Ошибка: {error}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose}>Отмена</button>
            <button onClick={handleImport} disabled={!file || sending}>
              {sending ? 'Загрузка…' : 'Импортировать'}
            </button>
          </div>
        </>
      )}

      {result && (
        <>
          <p>
            <b>Добавлено:</b> {result.added}<br />
            <b>Обновлено:</b> {result.updated}<br />
            <b>Ошибок:</b> {result.errors.length}
          </p>

          {result.errors.length > 0 && (
            <div style={{ maxHeight: 200, overflow: 'auto', marginTop: 12 }}>
              <table>
                <thead>
                  <tr><th>Строка</th><th>Причина</th></tr>
                </thead>
                <tbody>
                  {result.errors.map((e, i) => (
                    <tr key={i}><td>{e.row}</td><td>{e.reason}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={onClose}>Закрыть</button>
          </div>
        </>
      )}
    </Modal>
  );
}
