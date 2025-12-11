/**
 * AppShell - Main application layout
 * 
 * Provides the persistent structural frame for the entire application:
 * - Collapsible sidebar for navigation
 * - Top bar with global actions
 * - Main content area
 * - Optional right panel for contextual details
 */

import { useState, useCallback, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './SidebarV2';
import { TopBar } from './TopBar';
import { DetailsPanel, DetailsPanelContent } from './DetailsPanel';
import './sidebar-v2.css';

interface ShellContextType {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  detailsPanel: DetailsPanelContent | null;
  openDetailsPanel: (content: DetailsPanelContent) => void;
  closeDetailsPanel: () => void;
  dateRange: { start: Date; end: Date };
  setDateRange: (range: { start: Date; end: Date }) => void;
}

export const ShellContext = createContext<ShellContextType | null>(null);

export function useShell() {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error('useShell must be used within AppShell');
  }
  return context;
}

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailsPanel, setDetailsPanel] = useState<DetailsPanelContent | null>(null);
  
  // Default to last 1 year
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const openDetailsPanel = useCallback((content: DetailsPanelContent) => {
    setDetailsPanel(content);
  }, []);

  const closeDetailsPanel = useCallback(() => {
    setDetailsPanel(null);
  }, []);

  const contextValue: ShellContextType = {
    sidebarCollapsed,
    toggleSidebar,
    detailsPanel,
    openDetailsPanel,
    closeDetailsPanel,
    dateRange,
    setDateRange,
  };

  return (
    <ShellContext.Provider value={contextValue}>
      <div className="app-shell">
        <div className={`app-shell__sidebar ${sidebarCollapsed ? 'app-shell__sidebar--collapsed' : ''}`}>
          <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
        </div>
        
        <div className={`app-shell__main ${sidebarCollapsed ? 'app-shell__main--expanded' : ''}`}>
          <TopBar onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
          
          <div className="app-shell__content">
            <main className="app-shell__page">
              <Outlet />
            </main>
            
            {detailsPanel && <DetailsPanel />}
          </div>
        </div>
      </div>
    </ShellContext.Provider>
  );
}
