/**
 * Sidebar - Primary navigation component
 * 
 * Provides hierarchical navigation organized by functional modules.
 * Supports collapsed state for more screen real estate.
 */

import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  BarChart3,
  FileText,
  BookOpen,
  Target,
  Bell,
  Settings,
  ChevronRight,
  PieChart,
  Activity,
  AlertTriangle,
  Eye,
  Calculator,
  GitBranch,
  Coins,
  Users,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  currentPath: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    id: 'portfolios',
    label: 'Portfolios',
    icon: Briefcase,
    children: [
      { id: 'overview', label: 'Overview', icon: PieChart, path: '/portfolios' },
      { id: 'positions', label: 'Positions', icon: TrendingUp, path: '/portfolios/positions' },
      { id: 'transactions', label: 'Transactions', icon: Activity, path: '/portfolios/transactions' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    children: [
      { id: 'performance', label: 'Performance', icon: TrendingUp, path: '/analytics/performance' },
      { id: 'risk', label: 'Risk', icon: AlertTriangle, path: '/analytics/risk' },
      { id: 'scenarios', label: 'Scenarios', icon: GitBranch, path: '/analytics/scenarios' },
      { id: 'correlation', label: 'Correlation', icon: GitBranch, path: '/analytics/correlation' },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    icon: FileText,
    children: [
      { id: 'equity', label: 'Equity Research', icon: TrendingUp, path: '/research/equity' },
      { id: 'themes', label: 'Themes', icon: Target, path: '/research/themes' },
      { id: 'notes', label: 'Notes', icon: BookOpen, path: '/research/notes' },
      { id: 'macro', label: 'Macro', icon: Activity, path: '/research/macro' },
    ],
  },
  {
    id: 'trading',
    label: 'Trading',
    icon: Target,
    children: [
      { id: 'journal', label: 'Trade Journal', icon: BookOpen, path: '/trading/journal' },
      { id: 'sizing', label: 'Position Sizing', icon: Calculator, path: '/trading/sizing' },
      { id: 'dividends', label: 'Dividends', icon: Coins, path: '/trading/dividends' },
    ],
  },
  {
    id: 'watchlist',
    label: 'Watchlist',
    icon: Eye,
    path: '/watchlist',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: Bell,
    path: '/alerts',
  },
  {
    id: 'collaboration',
    label: 'Collaborate',
    icon: Users,
    path: '/collaborate',
  },
];

const bottomNavigation: NavItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

export function Sidebar({ collapsed, currentPath }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Logo / Brand */}
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <TrendingUp size={24} className="sidebar__logo-icon" />
          {!collapsed && <span className="sidebar__logo-text">Portfolio Pro</span>}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar__nav">
        <ul className="sidebar__menu">
          {navigation.map((item) => (
            <NavItemComponent
              key={item.id}
              item={item}
              collapsed={collapsed}
              currentPath={currentPath}
            />
          ))}
        </ul>

        {/* Bottom Navigation */}
        <ul className="sidebar__menu sidebar__menu--bottom">
          {bottomNavigation.map((item) => (
            <NavItemComponent
              key={item.id}
              item={item}
              collapsed={collapsed}
              currentPath={currentPath}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

interface NavItemComponentProps {
  item: NavItem;
  collapsed: boolean;
  currentPath: string;
  depth?: number;
}

function NavItemComponent({ item, collapsed, currentPath, depth = 0 }: NavItemComponentProps) {
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path === currentPath;
  const isParentActive = hasChildren && item.children?.some(
    child => currentPath.startsWith(child.path || '')
  );

  // For items with children, check if any child is active
  const isExpanded = isParentActive || false;

  if (hasChildren) {
    return (
      <li className="sidebar__item sidebar__item--group">
        <div 
          className={`sidebar__link sidebar__link--group ${isParentActive ? 'sidebar__link--active' : ''}`}
          title={collapsed ? item.label : undefined}
        >
          <Icon size={20} className="sidebar__link-icon" />
          {!collapsed && (
            <>
              <span className="sidebar__link-text">{item.label}</span>
              <ChevronRight 
                size={16} 
                className={`sidebar__link-chevron ${isExpanded ? 'sidebar__link-chevron--expanded' : ''}`} 
              />
            </>
          )}
        </div>
        {!collapsed && (
          <ul className={`sidebar__submenu ${isExpanded ? 'sidebar__submenu--expanded' : ''}`}>
            {item.children?.map((child) => (
              <NavItemComponent
                key={child.id}
                item={child}
                collapsed={collapsed}
                currentPath={currentPath}
                depth={depth + 1}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li className="sidebar__item">
      <Link
        to={item.path || '/'}
        className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
        title={collapsed ? item.label : undefined}
        style={{ paddingLeft: depth > 0 ? `${16 + depth * 12}px` : undefined }}
      >
        <Icon size={depth > 0 ? 16 : 20} className="sidebar__link-icon" />
        {!collapsed && <span className="sidebar__link-text">{item.label}</span>}
      </Link>
    </li>
  );
}
