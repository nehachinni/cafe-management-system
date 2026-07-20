import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { ToastProvider } from './hooks/useToast.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

import Login from './pages/Login/Login.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Categories from './pages/Categories/Categories.jsx';
import Menu from './pages/Menu/Menu.jsx';
import Tables from './pages/Tables/Tables.jsx';
import Orders from './pages/Orders/Orders.jsx';
import Billing from './pages/Billing/Billing.jsx';
import Payment from './pages/Payment/Payment.jsx';
import Employees from './pages/Employees/Employees.jsx';
import Reports from './pages/Reports/Reports.jsx';
import Settings from './pages/Settings/Settings.jsx';

function PrivateRoute({ children }) {
  const { authenticated } = useAuth();
  return authenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { authenticated } = useAuth();
  return authenticated ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout><Dashboard /></DashboardLayout></PrivateRoute>} />
      <Route path="/categories" element={<PrivateRoute><DashboardLayout><Categories /></DashboardLayout></PrivateRoute>} />
      <Route path="/menu" element={<PrivateRoute><DashboardLayout><Menu /></DashboardLayout></PrivateRoute>} />
      <Route path="/tables" element={<PrivateRoute><DashboardLayout><Tables /></DashboardLayout></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute><DashboardLayout><Orders /></DashboardLayout></PrivateRoute>} />
      <Route path="/billing" element={<PrivateRoute><DashboardLayout><Billing /></DashboardLayout></PrivateRoute>} />
      <Route path="/payment" element={<PrivateRoute><DashboardLayout><Payment /></DashboardLayout></PrivateRoute>} />
      <Route path="/employees" element={<PrivateRoute><DashboardLayout><Employees /></DashboardLayout></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><DashboardLayout><Reports /></DashboardLayout></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><DashboardLayout><Settings /></DashboardLayout></PrivateRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
