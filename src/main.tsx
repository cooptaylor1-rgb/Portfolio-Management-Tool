import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { PortfolioProvider } from './contexts/PortfolioContext.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'

// Import layout and component styles
import './layouts/index'
import './components/ui/index'
import './pages/index'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <PortfolioProvider>
          <RouterProvider router={router} />
        </PortfolioProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
