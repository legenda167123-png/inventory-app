import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';

export default function WarehouseDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getWarehouse(id)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="error">Ошибка: {error}</div>;
  if (!data) return <p>Загрузка…</p>;

  const { warehouse, stock } = data;

  return (
    <>
      <p><Link to="/warehouses">← К списку складов</Link></p>
      <h1>{warehouse.name}</h1>
      <p style={{ color: '#666' }}>{warehouse.location || 'Адрес не указан'}</p>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>Остатки</h2>
      {stock.length === 0 ? (
        <p>На этом складе пока нет остатков.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Артикул</th>
              <th>Название</th>
              <th>Количество</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((s) => (
              <tr key={s.product_id}>
                <td>{s.sku}</td>
                <td>{s.name}</td>
                <td>{s.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
