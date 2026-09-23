import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import EditProductModal from '../components/EditProductModal.jsx';

function fmt(v) {
  if (v === null || v === undefined || v === '') return '—';
  return v;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  function load() {
    api.getProduct(id)
      .then(setData)
      .catch((e) => setError(e.message));
  }

  useEffect(load, [id]);

  if (error) return <div className="error">Ошибка: {error}</div>;
  if (!data) return <p>Загрузка…</p>;

  const { product, stock } = data;
  const attrs = product.attributes || {};
  const attrEntries = Object.entries(attrs);

  return (
    <>
      <p><Link to="/products">← К списку номенклатуры</Link></p>

      <div style={{
        background: 'white', borderRadius: 8, padding: 20, marginBottom: 20,
        boxShadow: '0 1px 2px rgba(0,0,0,.05)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0 }}>{product.name}</h1>
            <p style={{ color: '#555', margin: '6px 0 0' }}>
              Артикул: <b>{product.sku}</b>
              {product.barcode && <> · Штрихкод: {product.barcode}</>}
            </p>
          </div>
          <button onClick={() => setShowEdit(true)}>Редактировать</button>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '180px 1fr', gap: '6px 16px', fontSize: 14 }}>
          <div style={{ color: '#777' }}>Ширина, мм</div><div>{fmt(product.width_mm)}</div>
          <div style={{ color: '#777' }}>Высота, мм</div><div>{fmt(product.height_mm)}</div>
          <div style={{ color: '#777' }}>Глубина, мм</div><div>{fmt(product.depth_mm)}</div>
          <div style={{ color: '#777' }}>Объём, м³</div><div>{fmt(product.volume_m3)}</div>
          <div style={{ color: '#777' }}>Вес, кг</div><div>{fmt(product.weight_kg)}</div>
          {attrEntries.map(([k, v]) => (
            <React.Fragment key={k}>
              <div style={{ color: '#777' }}>{k}</div>
              <div>{v}</div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <h2 style={{ fontSize: 18 }}>Остатки по складам</h2>
      {stock.length === 0 ? (
        <p>Товара нет ни на одном складе.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Склад</th>
              <th>Адрес</th>
              <th>Количество</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stock.map((s) => (
              <tr key={s.warehouse_id}>
                <td>{s.warehouse_name}</td>
                <td>{s.warehouse_location || '—'}</td>
                <td>{s.quantity}</td>
                <td><Link to={`/warehouses/${s.warehouse_id}`}>Открыть склад</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showEdit && (
        <EditProductModal
          product={product}
          onClose={() => setShowEdit(false)}
          onSaved={load}
          onDeleted={() => navigate('/products')}
        />
      )}
    </>
  );
}
