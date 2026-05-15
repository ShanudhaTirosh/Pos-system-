import { Search, Sun, Moon, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title, subtitle, onToggleSidebar, theme, onToggleTheme }) {
  const { logout } = useAuth();

  return (
    <div className="topbar">
      <button className="icon-btn me-2" onClick={onToggleSidebar} title="Toggle sidebar">
        <Menu size={18} />
      </button>
      
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
      </div>

      <div className="topbar-spacer"></div>

      <div className="topbar-search">
        <span className="search-icon"><Search size={14} /></span>
        <input type="text" placeholder="Search…" id="globalSearch" autoComplete="off" />
      </div>

      <button className="icon-btn" onClick={onToggleTheme} title="Toggle theme">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <button className="icon-btn" onClick={logout} title="Sign out">
        <LogOut size={18} />
      </button>
    </div>
  );
}
