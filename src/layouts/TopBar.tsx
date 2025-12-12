/**
 * TopBar - Global actions and context
 * 
 * Provides:
 * - Sidebar toggle
 * - Breadcrumb navigation
 * - Global search
 * - Date range selector
 * - Notifications
 * - User menu
 */

import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Calendar,
  Bell,
  User,
  ChevronDown,
  Command,
  LogOut,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { useShell } from './AppShell';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolio } from '../contexts/PortfolioContext';

interface TopBarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function TopBar({ onToggleSidebar, sidebarCollapsed }: TopBarProps) {
  const location = useLocation();
  const { dateRange, setDateRange } = useShell();
  const { user, logout } = useAuth();
  const { portfolios, activePortfolio, selectPortfolio, isLoading: isPortfolioLoading } = usePortfolio();
  const [showSearch, setShowSearch] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPortfolioMenu, setShowPortfolioMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setShowUserMenu(false);
    }
  };

  // Generate breadcrumbs from path
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowDatePicker(false);
        setShowPortfolioMenu(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const dateRangePresets = [
    { label: '1W', days: 7 },
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
    { label: 'YTD', days: -1 }, // Special case
    { label: '1Y', days: 365 },
    { label: 'All', days: -2 }, // Special case
  ];

  const handleDatePreset = (days: number) => {
    const end = new Date();
    let start: Date;
    
    if (days === -1) {
      // YTD
      start = new Date(end.getFullYear(), 0, 1);
    } else if (days === -2) {
      // All time (5 years back)
      start = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
    } else {
      start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }
    
    setDateRange({ start, end });
    setShowDatePicker(false);
  };

  const handlePortfolioSelect = async (portfolioId: string) => {
    try {
      await selectPortfolio(portfolioId);
    } finally {
      setShowPortfolioMenu(false);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        {/* Sidebar Toggle */}
        <button 
          className="topbar__toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumbs */}
        <nav className="topbar__breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path} className="topbar__breadcrumb">
              {index > 0 && <ChevronRight size={14} className="topbar__breadcrumb-separator" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="topbar__breadcrumb-current">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="topbar__breadcrumb-link">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="topbar__right">
        {/* Portfolio Selector */}
        {portfolios.length > 0 && (
          <div className="topbar__dropdown">
            <button
              className="topbar__action"
              onClick={() => {
                setShowPortfolioMenu(!showPortfolioMenu);
                setShowDatePicker(false);
                setShowUserMenu(false);
              }}
              aria-expanded={showPortfolioMenu}
              aria-label="Select portfolio"
              type="button"
              disabled={isPortfolioLoading}
            >
              <span className="topbar__action-label">{activePortfolio?.name || 'Select portfolio'}</span>
              <ChevronDown size={14} />
            </button>

            {showPortfolioMenu && (
              <div className="topbar__dropdown-menu topbar__user-menu">
                {portfolios.map((p) => (
                  <button
                    key={p.id}
                    className="topbar__menu-item"
                    onClick={() => handlePortfolioSelect(p.id)}
                    type="button"
                    disabled={isPortfolioLoading}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Global Search */}
        <button 
          className="topbar__action topbar__search-trigger"
          onClick={() => setShowSearch(true)}
          aria-label="Search (⌘K)"
        >
          <Search size={18} />
          <span className="topbar__search-placeholder">Search...</span>
          <kbd className="topbar__kbd">⌘K</kbd>
        </button>

        {/* Date Range Selector */}
        <div className="topbar__dropdown">
          <button 
            className="topbar__action"
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setShowPortfolioMenu(false);
              setShowUserMenu(false);
            }}
            aria-expanded={showDatePicker}
          >
            <Calendar size={18} />
            <span className="topbar__action-label">
              {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
            </span>
            <ChevronDown size={14} />
          </button>
          
          {showDatePicker && (
            <div className="topbar__dropdown-menu topbar__date-picker">
              <div className="topbar__date-presets">
                {dateRangePresets.map((preset) => (
                  <button
                    key={preset.label}
                    className="topbar__date-preset"
                    onClick={() => handleDatePreset(preset.days)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="topbar__date-inputs">
                <div className="topbar__date-field">
                  <label>From</label>
                  <input
                    type="date"
                    value={format(dateRange.start, 'yyyy-MM-dd')}
                    onChange={(e) => setDateRange({
                      ...dateRange,
                      start: new Date(e.target.value)
                    })}
                  />
                </div>
                <div className="topbar__date-field">
                  <label>To</label>
                  <input
                    type="date"
                    value={format(dateRange.end, 'yyyy-MM-dd')}
                    onChange={(e) => setDateRange({
                      ...dateRange,
                      end: new Date(e.target.value)
                    })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button className="topbar__action topbar__notifications" aria-label="Notifications">
          <Bell size={18} />
          <span className="topbar__badge">3</span>
        </button>

        {/* User Menu */}
        <div className="topbar__dropdown">
          <button 
            className="topbar__user"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowDatePicker(false);
              setShowPortfolioMenu(false);
            }}
            aria-expanded={showUserMenu}
          >
            <div className="topbar__avatar">
              <User size={16} />
            </div>
            <ChevronDown size={14} />
          </button>
          
          {showUserMenu && (
            <div className="topbar__dropdown-menu topbar__user-menu">
              <div className="topbar__user-info">
                <div className="topbar__user-name">{user?.name || 'User'}</div>
                <div className="topbar__user-email">{user?.email || ''}</div>
              </div>
              <div className="topbar__menu-divider" />
              <Link to="/settings" className="topbar__menu-item">
                <Settings size={16} />
                Settings
              </Link>
              <button
                className="topbar__menu-item topbar__menu-item--danger"
                onClick={handleLogout}
                type="button"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="search-modal" onClick={() => setShowSearch(false)}>
          <div className="search-modal__content" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal__input-wrapper">
              <Search size={20} className="search-modal__icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="search-modal__input"
                placeholder="Search portfolios, positions, symbols..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <kbd className="search-modal__kbd">ESC</kbd>
            </div>
            
            <div className="search-modal__results">
              {searchQuery ? (
                <div className="search-modal__empty">
                  No results for "{searchQuery}"
                </div>
              ) : (
                <div className="search-modal__hints">
                  <div className="search-modal__hint-group">
                    <div className="search-modal__hint-title">Quick Actions</div>
                    <div className="search-modal__hint">
                      <Command size={14} />
                      <span>Type to search positions, symbols, or navigate</span>
                    </div>
                  </div>
                  <div className="search-modal__hint-group">
                    <div className="search-modal__hint-title">Recent</div>
                    <div className="search-modal__recent-item">AAPL - Apple Inc.</div>
                    <div className="search-modal__recent-item">MSFT - Microsoft Corporation</div>
                    <div className="search-modal__recent-item">VOO - Vanguard S&P 500 ETF</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function generateBreadcrumbs(pathname: string): Array<{ label: string; path: string }> {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; path: string }> = [];

  // Route label mapping
  const labels: Record<string, string> = {
    '': 'Dashboard',
    'portfolios': 'Portfolios',
    'positions': 'Positions',
    'transactions': 'Transactions',
    'analytics': 'Analytics',
    'performance': 'Performance',
    'risk': 'Risk',
    'scenarios': 'Scenarios',
    'correlation': 'Correlation',
    'research': 'Research',
    'equity': 'Equity Research',
    'themes': 'Themes',
    'notes': 'Notes',
    'macro': 'Macro',
    'trading': 'Trading',
    'journal': 'Trade Journal',
    'sizing': 'Position Sizing',
    'dividends': 'Dividends',
    'watchlist': 'Watchlist',
    'alerts': 'Alerts',
    'collaborate': 'Collaborate',
    'settings': 'Settings',
  };

  if (paths.length === 0) {
    return [{ label: 'Dashboard', path: '/' }];
  }

  let currentPath = '';
  for (const segment of paths) {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      label: labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      path: currentPath,
    });
  }

  return breadcrumbs;
}
