import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Coffee } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useToast } from '../../hooks/useToast.jsx';
import { authAPI } from '../../services/api.js';
import './Login.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 4) e.password = 'Password too short';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      const { token, user } = res.data;
      login(token, { name: user.full_name, email: user.email, role: user.role });
      toast.success(`Welcome back, ${user.full_name}!`);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-circle circle-1" />
        <div className="login-bg-circle circle-2" />
        <div className="login-bg-circle circle-3" />
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Coffee size={28} />
          </div>
          <h1 className="login-title">Brew &amp; Bite</h1>
          <p className="login-subtitle">Cafe Management System</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email Address <span>*</span></label>
            <input
              type="email"
              className={`form-control${errors.email ? ' error' : ''}`}
              placeholder="admin@cafe.com"
              value={form.email}
              onChange={handleChange('email')}
              autoComplete="email"
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password <span>*</span></label>
            <div className="login-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control${errors.password ? ' error' : ''}`}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange('password')}
                autoComplete="current-password"
              />
              <button type="button" className="login-eye-btn" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <div className="login-options">
            <button type="button" className="login-forgot">Forgot Password?</button>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full login-submit" disabled={loading}>
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderTopColor: '#fff' }} /> Signing In...</>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="login-hints">
          <p>Demo credentials:</p>
          <code>admin@cafe.com / admin123</code>
        </div>
      </div>
    </div>
  );
}
