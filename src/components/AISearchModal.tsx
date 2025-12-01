import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, TrendingUp, X, Loader, AlertCircle } from 'lucide-react';
import { Investment, PortfolioStats } from '../types';
import { searchWithAI, isAISearchAvailable } from '../services/aiSearch';

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  investments: Investment[];
  stats: PortfolioStats;
  onInvestmentSelect?: (investment: Investment) => void;
}

interface SearchResult {
  answer: string;
  relevantInvestments: Investment[];
  suggestions: string[];
  confidence: number;
}

export function AISearchModal({ isOpen, onClose, investments, stats, onInvestmentSelect }: AISearchModalProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const aiAvailable = isAISearchAvailable();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResult(null);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError('');

    try {
      const searchResult = await searchWithAI({
        investments,
        stats,
        query: searchQuery
      });

      setResult(searchResult);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleInvestmentClick = (investment: Investment) => {
    if (onInvestmentSelect) {
      onInvestmentSelect(investment);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ai-search-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-search-header">
          <div className="ai-search-title">
            <Sparkles size={20} />
            <h3>AI Portfolio Search</h3>
            {!aiAvailable && (
              <span className="ai-badge ai-badge-fallback">Keyword Search</span>
            )}
            {aiAvailable && (
              <span className="ai-badge ai-badge-powered">Powered by OpenAI</span>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="ai-search-input-wrapper">
          <Search size={18} />
          <input
            ref={inputRef}
            type="text"
            className="ai-search-input"
            placeholder="Ask anything about your portfolio... (e.g., 'What are my best investments?')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSearching}
          />
          {isSearching && <Loader size={18} className="ai-search-loader" />}
        </div>

        {/* Example Questions */}
        {!result && !error && (
          <div className="ai-search-examples">
            <p className="ai-search-examples-title">Try asking:</p>
            <div className="ai-search-examples-list">
              <button onClick={() => handleSuggestionClick('What are my best performing investments?')}>
                What are my best performing investments?
              </button>
              <button onClick={() => handleSuggestionClick('How risky is my portfolio?')}>
                How risky is my portfolio?
              </button>
              <button onClick={() => handleSuggestionClick('Should I diversify more?')}>
                Should I diversify more?
              </button>
              <button onClick={() => handleSuggestionClick('What is my total portfolio value?')}>
                What is my total portfolio value?
              </button>
              <button onClick={() => handleSuggestionClick('Which investments are losing money?')}>
                Which investments are losing money?
              </button>
              <button onClick={() => handleSuggestionClick('Show me my tech stocks')}>
                Show me my tech stocks
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="ai-search-error">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="ai-search-results">
            {/* Answer */}
            <div className="ai-search-answer">
              <div className="ai-search-answer-header">
                <Sparkles size={16} />
                <span>Answer</span>
                {result.confidence < 0.8 && (
                  <span className="ai-confidence-badge">Low Confidence</span>
                )}
              </div>
              <p className="ai-search-answer-text">{result.answer}</p>
            </div>

            {/* Relevant Investments */}
            {result.relevantInvestments.length > 0 && (
              <div className="ai-search-investments">
                <h4>
                  <TrendingUp size={16} />
                  Relevant Investments
                </h4>
                <div className="ai-search-investments-list">
                  {result.relevantInvestments.map(inv => {
                    const gainLoss = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
                    const isPositive = gainLoss >= 0;

                    return (
                      <button
                        key={inv.id}
                        className="ai-search-investment-item"
                        onClick={() => handleInvestmentClick(inv)}
                      >
                        <div className="ai-search-investment-info">
                          <strong>{inv.name}</strong>
                          <span className="ai-search-investment-symbol">{inv.symbol}</span>
                        </div>
                        <div className={`ai-search-investment-gain ${isPositive ? 'positive' : 'negative'}`}>
                          {isPositive ? '+' : ''}{gainLoss.toFixed(2)}%
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="ai-search-suggestions">
                <p className="ai-search-suggestions-title">Related questions:</p>
                <div className="ai-search-suggestions-list">
                  {result.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={isSearching}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="ai-search-footer">
          <p>
            {aiAvailable 
              ? 'AI provides insights based on your portfolio data. Not financial advice.' 
              : 'Configure OpenAI API key in .env for enhanced AI search capabilities.'}
          </p>
        </div>
      </div>
    </div>
  );
}
