import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, LayoutGrid, List, ImageOff } from 'lucide-react';
import Modal from '../../components/Modal/Modal.jsx';
import ConfirmDialog from '../../components/Modal/ConfirmDialog.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { PageLoader } from '../../components/Loader/Loader.jsx';
import { useToast } from '../../hooks/useToast.jsx';
import { productAPI, categoryAPI } from '../../services/api.js';
import { formatCurrency } from '../../utils/helpers.js';
import './Menu.css';

const EMPTY_FORM = { name: '', categoryId: '', price: '', gstPercent: 5, description: '', available: true, image: '' };
const PER_PAGE = 8;

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [view, setView] = useState('card');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    try {
      const [prodData, catData] = await Promise.all([productAPI.getAll(), categoryAPI.getAll()]);
      setProducts(prodData);
      setCategories(catData);
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() =>
    products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || p.categoryId === parseInt(categoryFilter);
      return matchSearch && matchCat;
    }),
    [products, search, categoryFilter]
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setFormErrors({}); setModalOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, categoryId: String(item.categoryId), price: String(item.price), gstPercent: item.gstPercent, description: item.description, available: item.available, image: item.image || '' });
    setFormErrors({});
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditItem(null); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.categoryId) e.categoryId = 'Category is required';
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = 'Valid price is required';
    setFormErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editItem) {
        await productAPI.update(editItem.id, form);
        toast.success('Product updated successfully');
      } else {
        await productAPI.create(form);
        toast.success('Product added successfully');
      }
      await loadData();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await productAPI.delete(deleteId);
      toast.success('Product deleted');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleteId(null);
    }
  };

  const toggleAvailability = async (product) => {
    try {
      await productAPI.updateStatus(product.id, !product.available);
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, available: !p.available } : p));
    } catch {
      toast.error('Failed to update availability');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Menu Management</h1>
          <p>{products.length} total products</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Product</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search products..." />
            <select className="form-control form-select" style={{ width: 200 }} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`btn btn-icon ${view === 'card' ? 'btn-primary' : ''}`} onClick={() => setView('card')} style={{ border: '1.5px solid var(--border)' }}><LayoutGrid size={15} /></button>
            <button className={`btn btn-icon ${view === 'table' ? 'btn-primary' : ''}`} onClick={() => setView('table')} style={{ border: '1.5px solid var(--border)' }}><List size={15} /></button>
          </div>
        </div>

        {paginated.length === 0 ? (
          <EmptyState title="No products found" description={search ? `No results for "${search}"` : 'Add your first product.'} action={<button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Product</button>} />
        ) : view === 'card' ? (
          <div className="product-grid">
            {paginated.map((p) => (
              <div key={p.id} className={`product-card${!p.available ? ' unavailable' : ''}`}>
                <div className="product-image">
                  {p.image ? <img src={p.image} alt={p.name} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} /> : null}
                  <div className="product-image-placeholder" style={{ display: p.image ? 'none' : 'flex' }}>
                    <ImageOff size={24} />
                  </div>
                  <span className={`product-avail-badge badge ${p.available ? 'badge-success' : 'badge-error'}`}>
                    {p.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="product-card-body">
                  <div className="product-meta">
                    <span className="badge badge-neutral">{p.category}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>GST {p.gstPercent}%</span>
                  </div>
                  <h4 className="product-name">{p.name}</h4>
                  <p className="product-desc">{p.description}</p>
                  <div className="product-footer">
                    <span className="product-price">{formatCurrency(p.price)}</span>
                    <div className="table-actions">
                      <button className="btn btn-icon btn-sm btn-icon-primary" onClick={() => openEdit(p)}><Pencil size={13} /></button>
                      <button className="btn btn-icon btn-sm btn-icon-danger" onClick={() => setDeleteId(p.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr><th>Product</th><th>Category</th><th>Price</th><th>GST</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {paginated.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'var(--border-light)', flexShrink: 0 }}>
                          {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageOff size={14} style={{ color: 'var(--text-muted)' }} /></div>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.description?.slice(0, 40)}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-neutral">{p.category}</span></td>
                    <td><strong>{formatCurrency(p.price)}</strong></td>
                    <td>{p.gstPercent}%</td>
                    <td>
                      <button className={`badge ${p.available ? 'badge-success' : 'badge-error'}`} onClick={() => toggleAvailability(p)} style={{ cursor: 'pointer', border: 'none' }}>
                        {p.available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-icon btn-sm btn-icon-primary" onClick={() => openEdit(p)}><Pencil size={13} /></button>
                        <button className="btn btn-icon btn-sm btn-icon-danger" onClick={() => setDeleteId(p.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {paginated.length > 0 && (
          <div style={{ padding: '0 24px 16px' }}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editItem ? 'Edit Product' : 'Add Product'} size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update' : 'Add Product'}</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group form-full">
            <label className="form-label">Product Name <span>*</span></label>
            <input className={`form-control${formErrors.name ? ' error' : ''}`} placeholder="e.g., Cappuccino" value={form.name} onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setFormErrors((p) => ({ ...p, name: '' })); }} />
            {formErrors.name && <p className="form-error">{formErrors.name}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Category <span>*</span></label>
            <select className={`form-control form-select${formErrors.categoryId ? ' error' : ''}`} value={form.categoryId} onChange={(e) => { setForm((p) => ({ ...p, categoryId: e.target.value })); setFormErrors((p) => ({ ...p, categoryId: '' })); }}>
              <option value="">Select Category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {formErrors.categoryId && <p className="form-error">{formErrors.categoryId}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Price (₹) <span>*</span></label>
            <input type="number" className={`form-control${formErrors.price ? ' error' : ''}`} placeholder="0.00" value={form.price} onChange={(e) => { setForm((p) => ({ ...p, price: e.target.value })); setFormErrors((p) => ({ ...p, price: '' })); }} />
            {formErrors.price && <p className="form-error">{formErrors.price}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">GST %</label>
            <select className="form-control form-select" value={form.gstPercent} onChange={(e) => setForm((p) => ({ ...p, gstPercent: Number(e.target.value) }))}>
              <option value={0}>0%</option>
              <option value={5}>5%</option>
              <option value={12}>12%</option>
              <option value={18}>18%</option>
            </select>
          </div>
          <div className="form-group form-full">
            <label className="form-label">Image URL</label>
            <input className="form-control" placeholder="https://..." value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Description</label>
            <textarea className="form-control form-textarea" placeholder="Brief product description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="form-group form-full">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.available} onChange={(e) => setForm((p) => ({ ...p, available: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }} />
              <span className="form-label" style={{ marginBottom: 0 }}>Available for ordering</span>
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Product" message="Are you sure you want to delete this product?" confirmLabel="Delete" variant="danger" />
    </div>
  );
}
