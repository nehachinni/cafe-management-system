export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);

export const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
};

export const getInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export const calcGST = (price, gstPercent) =>
  parseFloat(((price * gstPercent) / 100).toFixed(2));

export const calcTotal = (items) =>
  items.reduce((sum, item) => {
    const base = item.price * item.quantity;
    const gst = (base * (item.gstPercent || 0)) / 100;
    return sum + base + gst;
  }, 0);

export const generateBillNumber = () => {
  const ts = Date.now().toString().slice(-6);
  return `BILL-${ts}`;
};

export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

/** Converts an array of flat objects into a downloaded CSV file. */
export const exportToCSV = (filename, rows) => {
  if (!rows || rows.length === 0) return false;
  const headers = Object.keys(rows[0]);
  const escapeCell = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
