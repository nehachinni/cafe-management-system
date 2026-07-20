import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Search, Tag, UtensilsCrossed, Users as UsersIcon, ShoppingBag, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { categoryAPI, productAPI, employeeAPI, orderAPI } from '../../services/api.js';
import { debounce, formatCurrency, formatDateTime } from '../../utils/helpers.js';
import './Navbar.css';

export default function Navbar({ onMenuToggle, pageTitle }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Poll pending orders for notification badge
  useEffect(() => {
    const loadPending = async () => {
      try {
        const orders = await orderAPI.getAll({ status: 'pending' });
        setPendingOrders(orders);
      } catch {
        // fail silently — notifications are non-critical
      }
    };
    loadPending();
    const interval = setInterval(loadPending, 30000);
    return () => clearInterval(interval);
  }, []);

  const runSearch = useCallback(
    debounce(async (term) => {
      if (!term.trim()) { setSearchResults(null); setSearching(false); return; }
      setSearching(true);
      try {
        const [cats, prods, emps] = await Promise.all([
          categoryAPI.getAll(), productAPI.getAll(), employeeAPI.getAll(),
        ]);
        const lower = term.toLowerCase();
        setSearchResults({
          categories: cats.filter((c) => c.name.toLowerCase().includes(lower)).slice(0, 4),
          products: prods.filter((p) => p.name.toLowerCase().includes(lower)).slice(0, 4),
          employees: emps.filter((e) => e.name.toLowerCase().includes(lower) || e.role.toLowerCase().includes(lower)).slice(0, 4),
        });
      } catch {
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 350),
    []
  );

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setSearchOpen(true);
    runSearch(val);
  };

  const goTo = (path) => {
    navigate(path);
    setSearchOpen(false);
    setSearchTerm('');
    setSearchResults(null);
  };

  const hasResults = searchResults && (searchResults.categories.length || searchResults.products.length || searchResults.employees.length);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-menu-btn" onClick={onMenuToggle}>
          <Menu size={20} />
        </button>
        <div className="navbar-title">
          <h2>{pageTitle}</h2>
        </div>
      </div>

      <div className="navbar-right">
        {/* Quick Search */}
        <div className="navbar-search" ref={searchRef} style={{ position: 'relative' }}>
          <Search size={15} className="navbar-search-icon" />
          <input
            type="text"
            placeholder="Quick search..."
            className="navbar-search-input"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => searchTerm && setSearchOpen(true)}
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setSearchResults(null); setSearchOpen(false); }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
            >
              <X size={14} />
            </button>
          )}

          {searchOpen && searchTerm && (
            <div className="navbar-search-dropdown">
              {searching ? (
                <div className="navbar-dropdown-empty">Searching...</div>
              ) : !hasResults ? (
                <div className="navbar-dropdown-empty">No results for "{searchTerm}"</div>
              ) : (
                <>
                  {searchResults.categories.length > 0 && (
                    <div className="navbar-dropdown-group">
                      <span className="navbar-dropdown-label">Categories</span>
                      {searchResults.categories.map((c) => (
                        <button key={`cat-${c.id}`} className="navbar-dropdown-item" onClick={() => goTo('/categories')}>
                          <Tag size={14} /> <span>{c.name}</span> <small>{c.itemCount} items</small>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.products.length > 0 && (
                    <div className="navbar-dropdown-group">
                      <span className="navbar-dropdown-label">Menu Items</span>
                      {searchResults.products.map((p) => (
                        <button key={`prod-${p.id}`} className="navbar-dropdown-item" onClick={() => goTo('/menu')}>
                          <UtensilsCrossed size={14} /> <span>{p.name}</span> <small>{formatCurrency(p.price)}</small>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.employees.length > 0 && (
                    <div className="navbar-dropdown-group">
                      <span className="navbar-dropdown-label">Employees</span>
                      {searchResults.employees.map((e) => (
                        <button key={`emp-${e.id}`} className="navbar-dropdown-item" onClick={() => goTo('/employees')}>
                          <UsersIcon size={14} /> <span>{e.name}</span> <small>{e.role}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="navbar-icon-btn" onClick={() => setNotifOpen((v) => !v)}>
            <Bell size={18} />
            {pendingOrders.length > 0 && <span className="navbar-badge">{pendingOrders.length}</span>}
          </button>

          {notifOpen && (
            <div className="navbar-notif-dropdown">
              <div className="navbar-dropdown-label" style={{ padding: '10px 14px 6px' }}>
                Pending Orders {pendingOrders.length > 0 && `(${pendingOrders.length})`}
              </div>
              {pendingOrders.length === 0 ? (
                <div className="navbar-dropdown-empty">No pending orders 🎉</div>
              ) : (
                pendingOrders.map((o) => (
                  <button key={o.id} className="navbar-dropdown-item" onClick={() => goTo('/orders')} style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <strong style={{ fontSize: 13 }}><ShoppingBag size={13} style={{ marginRight: 6, verticalAlign: -2 }} />{o.billNo}</strong>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(o.amount)}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.type} · {o.table} · {formatDateTime(o.createdAt)}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="navbar-user">
          <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'A'}</div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user?.name || 'Admin'}</span>
            <span className="navbar-user-role">{user?.role || 'Administrator'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
