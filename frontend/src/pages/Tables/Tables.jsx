import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Users, MapPin } from 'lucide-react';
import Modal from '../../components/Modal/Modal.jsx';
import ConfirmDialog from '../../components/Modal/ConfirmDialog.jsx';
import { PageLoader } from '../../components/Loader/Loader.jsx';
import { useToast } from '../../hooks/useToast.jsx';
import { tableAPI } from '../../services/api.js';
import './Tables.css';

const EMPTY_FORM = { number: '', capacity: 2, location: 'Indoor', status: 'available' };

const STATUS_CONFIG = {
  available: { label: 'Available', className: 'badge-success', cardClass: 'table-available' },
  occupied: { label: 'Occupied', className: 'badge-error', cardClass: 'table-occupied' },
  reserved: { label: 'Reserved', className: 'badge-warning', cardClass: 'table-reserved' },
};

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const loadTables = async () => {
    try {
      const data = await tableAPI.getAll();
      setTables(data);
    } catch {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTables(); }, []);

  const counts = {
    available: tables.filter((t) => t.status === 'available').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
  };

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setFormErrors({}); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ number: item.number, capacity: item.capacity, location: item.location, status: item.status }); setFormErrors({}); setModalOpen(true); };

  const validate = () => {
    const e = {};
    if (!form.number.trim()) e.number = 'Table number is required';
    if (!form.capacity || form.capacity < 1) e.capacity = 'Capacity must be at least 1';
    setFormErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editItem) {
        await tableAPI.update(editItem.id, form);
        toast.success('Table updated');
      } else {
        await tableAPI.create(form);
        toast.success('Table added');
      }
      await loadTables();
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save table');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await tableAPI.delete(deleteId);
      toast.success('Table deleted');
      await loadTables();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete table');
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (id, status) => {
    setTables((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    try {
      await tableAPI.updateStatus(id, status);
      toast.info(`Table status updated to ${status}`);
    } catch {
      toast.error('Failed to update table status');
      loadTables();
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Table Management</h1>
          <p>{tables.length} total tables</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Table</button>
        </div>
      </div>

      {/* Summary */}
      <div className="table-summary">
        <div className="summary-item summary-available">
          <span className="summary-count">{counts.available}</span>
          <span className="summary-label">Available</span>
        </div>
        <div className="summary-item summary-occupied">
          <span className="summary-count">{counts.occupied}</span>
          <span className="summary-label">Occupied</span>
        </div>
        <div className="summary-item summary-reserved">
          <span className="summary-count">{counts.reserved}</span>
          <span className="summary-label">Reserved</span>
        </div>
      </div>

      {/* Visual Table Grid */}
      <div className="cafe-floor">
        {tables.map((table) => {
          const cfg = STATUS_CONFIG[table.status];
          return (
            <div key={table.id} className={`cafe-table ${cfg.cardClass}`}>
              <div className="cafe-table-header">
                <span className="cafe-table-number">{table.number}</span>
                <span className={`badge ${cfg.className}`}>{cfg.label}</span>
              </div>
              <div className="cafe-table-info">
                <span><Users size={13} /> {table.capacity} seats</span>
                <span><MapPin size={13} /> {table.location}</span>
              </div>
              <div className="cafe-table-actions">
                <select
                  className="form-control form-select cafe-table-status-select"
                  value={table.status}
                  onChange={(e) => handleStatusChange(table.id, e.target.value)}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                </select>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-icon btn-sm btn-icon-primary" onClick={() => openEdit(table)}><Pencil size={12} /></button>
                  <button className="btn btn-icon btn-sm btn-icon-danger" onClick={() => setDeleteId(table.id)}><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Table' : 'Add Table'} size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update' : 'Add Table'}</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Table Number <span>*</span></label>
            <input className={`form-control${formErrors.number ? ' error' : ''}`} placeholder="e.g., T01" value={form.number} onChange={(e) => { setForm((p) => ({ ...p, number: e.target.value })); setFormErrors((p) => ({ ...p, number: '' })); }} />
            {formErrors.number && <p className="form-error">{formErrors.number}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Capacity <span>*</span></label>
            <input type="number" className={`form-control${formErrors.capacity ? ' error' : ''}`} min={1} value={form.capacity} onChange={(e) => { setForm((p) => ({ ...p, capacity: e.target.value })); setFormErrors((p) => ({ ...p, capacity: '' })); }} />
            {formErrors.capacity && <p className="form-error">{formErrors.capacity}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <select className="form-control form-select" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}>
              <option>Indoor</option>
              <option>Outdoor</option>
              <option>Private Room</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control form-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Table" message="Are you sure you want to delete this table?" confirmLabel="Delete" variant="danger" />
    </div>
  );
}
