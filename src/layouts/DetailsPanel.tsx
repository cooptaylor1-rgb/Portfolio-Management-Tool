/**
 * DetailsPanel - Contextual details sidebar
 * 
 * A slide-in panel on the right side that displays
 * detailed information about selected entities
 * (positions, transactions, alerts, etc.)
 */

import { ReactNode } from 'react';
import { X, ChevronRight, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { useShell } from './AppShell';

interface Position {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  value: number;
  costBasis: number;
  gain: number;
  gainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weight: number;
  sector?: string;
}

interface Transaction {
  id: string;
  date: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND';
  quantity: number;
  price: number;
  total: number;
  notes?: string;
}

type DetailsPanelContent = 
  | { type: 'position'; data: Position }
  | { type: 'transaction'; data: Transaction }
  | { type: 'custom'; title: string; content: ReactNode };

export function DetailsPanel() {
  const { detailsPanel, closeDetailsPanel } = useShell();

  if (!detailsPanel) return null;

  return (
    <aside className="details-panel" aria-label="Details panel">
      <div className="details-panel__header">
        <h2 className="details-panel__title">
          {getPanelTitle(detailsPanel)}
        </h2>
        <button 
          className="details-panel__close"
          onClick={closeDetailsPanel}
          aria-label="Close details"
        >
          <X size={18} />
        </button>
      </div>

      <div className="details-panel__content">
        {renderPanelContent(detailsPanel)}
      </div>
    </aside>
  );
}

function getPanelTitle(panel: DetailsPanelContent): string {
  switch (panel.type) {
    case 'position':
      return panel.data.symbol;
    case 'transaction':
      return `Transaction ${panel.data.id}`;
    case 'custom':
      return panel.title;
    default:
      return 'Details';
  }
}

function renderPanelContent(panel: DetailsPanelContent): ReactNode {
  switch (panel.type) {
    case 'position':
      return <PositionDetails position={panel.data} />;
    case 'transaction':
      return <TransactionDetails transaction={panel.data} />;
    case 'custom':
      return panel.content;
    default:
      return null;
  }
}

function PositionDetails({ position }: { position: Position }) {
  const isPositive = position.gain >= 0;
  const isDayPositive = position.dayChange >= 0;

  return (
    <div className="position-details">
      {/* Header with company info */}
      <div className="position-details__header">
        <div className="position-details__symbol-large">{position.symbol}</div>
        <div className="position-details__name">{position.name}</div>
        {position.sector && (
          <span className="position-details__sector">{position.sector}</span>
        )}
      </div>

      {/* Price and change */}
      <div className="position-details__price-section">
        <div className="position-details__price">
          ${position.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`position-details__change ${isDayPositive ? 'positive' : 'negative'}`}>
          {isDayPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {isDayPositive ? '+' : ''}{position.dayChange.toFixed(2)} ({position.dayChangePercent.toFixed(2)}%)
        </div>
      </div>

      {/* Key metrics grid */}
      <div className="position-details__metrics">
        <div className="position-details__metric">
          <span className="position-details__metric-label">Market Value</span>
          <span className="position-details__metric-value">
            ${position.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="position-details__metric">
          <span className="position-details__metric-label">Cost Basis</span>
          <span className="position-details__metric-value">
            ${position.costBasis.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="position-details__metric">
          <span className="position-details__metric-label">Shares</span>
          <span className="position-details__metric-value">
            {position.quantity.toLocaleString()}
          </span>
        </div>
        <div className="position-details__metric">
          <span className="position-details__metric-label">Weight</span>
          <span className="position-details__metric-value">
            {position.weight.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* P&L Section */}
      <div className="position-details__pnl">
        <div className="position-details__pnl-header">
          Total Return
        </div>
        <div className={`position-details__pnl-value ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{position.gainPercent.toFixed(2)}%
        </div>
        <div className={`position-details__pnl-amount ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}${Math.abs(position.gain).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="position-details__actions">
        <button className="position-details__action position-details__action--primary">
          Add to Position
        </button>
        <button className="position-details__action">
          Reduce Position
        </button>
        <button className="position-details__action">
          Set Alert
        </button>
      </div>

      {/* Links */}
      <div className="position-details__links">
        <a href="#" className="position-details__link">
          View Research <ChevronRight size={14} />
        </a>
        <a href="#" className="position-details__link">
          Transaction History <ChevronRight size={14} />
        </a>
        <a 
          href={`https://finance.yahoo.com/quote/${position.symbol}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="position-details__link"
        >
          Yahoo Finance <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

function TransactionDetails({ transaction }: { transaction: Transaction }) {
  const typeColors: Record<string, string> = {
    BUY: 'var(--color-success)',
    SELL: 'var(--color-danger)',
    DIVIDEND: 'var(--color-info)',
  };

  return (
    <div className="transaction-details">
      <div className="transaction-details__header">
        <span 
          className="transaction-details__type"
          style={{ color: typeColors[transaction.type] }}
        >
          {transaction.type}
        </span>
        <span className="transaction-details__symbol">{transaction.symbol}</span>
      </div>

      <div className="transaction-details__metrics">
        <div className="transaction-details__metric">
          <span className="transaction-details__metric-label">Date</span>
          <span className="transaction-details__metric-value">
            {new Date(transaction.date).toLocaleDateString()}
          </span>
        </div>
        <div className="transaction-details__metric">
          <span className="transaction-details__metric-label">Quantity</span>
          <span className="transaction-details__metric-value">
            {transaction.quantity.toLocaleString()}
          </span>
        </div>
        <div className="transaction-details__metric">
          <span className="transaction-details__metric-label">Price</span>
          <span className="transaction-details__metric-value">
            ${transaction.price.toFixed(2)}
          </span>
        </div>
        <div className="transaction-details__metric">
          <span className="transaction-details__metric-label">Total</span>
          <span className="transaction-details__metric-value">
            ${transaction.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {transaction.notes && (
        <div className="transaction-details__notes">
          <div className="transaction-details__notes-label">Notes</div>
          <div className="transaction-details__notes-content">{transaction.notes}</div>
        </div>
      )}

      <div className="transaction-details__actions">
        <button className="transaction-details__action">
          Edit Transaction
        </button>
        <button className="transaction-details__action transaction-details__action--danger">
          Delete Transaction
        </button>
      </div>
    </div>
  );
}

export type { DetailsPanelContent };
