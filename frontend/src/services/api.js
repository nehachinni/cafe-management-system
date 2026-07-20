import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cms_token');
      localStorage.removeItem('cms_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/* =====================================================
   MAPPERS
   Backend returns snake_case; pages expect the exact
   camelCase shape that utils/dummy.js used to provide.
   ===================================================== */

const DAY_ABBR = (d = '') => d.slice(0, 3);
const MONTH_ABBR = (m = '') => m.slice(0, 3);

export const mapCategory = (c) => ({
  id: c.id,
  name: c.name,
  description: c.description || '',
  itemCount: c.item_count ?? 0,
  createdAt: c.created_at,
});

export const mapProduct = (p) => ({
  id: p.id,
  name: p.name,
  categoryId: p.category_id,
  category: p.category_name || '',
  price: Number(p.price),
  gstPercent: Number(p.gst_rate),
  description: p.description || '',
  available: p.status === 'available',
  image: p.image_url || '',
});

export const mapTable = (t) => ({
  id: t.id,
  number: t.table_number,
  capacity: t.capacity,
  location: t.location,
  status: t.status,
});

export const mapEmployee = (e) => ({
  id: e.id,
  name: e.full_name,
  email: e.email,
  phone: e.phone || '',
  role: e.role,
  salary: Number(e.salary),
  joiningDate: e.joining_date ? String(e.joining_date).slice(0, 10) : '',
  status: e.status,
});

const ORDER_TYPE_LABEL = { 'dine-in': 'Dine-In', takeaway: 'Takeaway', delivery: 'Delivery' };

export const mapRecentOrder = (o) => ({
  id: o.id,
  billNo: o.invoice_number || o.order_number,
  type: ORDER_TYPE_LABEL[o.order_type] || o.order_type,
  table: o.table_number || '-',
  amount: Number(o.total),
  status: o.status,
  createdAt: o.created_at,
});

export const mapBestSelling = (b) => ({
  name: b.item_name,
  quantity: b.units_sold ?? b.total_quantity ?? 0,
  revenue: Number(b.revenue ?? b.total_revenue ?? 0),
});

export const mapWeeklySales = (row) => ({
  day: DAY_ABBR(row.day),
  sales: Number(row.sales),
  orders: Number(row.orders),
});

export const mapMonthlyRevenue = (row) => ({
  month: MONTH_ABBR(row.month),
  revenue: Number(row.revenue),
});

export const mapDashboardStats = (s) => ({
  todaySales: Number(s.todays_sales),
  monthlySales: Number(s.monthly_sales),
  todayOrders: s.todays_orders,
  totalMenuItems: s.menu_items_count,
  availableTables: s.available_tables,
  occupiedTables: s.occupied_tables,
  reservedTables: s.reserved_tables,
  totalRevenue: Number(s.total_revenue),
});

export const mapBillHistoryRow = (b) => ({
  id: b.invoice_number,
  invoiceId: b.id,
  date: b.created_at ? String(b.created_at).slice(0, 10) : '',
  cashier: b.cashier || '-',
  table: b.table_number || '-',
  items: b.item_count ?? 0,
  subtotal: Number(b.subtotal),
  gst: Number(b.tax),
  discount: Number(b.discount),
  total: Number(b.total),
  paymentMethod: b.payment_method || '-',
  status: b.payment_status,
});

export const mapDailySalesRow = (row) => ({
  day: DAY_ABBR(row.day),
  date: row.date,
  orders: row.orders,
  sales: Number(row.revenue),
  avgOrder: Number(row.avg_order),
});

export const mapMonthlySalesRow = (row) => ({
  month: MONTH_ABBR(row.month),
  orders: row.orders,
  revenue: Number(row.revenue),
});

const SETTINGS_KEY_MAP = {
  cafeName: 'cafe_name',
  address: 'address',
  gstNumber: 'gst_number',
  phone: 'phone',
  email: 'email',
  logo: 'logo_url',
};

export const mapSettingsFromApi = (data) => ({
  cafeName: data.cafe_name || '',
  address: data.address || '',
  gstNumber: data.gst_number || '',
  phone: data.phone || '',
  email: data.email || '',
  logo: data.logo_url || '',
});

export const mapSettingsToApi = (form) => {
  const out = {};
  Object.entries(form).forEach(([key, value]) => {
    const apiKey = SETTINGS_KEY_MAP[key];
    if (apiKey) out[apiKey] = value ?? '';
  });
  return out;
};

/* =====================================================
   API MODULES
   ===================================================== */

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const categoryAPI = {
  getAll: async () => {
    const res = await api.get('/categories');
    return res.data.data.map(mapCategory);
  },
  create: async (data) => {
    const res = await api.post('/categories', { name: data.name, description: data.description });
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/categories/${id}`, { name: data.name, description: data.description });
    return res.data;
  },
  delete: (id) => api.delete(`/categories/${id}`),
};

export const productAPI = {
  getAll: async (params) => {
    const res = await api.get('/menu', { params });
    return res.data.data.map(mapProduct);
  },
  create: async (data) => {
    const res = await api.post('/menu', {
      name: data.name,
      category_id: data.categoryId ? Number(data.categoryId) : null,
      price: Number(data.price),
      gst_rate: Number(data.gstPercent),
      description: data.description,
      image_url: data.image,
      status: data.available ? 'available' : 'unavailable',
    });
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/menu/${id}`, {
      name: data.name,
      category_id: data.categoryId ? Number(data.categoryId) : null,
      price: Number(data.price),
      gst_rate: Number(data.gstPercent),
      description: data.description,
      image_url: data.image,
      status: data.available ? 'available' : 'unavailable',
    });
    return res.data;
  },
  updateStatus: (id, available) => api.put(`/menu/${id}`, { status: available ? 'available' : 'unavailable' }),
  delete: (id) => api.delete(`/menu/${id}`),
};

export const tableAPI = {
  getAll: async () => {
    const res = await api.get('/tables');
    return res.data.data.map(mapTable);
  },
  create: async (data) => {
    const res = await api.post('/tables', {
      table_number: data.number,
      capacity: Number(data.capacity),
      location: data.location,
      status: data.status,
    });
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/tables/${id}`, {
      table_number: data.number,
      capacity: Number(data.capacity),
      location: data.location,
      status: data.status,
    });
    return res.data;
  },
  updateStatus: (id, status) => api.patch(`/tables/${id}/status`, { status }),
  delete: (id) => api.delete(`/tables/${id}`),
};

export const orderAPI = {
  getAll: async (params) => {
    const res = await api.get('/orders', { params });
    return res.data.data.map(mapRecentOrder);
  },
  /**
   * cartData: { tableId, orderType ('dine-in'|'takeaway'), customerName?, discount, items: [{menu_item_id, quantity}] }
   * Returns the raw backend response: { id, order_number, total, ... }
   */
  create: async (cartData) => {
    const res = await api.post('/orders', {
      table_id: cartData.tableId || null,
      order_type: cartData.orderType,
      customer_name: cartData.customerName || '',
      discount: Number(cartData.discount || 0),
      items: cartData.items,
    });
    return res.data;
  },
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

export const billingAPI = {
  /** Generates an invoice for a given backend order id. Returns { id, invoice_number, total }. */
  generate: async (orderId) => {
    const res = await api.post(`/billing/generate/${orderId}`);
    return res.data;
  },
  getById: (id) => api.get(`/billing/${id}`),
};

export const paymentAPI = {
  process: async (data) => {
    const res = await api.post('/payments', {
      invoice_id: data.invoiceId,
      amount: Number(data.amount),
      method: data.method.toLowerCase(),
    });
    return res.data;
  },
};

export const employeeAPI = {
  getAll: async () => {
    const res = await api.get('/employees');
    return res.data.data.map(mapEmployee);
  },
  create: async (data) => {
    const res = await api.post('/employees', {
      full_name: data.name,
      email: data.email,
      password: data.password || undefined,
      phone: data.phone,
      role: data.role,
      salary: Number(data.salary),
      joining_date: data.joiningDate || null,
    });
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/employees/${id}`, {
      full_name: data.name,
      phone: data.phone,
      role: data.role,
      salary: Number(data.salary),
      joining_date: data.joiningDate || null,
      status: data.status,
    });
    return res.data;
  },
  delete: (id) => api.delete(`/employees/${id}`),
};

export const reportAPI = {
  daily: async (params) => {
    const res = await api.get('/reports/sales', { params });
    return res.data.data.map(mapDailySalesRow).reverse();
  },
  monthly: async (params) => {
    const res = await api.get('/reports/monthly-sales', { params });
    return res.data.data.map(mapMonthlySalesRow);
  },
  bestSelling: async (params) => {
    const res = await api.get('/reports/top-items', { params });
    return res.data.data.map(mapBestSelling);
  },
  billHistory: async (params) => {
    const res = await api.get('/reports/bill-history', { params });
    return res.data.data.map(mapBillHistoryRow);
  },
};

export const settingsAPI = {
  get: async () => {
    const res = await api.get('/settings');
    return mapSettingsFromApi(res.data.data);
  },
  update: async (form) => {
    const res = await api.put('/settings', mapSettingsToApi(form));
    return res.data;
  },
};

export const dashboardAPI = {
  stats: async () => {
    const res = await api.get('/dashboard/stats');
    return mapDashboardStats(res.data.data);
  },
  weeklySales: async () => {
    const res = await api.get('/dashboard/weekly-sales');
    return res.data.data.map(mapWeeklySales);
  },
  monthlyRevenue: async () => {
    const res = await api.get('/dashboard/monthly-revenue');
    return res.data.data.map(mapMonthlyRevenue);
  },
  recentOrders: async (limit = 5) => {
    const res = await api.get('/dashboard/recent-orders', { params: { limit } });
    return res.data.data.map(mapRecentOrder);
  },
  bestSelling: async (limit = 5) => {
    const res = await api.get('/dashboard/best-selling', { params: { limit } });
    return res.data.data.map(mapBestSelling);
  },
};

export default api;
