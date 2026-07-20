import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import Navbar from '../components/Navbar/Navbar.jsx';
import '../App.css';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/categories': 'Category Management',
  '/menu': 'Menu Management',
  '/tables': 'Table Management',
  '/orders': 'Order Management',
  '/billing': 'Billing',
  '/employees': 'Employee Management',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
};

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  const title = PAGE_TITLES[pathname] || 'Cafe Management';

  const handleToggle = () => setCollapsed((prev) => !prev);

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <div className={`main-content${collapsed ? ' sidebar-collapsed' : ''}`}>
        <Navbar onMenuToggle={handleToggle} pageTitle={title} />
        <main className="page-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
