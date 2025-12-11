/**
 * Sidebar - Palantir-Grade Workstation Navigation
 * 
 * Dense, grouped navigation with:
 * - Collapsible icon-only rail mode
 * - Keyboard navigation (arrow keys, Enter)
 * - Section grouping by domain
 * - Active state detection
 * - Badge support for alerts/notifications
 */

import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { navigationConfig, type NavItem, type NavSection, findActiveNavItem } from '../config/navigation';

// ============================================================================
// Types
// ============================================================================

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  badges?: Record<string, number>;
}

interface NavSectionProps {
  section: NavSection;
  collapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  currentPath: string;
  badges?: Record<string, number>;
}

interface NavItemLinkProps {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
  isNested?: boolean;
  badge?: number;
}

// ============================================================================
// NavItemLink Component
// ============================================================================

const NavItemLink = memo(function NavItemLink({
  item,
  collapsed,
  isActive,
  isNested = false,
  badge,
}: NavItemLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      className={`
        nav-item
        ${isActive ? 'nav-item--active' : ''}
        ${isNested ? 'nav-item--nested' : ''}
      `}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={isNested ? 14 : 16} className="nav-item__icon" />
      {!collapsed && (
        <>
          <span className="nav-item__label">{item.label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="nav-item__badge">{badge > 99 ? '99+' : badge}</span>
          )}
          {item.shortcut && (
            <span className="nav-item__shortcut">{item.shortcut}</span>
          )}
        </>
      )}
    </Link>
  );
});

// ============================================================================
// NavSectionComponent
// ============================================================================

const NavSectionComponent = memo(function NavSectionComponent({
  section,
  collapsed,
  isExpanded,
  onToggle,
  currentPath,
  badges,
}: NavSectionProps) {
  const Icon = section.icon;
  const hasActiveChild = section.items.some(
    item => currentPath === item.href || currentPath.startsWith(item.href + '/')
  );

  // In collapsed mode, show tooltip with section name
  if (collapsed) {
    return (
      <div className="nav-section nav-section--collapsed">
        <div
          className={`nav-section__header nav-section__header--collapsed ${hasActiveChild ? 'nav-section__header--active' : ''}`}
          title={section.label}
        >
          <Icon size={18} className="nav-section__icon" />
        </div>
      </div>
    );
  }

  return (
    <div className={`nav-section ${isExpanded ? 'nav-section--expanded' : ''}`}>
      <button
        className={`nav-section__header ${hasActiveChild ? 'nav-section__header--active' : ''}`}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <Icon size={16} className="nav-section__icon" />
        <span className="nav-section__label">{section.label}</span>
        <ChevronRight size={14} className={`nav-section__chevron ${isExpanded ? 'nav-section__chevron--expanded' : ''}`} />
      </button>
      
      {isExpanded && (
        <div className="nav-section__items">
          {section.items.map(item => (
            <NavItemLink
              key={item.id}
              item={item}
              collapsed={false}
              isActive={currentPath === item.href || currentPath.startsWith(item.href + '/')}
              isNested
              badge={item.badgeKey ? badges?.[item.badgeKey] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// Sidebar Component
// ============================================================================

export function Sidebar({ collapsed, badges = {} }: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const sidebarRef = useRef<HTMLElement>(null);

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Auto-expand the section containing the active item
    const { section } = findActiveNavItem(currentPath);
    return section ? new Set([section.id]) : new Set();
  });

  // Update expanded section when route changes
  useEffect(() => {
    const { section } = findActiveNavItem(currentPath);
    if (section && !expandedSections.has(section.id)) {
      setExpandedSections(prev => new Set([...prev, section.id]));
    }
  }, [currentPath]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sidebarRef.current?.contains(document.activeElement)) return;

      const focusableItems = sidebarRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      const currentIndex = Array.from(focusableItems).indexOf(document.activeElement as HTMLElement);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          focusableItems[(currentIndex + 1) % focusableItems.length]?.focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          focusableItems[(currentIndex - 1 + focusableItems.length) % focusableItems.length]?.focus();
          break;
        case 'Home':
          e.preventDefault();
          focusableItems[0]?.focus();
          break;
        case 'End':
          e.preventDefault();
          focusableItems[focusableItems.length - 1]?.focus();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar-v2 ${collapsed ? 'sidebar-v2--collapsed' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div className="sidebar-v2__brand">
        <div className="sidebar-v2__logo">
          <TrendingUp size={20} />
        </div>
        {!collapsed && <span className="sidebar-v2__brand-text">Portfolio Pro</span>}
      </div>

      {/* Quick Access */}
      <div className="sidebar-v2__quick-access">
        {navigationConfig.quickAccess.map(item => (
          <NavItemLink
            key={item.id}
            item={item}
            collapsed={collapsed}
            isActive={currentPath === item.href}
          />
        ))}
      </div>

      {/* Main Navigation Sections */}
      <nav className="sidebar-v2__nav">
        {navigationConfig.sections.map(section => (
          <NavSectionComponent
            key={section.id}
            section={section}
            collapsed={collapsed}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
            currentPath={currentPath}
            badges={badges}
          />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="sidebar-v2__bottom">
        {navigationConfig.bottom.map(item => (
          <NavItemLink
            key={item.id}
            item={item}
            collapsed={collapsed}
            isActive={currentPath === item.href}
          />
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;
