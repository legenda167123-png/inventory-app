const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  getProducts: () => request('/products'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  getWarehouses: () => request('/warehouses'),
  getWarehouse: (id) => request(`/warehouses/${id}`),
  createWarehouse: (data) => request('/warehouses', { method: 'POST', body: JSON.stringify(data) }),
  updateWarehouse: (id, data) => request(`/warehouses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteWarehouse: (id) => request(`/warehouses/${id}`, { method: 'DELETE' }),

  getOperations: () => request('/operations'),
  createOperation: (data) => request('/operations', { method: 'POST', body: JSON.stringify(data) }),
  updateOperationStatus: (id, status) => request(`/operations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  importProducts: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/import/products', { method: 'POST', body: fd });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
