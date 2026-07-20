import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Tag, UtensilsCrossed, LayoutGrid, ClipboardList,
  Receipt, Users, BarChart2, Settings, LogOut, Coffee, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/tables', icon: LayoutGrid, label: 'Tables' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {!collapsed && <div className="sidebar-overlay" onClick={onToggle} />}
      <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <Coffee size={20} />
            </div>
            {!collapsed && (
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-name">Brew &amp; Bite</span>
                <span className="sidebar-brand-sub">Cafe Management</span>
              </div>
            )}
          </div>
          <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="sidebar-icon" />
              {!collapsed && <span className="sidebar-label">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {user.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.name}</span>
                <span className="sidebar-user-role">{user.role}</span>
              </div>
            </div>
          )}
          <button className="sidebar-link sidebar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={18} className="sidebar-icon" />
            {!collapsed && <span className="sidebar-label">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
