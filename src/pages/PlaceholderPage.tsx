/**
 * Placeholder Page Component
 * 
 * Used for pages that are being migrated from the old UI.
 * Shows the page name and a message about coming features.
 */

import { ReactNode } from 'react';
import { LucideIcon, Construction } from 'lucide-react';
import './pages.css';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: ReactNode;
}

export function PlaceholderPage({ 
  title, 
  description = "This page is being redesigned with enhanced features.",
  icon: Icon = Construction,
  children 
}: PlaceholderPageProps) {
  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">{title}</h1>
          <p className="page__subtitle">{description}</p>
        </div>
      </div>
      
      {children || (
        <div className="placeholder-page">
          <Icon className="placeholder-page__icon" size={64} />
          <h2 className="placeholder-page__title">Coming Soon</h2>
          <p className="placeholder-page__description">
            This section is being upgraded to provide a better experience with
            enhanced data visualization and improved workflows.
          </p>
        </div>
      )}
    </div>
  );
}

export default PlaceholderPage;
