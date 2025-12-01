import React, { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, DollarSign, BarChart3, AlertTriangle, Bell, Newspaper, Eye, HelpCircle } from 'lucide-react';
import { Investment } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  investments: Investment[];
  onNavigate: (tab: string) => void;
  onInvestmentSelect: (investment: Investment) => void;
}

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'portfolio' | 'action';
  keywords?: string[];
}

export function CommandPalette({ isOpen, onClose, investments, onNavigate, onInvestmentSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = useMemo(() => [
    // Navigation commands
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      icon: <BarChart3 size={18} />,
      action: () => { onNavigate('dashboard'); onClose(); },
      category: 'navigation',
      keywords: ['home', 'overview', 'summary', 'gd']
    },
    {
      id: 'nav-analytics',
      label: 'Go to Analytics',
      icon: <TrendingUp size={18} />,
      action: () => { onNavigate('analytics'); onClose(); },
      category: 'navigation',
      keywords: ['performance', 'charts', 'ga']
    },
    {
      id: 'nav-risk',
      label: 'Go to Risk Analysis',
      icon: <AlertTriangle size={18} />,
      action: () => { onNavigate('risk'); onClose(); },
      category: 'navigation',
      keywords: ['volatility', 'var', 'beta', 'gr']
    },
    {
      id: 'nav-watchlist',
      label: 'Go to Watchlist',
      icon: <Eye size={18} />,
      action: () => { onNavigate('watchlist'); onClose(); },
      category: 'navigation',
      keywords: ['watch', 'monitor', 'gw']
    },
    {
      id: 'nav-news',
      label: 'Go to News Feed',
      icon: <Newspaper size={18} />,
      action: () => { onNavigate('news'); onClose(); },
      category: 'navigation',
      keywords: ['articles', 'updates', 'gn']
    },
    {
      id: 'nav-alerts',
      label: 'View Alerts',
      icon: <Bell size={18} />,
      action: () => { onNavigate('dashboard'); onClose(); },
      category: 'navigation',
      keywords: ['notifications', 'warnings']
    },
    // Portfolio commands
    ...investments.map(inv => ({
      id: `inv-${inv.id}`,
      label: `${inv.symbol} - ${inv.name}`,
      icon: <DollarSign size={18} />,
      action: () => { onInvestmentSelect(inv); onClose(); },
      category: 'portfolio' as const,
      keywords: [inv.symbol.toLowerCase(), inv.name.toLowerCase(), inv.type.toLowerCase()]
    })),
    // Action commands
    {
      id: 'action-help',
      label: 'Open Help',
      icon: <HelpCircle size={18} />,
      action: () => { /* Will be handled by parent */ onClose(); },
      category: 'action',
      keywords: ['guide', 'tutorial', 'documentation']
    }
  ], [investments, onNavigate, onInvestmentSelect, onClose]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    
    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.keywords?.some(kw => kw.includes(lowerQuery))
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => (i + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const groupedCommands = {
    navigation: filteredCommands.filter(c => c.category === 'navigation'),
    portfolio: filteredCommands.filter(c => c.category === 'portfolio'),
    action: filteredCommands.filter(c => c.category === 'action')
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-search">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search commands, portfolios, or type to filter..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="command-palette-kbd">ESC</kbd>
        </div>

        <div className="command-palette-results">
          {groupedCommands.navigation.length > 0 && (
            <div className="command-group">
              <div className="command-group-title">Navigation</div>
              {groupedCommands.navigation.map((cmd) => {
                const globalIndex = filteredCommands.indexOf(cmd);
                return (
                  <div
                    key={cmd.id}
                    className={`command-item ${globalIndex === selectedIndex ? 'selected' : ''}`}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <span className="command-icon">{cmd.icon}</span>
                    <span className="command-label">{cmd.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {groupedCommands.portfolio.length > 0 && (
            <div className="command-group">
              <div className="command-group-title">Portfolios ({groupedCommands.portfolio.length})</div>
              {groupedCommands.portfolio.slice(0, 8).map((cmd) => {
                const globalIndex = filteredCommands.indexOf(cmd);
                return (
                  <div
                    key={cmd.id}
                    className={`command-item ${globalIndex === selectedIndex ? 'selected' : ''}`}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <span className="command-icon">{cmd.icon}</span>
                    <span className="command-label">{cmd.label}</span>
                  </div>
                );
              })}
              {groupedCommands.portfolio.length > 8 && (
                <div className="command-item-hint">
                  + {groupedCommands.portfolio.length - 8} more...
                </div>
              )}
            </div>
          )}

          {groupedCommands.action.length > 0 && (
            <div className="command-group">
              <div className="command-group-title">Actions</div>
              {groupedCommands.action.map((cmd) => {
                const globalIndex = filteredCommands.indexOf(cmd);
                return (
                  <div
                    key={cmd.id}
                    className={`command-item ${globalIndex === selectedIndex ? 'selected' : ''}`}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <span className="command-icon">{cmd.icon}</span>
                    <span className="command-label">{cmd.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {filteredCommands.length === 0 && (
            <div className="command-empty">
              No commands found for "{query}"
            </div>
          )}
        </div>

        <div className="command-palette-footer">
          <div className="command-hints">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
