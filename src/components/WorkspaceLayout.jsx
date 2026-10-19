import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const WorkspaceLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('lost-found-theme') || 'light');
  const [globalSearch, setGlobalSearch] = useState(() => new URLSearchParams(location.search).get('keyword') || '');
  const activeView = location.pathname.slice(1) || 'dashboard';
  const userInitials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('lost-found-theme', theme);
  }, [theme]);

  useEffect(() => {
    setGlobalSearch(new URLSearchParams(location.search).get('keyword') || '');
  }, [location.search]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    const resetMobileSidebar = () => {
      if (window.innerWidth > 820) setSidebarOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', resetMobileSidebar);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', resetMobileSidebar);
    };
  }, []);

  const goTo = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 820) setSidebarOpen((open) => !open);
    else setSidebarCollapsed((collapsed) => !collapsed);
  };

  const submitGlobalSearch = (event) => {
    event.preventDefault();
    const keyword = globalSearch.trim();
    goTo(keyword ? `/browse?keyword=${encodeURIComponent(keyword)}` : '/browse');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle" aria-label={sidebarOpen ? 'Close sidebar' : 'Toggle sidebar'} aria-expanded={sidebarOpen} onClick={toggleSidebar}>{sidebarOpen ? '×' : '☰'}</button>
          <div className="brand-block"><div className="brand-mark">R</div><div className="brand-copy"><span className="brand-name">REPOSIT</span><small>Registry of Custody</small></div></div>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <button className={`nav-item${activeView === 'dashboard' ? ' active' : ''}`} onClick={() => goTo('/dashboard')}><span className="nav-icon">◫</span><span className="nav-label">Dashboard</span></button>
          <button className={`nav-item${activeView === 'browse' ? ' active' : ''}`} onClick={() => goTo('/browse')}><span className="nav-icon">▣</span><span className="nav-label">Catalog</span></button>
          <button className={`nav-item${activeView === 'report-lost' ? ' active' : ''}`} onClick={() => goTo('/report-lost')}><span className="nav-icon">△</span><span className="nav-label">Report Lost</span></button>
          <button className={`nav-item${activeView === 'report-found' ? ' active' : ''}`} onClick={() => goTo('/report-found')}><span className="nav-icon">○</span><span className="nav-label">Report Found</span></button>
          <button className={`nav-item${activeView === 'my-reports' ? ' active' : ''}`} onClick={() => goTo('/my-reports')}><span className="nav-icon">⎘</span><span className="nav-label">My Reports</span></button>
        </nav>
        <button className="new-entry-btn" onClick={() => goTo('/report-found')}>+ New Entry</button>
        <div className="appearance-box"><span>Appearance</span><div className="theme-toggle"><button className={`theme-mode${theme === 'light' ? ' active' : ''}`} onClick={() => setTheme('light')}>LIGHT</button><button className={`theme-mode${theme === 'dark' ? ' active' : ''}`} onClick={() => setTheme('dark')}>DARK</button></div></div>
        <div className="user-box"><div className="avatar">{userInitials}</div><div className="user-copy"><strong>{user?.name || 'Account'}</strong><small>{user?.email || ''}</small></div><button className="logout-btn" aria-label="Logout" onClick={handleLogout}>↗</button></div>
      </aside>
      <div className={`page-overlay${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      <div className="main-panel">
        <header className="top-header"><div className="top-header-left"><span className="header-kicker">SMART LOST &amp; FOUND</span></div><div className="top-header-right"><form className="search-wrap" onSubmit={submitGlobalSearch}><span className="search-icon">⌕</span><input type="search" aria-label="Search archives" value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search archives, serials..." /></form><button className="header-logout" type="button" onClick={handleLogout}><span aria-hidden="true">↗</span> Logout</button></div></header>
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
