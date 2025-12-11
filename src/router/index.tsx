/**
 * Router Configuration
 * 
 * Centralized route definitions with lazy loading
 * for optimal bundle splitting.
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '../layouts';
import { LoadingOverlay } from '../components/ui';

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const PortfolioOverviewPage = lazy(() => import('../pages/PortfolioOverviewPage'));
const PositionsPage = lazy(() => import('../pages/PositionsPage'));
const TransactionsPage = lazy(() => import('../pages/TransactionsPage'));
const PerformancePage = lazy(() => import('../pages/PerformancePage'));
const RiskPage = lazy(() => import('../pages/RiskPage'));
const ScenariosPage = lazy(() => import('../pages/ScenariosPage'));
const CorrelationPage = lazy(() => import('../pages/CorrelationPage'));
const EquityResearchPage = lazy(() => import('../pages/EquityResearchPage'));
const ThemesPage = lazy(() => import('../pages/ThemesPage'));
const NotesPage = lazy(() => import('../pages/NotesPage'));
const MacroPage = lazy(() => import('../pages/MacroPage'));
const TradeJournalPage = lazy(() => import('../pages/TradeJournalPage'));
const PositionSizingPage = lazy(() => import('../pages/PositionSizingPage'));
const DividendsPage = lazy(() => import('../pages/DividendsPage'));
const WatchlistPage = lazy(() => import('../pages/WatchlistPageV3'));
const AlertsPage = lazy(() => import('../pages/AlertsPage'));
const CollaboratePage = lazy(() => import('../pages/CollaboratePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

// Page wrapper with suspense
function PageWrapper() {
  return (
    <Suspense fallback={<LoadingOverlay message="Loading..." />}>
      <Outlet />
    </Suspense>
  );
}

// Route configuration
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        element: <PageWrapper />,
        children: [
          // Dashboard
          {
            index: true,
            element: <DashboardPage />,
          },
          
          // Portfolios
          {
            path: 'portfolios',
            children: [
              {
                index: true,
                element: <PortfolioOverviewPage />,
              },
              {
                path: 'positions',
                element: <PositionsPage />,
              },
              {
                path: 'transactions',
                element: <TransactionsPage />,
              },
            ],
          },
          
          // Analytics
          {
            path: 'analytics',
            children: [
              {
                index: true,
                element: <Navigate to="performance" replace />,
              },
              {
                path: 'performance',
                element: <PerformancePage />,
              },
              {
                path: 'risk',
                element: <RiskPage />,
              },
              {
                path: 'scenarios',
                element: <ScenariosPage />,
              },
              {
                path: 'correlation',
                element: <CorrelationPage />,
              },
            ],
          },
          
          // Research
          {
            path: 'research',
            children: [
              {
                index: true,
                element: <Navigate to="equity" replace />,
              },
              {
                path: 'equity',
                element: <EquityResearchPage />,
              },
              {
                path: 'themes',
                element: <ThemesPage />,
              },
              {
                path: 'notes',
                element: <NotesPage />,
              },
              {
                path: 'macro',
                element: <MacroPage />,
              },
            ],
          },
          
          // Trading
          {
            path: 'trading',
            children: [
              {
                index: true,
                element: <Navigate to="journal" replace />,
              },
              {
                path: 'journal',
                element: <TradeJournalPage />,
              },
              {
                path: 'sizing',
                element: <PositionSizingPage />,
              },
              {
                path: 'dividends',
                element: <DividendsPage />,
              },
            ],
          },
          
          // Standalone pages
          {
            path: 'watchlist',
            element: <WatchlistPage />,
          },
          {
            path: 'alerts',
            element: <AlertsPage />,
          },
          {
            path: 'collaborate',
            element: <CollaboratePage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
]);

export default router;
