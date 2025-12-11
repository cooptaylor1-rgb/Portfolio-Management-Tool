/**
 * Navigation Configuration
 * 
 * Centralized, typed navigation structure for the application.
 * Organized by functional domain for a Palantir-style workstation experience.
 */

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
  PieChart,
  Activity,
  AlertTriangle,
  Eye,
  Calculator,
  GitBranch,
  Coins,
  Users,
  Globe,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Key to lookup badge count from app state (e.g., 'unreadAlerts') */
  badgeKey?: string;
  /** Keyboard shortcut hint (display only) */
  shortcut?: string;
}

export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  /** Whether section is collapsible (default: true) */
  collapsible?: boolean;
}

export interface NavConfig {
  sections: NavSection[];
  quickAccess: NavItem[];
  bottom: NavItem[];
}

// ============================================================================
// Navigation Configuration
// ============================================================================

export const navigationConfig: NavConfig = {
  // Quick access items shown at the top (always visible)
  quickAccess: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      shortcut: 'G D',
    },
  ],

  // Main navigation sections grouped by domain
  sections: [
    {
      id: 'portfolios',
      label: 'Portfolios',
      icon: Briefcase,
      items: [
        { id: 'overview', label: 'Overview', href: '/portfolios', icon: PieChart },
        { id: 'positions', label: 'Positions', href: '/portfolios/positions', icon: TrendingUp },
        { id: 'transactions', label: 'Transactions', href: '/portfolios/transactions', icon: Activity },
      ],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      items: [
        { id: 'performance', label: 'Performance', href: '/analytics/performance', icon: TrendingUp },
        { id: 'risk', label: 'Risk', href: '/analytics/risk', icon: AlertTriangle },
        { id: 'scenarios', label: 'Scenarios', href: '/analytics/scenarios', icon: GitBranch },
        { id: 'correlation', label: 'Correlation', href: '/analytics/correlation', icon: GitBranch },
      ],
    },
    {
      id: 'research',
      label: 'Research',
      icon: FileText,
      items: [
        { id: 'equity', label: 'Equity', href: '/research/equity', icon: TrendingUp },
        { id: 'themes', label: 'Themes', href: '/research/themes', icon: Target },
        { id: 'notes', label: 'Notes', href: '/research/notes', icon: BookOpen },
        { id: 'macro', label: 'Macro', href: '/research/macro', icon: Globe },
      ],
    },
    {
      id: 'trading',
      label: 'Trading',
      icon: Target,
      items: [
        { id: 'journal', label: 'Journal', href: '/trading/journal', icon: BookOpen },
        { id: 'sizing', label: 'Sizing', href: '/trading/sizing', icon: Calculator },
        { id: 'dividends', label: 'Dividends', href: '/trading/dividends', icon: Coins },
      ],
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: Eye,
      items: [
        { id: 'watchlist', label: 'Watchlist', href: '/watchlist', icon: Eye },
        { id: 'alerts', label: 'Alerts', href: '/alerts', icon: Bell, badgeKey: 'unreadAlerts' },
      ],
    },
    {
      id: 'system',
      label: 'System',
      icon: Users,
      items: [
        { id: 'collaborate', label: 'Collaborate', href: '/collaborate', icon: Users },
      ],
    },
  ],

  // Bottom items (settings, etc.)
  bottom: [
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      shortcut: 'G S',
    },
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find the active section and item based on current path
 */
export function findActiveNavItem(pathname: string): {
  section: NavSection | null;
  item: NavItem | null;
} {
  // Check quick access
  const quickAccessItem = navigationConfig.quickAccess.find(item => item.href === pathname);
  if (quickAccessItem) {
    return { section: null, item: quickAccessItem };
  }

  // Check bottom items
  const bottomItem = navigationConfig.bottom.find(item => item.href === pathname);
  if (bottomItem) {
    return { section: null, item: bottomItem };
  }

  // Check sections
  for (const section of navigationConfig.sections) {
    const item = section.items.find(
      item => pathname === item.href || pathname.startsWith(item.href + '/')
    );
    if (item) {
      return { section, item };
    }
  }

  return { section: null, item: null };
}

/**
 * Get all navigation items as a flat array (useful for keyboard navigation)
 */
export function getAllNavItems(): NavItem[] {
  return [
    ...navigationConfig.quickAccess,
    ...navigationConfig.sections.flatMap(section => section.items),
    ...navigationConfig.bottom,
  ];
}

/**
 * Get keyboard shortcuts map
 */
export function getShortcutsMap(): Map<string, NavItem> {
  const map = new Map<string, NavItem>();
  getAllNavItems().forEach(item => {
    if (item.shortcut) {
      map.set(item.shortcut.toLowerCase().replace(/\s/g, ''), item);
    }
  });
  return map;
}
