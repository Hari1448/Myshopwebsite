const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'sunmadhi_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export async function login(email, password) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    auth: false
  });
  setToken(result.token);
  return result.admin;
}
export function logout() {
  setToken(null);
}
export async function request(path, options = {}) {
  const { auth = true, headers = {}, ...rest } = options;
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    }
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && auth) setToken(null);
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}
export const api = {
  health: () => request('/health', { auth: false }),
  paymentConfig: () => request('/payments/config'),
  createPaymentOrder: (data) => request('/payments/orders', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (data) => request('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
  dashboard: () => request('/dashboard'),
  products: (q = '') => request(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  nextProductCode: () => request('/products/next-code'),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStock: (id, delta) => request(`/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ delta }) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  categories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  sales: (limit = 100) => request(`/sales?limit=${limit}`),
  createSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
  saleItems: (id) => request(`/sales/${id}/items`),
  credits: () => request('/credits'),
  createCredit: (data) => request('/credits', { method: 'POST', body: JSON.stringify(data) }),
  recordCreditPayment: (id, data) => request(`/credits/${id}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  watercanCustomers: () => request('/watercan'),
  createWatercanCustomer: (data) => request('/watercan', { method: 'POST', body: JSON.stringify(data) }),
  markWatercanPaid: (id) => request(`/watercan/${id}/paid`, { method: 'PATCH' }),
  recordWatercanDelivery: (id, cans = 1) => request(`/watercan/${id}/deliveries`, { method: 'POST', body: JSON.stringify({ cans }) })
};
