import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import MenuManagement from './pages/MenuManagement';
import Profile from './pages/Profile';
import TableManagement from './pages/TableManagement';
import Orders from './pages/Orders';
import Kitchen from './pages/Kitchen';
import History from './pages/History';
import Billing from './pages/Billing';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (user === undefined) return <div className="loading-overlay"><div className="spinner-amber"></div></div>;
  if (!user) return <Navigate to="/auth" />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="menu"      element={<MenuManagement />} />
        <Route path="tables"    element={<TableManagement />} />
        <Route path="orders"    element={<Orders />} />
        <Route path="kitchen"   element={<Kitchen />} />
        <Route path="history"   element={<History />} />
        <Route path="billing"   element={<Billing />} />
        <Route path="profile"   element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
