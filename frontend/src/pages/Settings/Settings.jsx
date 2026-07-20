import { useState, useEffect, useRef } from 'react';
import { Save, Upload } from 'lucide-react';
import { useToast } from '../../hooks/useToast.jsx';
import { settingsAPI } from '../../services/api.js';
import { PageLoader } from '../../components/Loader/Loader.jsx';
import './Settings.css';

const EMPTY_FORM = { cafeName: '', address: '', gstNumber: '', phone: '', email: '', logo: '' };
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export default function Settings() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await settingsAPI.get();
        setForm({ ...EMPTY_FORM, ...data });
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleLogoClick = () => fileInputRef.current?.click();

  const handleLogoFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please upload a PNG or JPG image');
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      toast.error('Logo must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, logo: reader.result }));
    reader.onerror = () => toast.error('Failed to read the image file');
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.update(form);
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1>Settings</h1><p>Configure your cafe profile and preferences</p></div>
      </div>

      <form onSubmit={handleSave}>
        <div className="settings-grid">
          {/* Cafe Profile */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">Cafe Profile</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Logo */}
              <div className="settings-logo-section">
                <div className="settings-logo-preview">
                  {form.logo ? <img src={form.logo} alt="Logo" /> : <span style={{ fontSize: 32 }}>☕</span>}
                </div>
                <div>
                  <p style={{ fontWeight: 500, marginBottom: 6 }}>Cafe Logo</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>PNG, JPG up to 2MB</p>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handleLogoFile} style={{ display: 'none' }} />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogoClick}><Upload size={14} /> Upload Logo</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cafe Name <span>*</span></label>
                <input className="form-control" value={form.cafeName} onChange={handleChange('cafeName')} placeholder="Your Cafe Name" />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-control form-textarea" value={form.address} onChange={handleChange('address')} placeholder="Full address" />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input className="form-control" value={form.gstNumber} onChange={handleChange('gstNumber')} placeholder="29AAABC1234D1Z5" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={handleChange('phone')} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={form.email} onChange={handleChange('email')} placeholder="info@cafe.com" />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="card settings-preview-card">
              <div className="card-header"><h3 className="card-title">Bill Preview</h3></div>
              <div className="card-body">
                <div className="bill-preview-mini">
                  <div className="bill-preview-logo">
                    {form.logo ? <img src={form.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : '☕'}
                  </div>
                  <h4>{form.cafeName || 'Cafe Name'}</h4>
                  <p>{form.address || 'Address'}</p>
                  <p>{form.phone || 'Phone'}</p>
                  <p>GST: {form.gstNumber || 'GST Number'}</p>
                  <div style={{ borderTop: '1px dashed var(--border)', margin: '12px 0', paddingTop: 12, fontSize: 12 }}>
                    <p>Thank you for visiting!</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header"><h3 className="card-title">System Info</h3></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Version', value: '1.0.0' },
                    { label: 'Backend', value: 'Flask (connected)' },
                    { label: 'Database', value: 'MySQL (connected)' },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
