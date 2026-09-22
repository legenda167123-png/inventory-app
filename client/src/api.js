const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  getProducts: () => request('/products'),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),

  getWarehouses: () => request('/warehouses'),
  getWarehouse: (id) => request(`/warehouses/${id}`),
  createWarehouse: (data) => request('/warehouses', { method: 'POST', body: JSON.stringify(data) }),

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
