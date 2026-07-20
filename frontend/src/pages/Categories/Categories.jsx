import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import './Categories.css';
import Modal from '../../components/Modal/Modal.jsx';
import ConfirmDialog from '../../components/Modal/ConfirmDialog.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { PageLoader } from '../../components/Loader/Loader.jsx';
import { useToast } from '../../hooks/useToast.jsx';
import { categoryAPI } from '../../services/api.js';
import { formatDate } from '../../utils/helpers.js';

const EMPTY_FORM = { name: '', description: '' };
const PER_PAGE = 8;

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const loadCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      setCategories(data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const filtered = useMemo(() =>
    categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search]
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setFormErrors({}); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ name: item.name, description: item.description }); setFormErrors({}); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditItem(null); setForm(EMPTY_FORM); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Category name is required';
    setFormErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editItem) {
        await categoryAPI.update(editItem.id, form);
        toast.success('Category updated successfully');
      } else {
        await categoryAPI.create(form);
        toast.success('Category added successfully');
      }
      await loadCategories();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await categoryAPI.delete(deleteId);
      toast.success('Category deleted');
      await loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Category Management</h1>
          <p>{categories.length} total categories</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search categories..." />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{filtered.length} results</span>
        </div>

        {paginated.length === 0 ? (
          <EmptyState
            title="No categories found"
            description={search ? `No results for "${search}"` : 'Add your first category to get started.'}
            action={<button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Category</button>}
          />
        ) : (
          <>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Items</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((cat, i) => (
                    <tr key={cat.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{(page - 1) * PER_PAGE + i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Tag size={14} style={{ color: 'var(--primary-dark)' }} />
                          </div>
                          <span style={{ fontWeight: 500 }}>{cat.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: 240 }}>
                        <span className="truncate" style={{ display: 'block', maxWidth: 240 }}>{cat.description || '—'}</span>
                      </td>
                      <td><span className="badge badge-primary">{cat.itemCount} items</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(cat.createdAt)}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn btn-icon btn-sm btn-icon-primary" onClick={() => openEdit(cat)} title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-icon btn-sm btn-icon-danger" onClick={() => setDeleteId(cat.id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0 24px 16px' }}>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Edit Category' : 'Add Category'}
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editItem ? 'Update' : 'Add Category'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Category Name <span>*</span></label>
            <input
              className={`form-control${formErrors.name ? ' error' : ''}`}
              placeholder="e.g., Hot Beverages"
              value={form.name}
              onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setFormErrors((p) => ({ ...p, name: '' })); }}
            />
            {formErrors.name && <p className="form-error">{formErrors.name}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control form-textarea"
              placeholder="Brief description of this category"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
