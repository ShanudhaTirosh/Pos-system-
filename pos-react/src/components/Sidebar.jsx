import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ShoppingCart, ChefHat, Pizza, CreditCard, History, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ collapsed }) {
  const { user, userProfile } = useAuth();

  const navItems = [
    { label: 'Main', isHeader: true },
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Tables',    path: '/tables',    icon: <UtensilsCrossed size={18} /> },
    { label: 'Orders',    path: '/orders',    icon: <ShoppingCart size={18} />, badge: 'pendingOrdersBadge' },
    { label: 'Kitchen',   path: '/kitchen',   icon: <ChefHat size={18} /> },
    { label: 'Management', isHeader: true },
    { label: 'Menu',      path: '/menu',      icon: <Pizza size={18} /> },
    { label: 'Billing',   path: '/billing',   icon: <CreditCard size={18} /> },
    { label: 'History',   path: '/history',   icon: <History size={18} /> },
    { label: 'Account', isHeader: true },
    { label: 'Profile',   path: '/profile',   icon: <User size={18} /> },
  ];

  const name = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User';
  const role = userProfile?.role || 'Staff';

  return (
    <nav className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">🍽️</div>
        {!collapsed && (
          <div>
            <div className="brand-name">Restaurant Pro</div>
            <div className="brand-tagline">Management System</div>
          </div>
        )}
      </div>

      <div className="scroll-list">
        {navItems.map((item, idx) => (
          item.isHeader ? (
            <div key={idx} className="sidebar-section-label" style={{ marginTop: idx === 0 ? 0 : 12 }}>
              {item.label}
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {item.badge && !collapsed && (
                <span className="nav-badge" id={item.badge} style={{ display: 'none' }}>0</span>
              )}
            </NavLink>
          )
        ))}
      </div>

      <div className="sidebar-footer">
        <NavLink to="/profile" className="user-pill">
          <div className="user-avatar">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="avatar" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          {!collapsed && (
            <div>
              <div className="user-name">{name}</div>
              <div className="user-role">{role}</div>
            </div>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
