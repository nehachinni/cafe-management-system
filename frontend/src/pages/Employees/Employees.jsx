import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import './Employees.css';
import Modal from '../../components/Modal/Modal.jsx';
import ConfirmDialog from '../../components/Modal/ConfirmDialog.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { PageLoader } from '../../components/Loader/Loader.jsx';
import { useToast } from '../../hooks/useToast.jsx';
import { employeeAPI } from '../../services/api.js';
import { formatCurrency, formatDate, getInitials } from '../../utils/helpers.js';

const ROLES = ['Admin', 'Manager', 'Cashier', 'Chef', 'Barista', 'Waiter'];
const EMPTY_FORM = { name: '', email: '', phone: '', role: 'Cashier', salary: '', joiningDate: '', status: 'active', password: '' };
const PER_PAGE = 8;

export default function Employees() {
  const [employees, setEmployees] = useState([]);
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

  const loadEmployees = async () => {
    try {
      const data = await employeeAPI.getAll();
      setEmployees(data);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmployees(); }, []);

  const filtered = useMemo(() =>
    employees.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
    ),
    [employees, search]
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setFormErrors({}); setModalOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, email: item.email, phone: item.phone, role: item.role, salary: String(item.salary), joiningDate: item.joiningDate, status: item.status, password: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.salary || isNaN(form.salary)) e.salary = 'Valid salary is required';
    setFormErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editItem) {
        await employeeAPI.update(editItem.id, form);
        toast.success('Employee updated');
      } else {
        await employeeAPI.create(form);
        toast.success('Employee added');
      }
      await loadEmployees();
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await employeeAPI.delete(deleteId);
      toast.success('Employee removed');
      await loadEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove employee');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1>Employee Management</h1><p>{employees.length} total employees</p></div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Employee</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search employees..." />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{filtered.length} results</span>
        </div>

        {paginated.length === 0 ? (
          <EmptyState title="No employees found" description={search ? `No results for "${search}"` : 'Add your first employee.'} action={<button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Employee</button>} />
        ) : (
          <>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr><th>Employee</th><th>Role</th><th>Phone</th><th>Salary</th><th>Joining Date</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {paginated.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar">{getInitials(emp.name)}</div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{emp.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-primary">{emp.role}</span></td>
                      <td>{emp.phone}</td>
                      <td><strong>{formatCurrency(emp.salary)}</strong></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(emp.joiningDate)}</td>
                      <td><span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{emp.status}</span></td>
                      <td>
                        <div className="table-actions">
                          <button className="btn btn-icon btn-sm btn-icon-primary" onClick={() => openEdit(emp)}><Pencil size={13} /></button>
                          <button className="btn btn-icon btn-sm btn-icon-danger" onClick={() => setDeleteId(emp.id)}><Trash2 size={13} /></button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Employee' : 'Add Employee'} size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update' : 'Add Employee'}</button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group form-full">
            <label className="form-label">Full Name <span>*</span></label>
            <input className={`form-control${formErrors.name ? ' error' : ''}`} placeholder="e.g., Riya Sharma" value={form.name} onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setFormErrors((p) => ({ ...p, name: '' })); }} />
            {formErrors.name && <p className="form-error">{formErrors.name}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Email <span>*</span></label>
            <input type="email" className={`form-control${formErrors.email ? ' error' : ''}`} placeholder="email@cafe.com" value={form.email} onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setFormErrors((p) => ({ ...p, email: '' })); }} disabled={!!editItem} />
            {formErrors.email && <p className="form-error">{formErrors.email}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Phone <span>*</span></label>
            <input className={`form-control${formErrors.phone ? ' error' : ''}`} placeholder="9876543210" value={form.phone} onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); setFormErrors((p) => ({ ...p, phone: '' })); }} />
            {formErrors.phone && <p className="form-error">{formErrors.phone}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control form-select" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Salary (₹) <span>*</span></label>
            <input type="number" className={`form-control${formErrors.salary ? ' error' : ''}`} placeholder="20000" value={form.salary} onChange={(e) => { setForm((p) => ({ ...p, salary: e.target.value })); setFormErrors((p) => ({ ...p, salary: '' })); }} />
            {formErrors.salary && <p className="form-error">{formErrors.salary}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Joining Date</label>
            <input type="date" className="form-control" value={form.joiningDate} onChange={(e) => setForm((p) => ({ ...p, joiningDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control form-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {!editItem && (
            <div className="form-group form-full">
              <label className="form-label">Login Password</label>
              <input type="text" className="form-control" placeholder="Leave blank to use default: cafe@123" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Remove Employee" message="Are you sure you want to remove this employee?" confirmLabel="Remove" variant="danger" />
    </div>
  );
}
