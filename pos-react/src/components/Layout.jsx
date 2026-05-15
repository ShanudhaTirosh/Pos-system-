import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} />
      <div className="main-area">
        <Topbar 
          title="Restaurant Pro" 
          subtitle="Premium POS Management"
          onToggleSidebar={() => setCollapsed(!collapsed)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
