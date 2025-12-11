/**
 * Layout components barrel export
 */

export { AppShell, ShellContext, useShell } from './AppShell';
export { Sidebar } from './SidebarV2';
export { Sidebar as SidebarLegacy } from './Sidebar';
export { TopBar } from './TopBar';
export { DetailsPanel } from './DetailsPanel';
export type { DetailsPanelContent } from './DetailsPanel';

// Import styles
import './shell.css';
import './sidebar-v2.css';
