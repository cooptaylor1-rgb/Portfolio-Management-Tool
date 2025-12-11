/**
 * Equity Research Page
 * 
 * In-depth company research and analysis tools
 */

import { useState } from 'react';
import { Search, ExternalLink, TrendingUp, TrendingDown, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './pages.css';

interface CompanyData {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  pe: number;
  forwardPe: number;
  eps: number;
  dividend: number;
  beta: number;
  high52: number;
  low52: number;
  avgVolume: number;
  description: string;
  analysts: { buy: number; hold: number; sell: number; target: number };
  earnings: { quarter: string; actual: number; estimate: number }[];
}

// Sample company data
const SAMPLE_COMPANIES: CompanyData[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    price: 178.50,
    change: 2.35,
    changePercent: 1.33,
    marketCap: 2850000000000,
    pe: 28.5,
    forwardPe: 26.2,
    eps: 6.26,
    dividend: 0.50,
    beta: 1.28,
    high52: 199.62,
    low52: 143.90,
    avgVolume: 58000000,
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
    analysts: { buy: 28, hold: 8, sell: 2, target: 195 },
    earnings: [
      { quarter: 'Q1 24', actual: 2.18, estimate: 2.10 },
      { quarter: 'Q4 23', actual: 1.46, estimate: 1.39 },
      { quarter: 'Q3 23', actual: 1.26, estimate: 1.19 },
      { quarter: 'Q2 23', actual: 1.52, estimate: 1.43 },
    ],
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    price: 415.30,
    change: 5.20,
    changePercent: 1.27,
    marketCap: 3100000000000,
    pe: 36.8,
    forwardPe: 32.5,
    eps: 11.29,
    dividend: 0.72,
    beta: 0.89,
    high52: 420.82,
    low52: 275.37,
    avgVolume: 22000000,
    description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
    analysts: { buy: 35, hold: 5, sell: 0, target: 450 },
    earnings: [
      { quarter: 'Q2 24', actual: 2.93, estimate: 2.78 },
      { quarter: 'Q1 24', actual: 2.99, estimate: 2.65 },
      { quarter: 'Q4 23', actual: 2.69, estimate: 2.55 },
      { quarter: 'Q3 23', actual: 2.45, estimate: 2.23 },
    ],
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Technology',
    price: 875.35,
    change: 12.45,
    changePercent: 1.44,
    marketCap: 2160000000000,
    pe: 65.2,
    forwardPe: 42.8,
    eps: 13.42,
    dividend: 0.04,
    beta: 1.72,
    high52: 974.00,
    low52: 222.97,
    avgVolume: 42000000,
    description: 'NVIDIA Corporation provides graphics, computing and networking solutions worldwide. The company operates through Graphics and Compute & Networking segments.',
    analysts: { buy: 42, hold: 6, sell: 1, target: 950 },
    earnings: [
      { quarter: 'Q4 24', actual: 5.16, estimate: 4.60 },
      { quarter: 'Q3 24', actual: 4.02, estimate: 3.37 },
      { quarter: 'Q2 24', actual: 2.70, estimate: 2.09 },
      { quarter: 'Q1 24', actual: 1.09, estimate: 0.92 },
    ],
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Technology',
    price: 142.85,
    change: 1.92,
    changePercent: 1.36,
    marketCap: 1780000000000,
    pe: 24.6,
    forwardPe: 21.3,
    eps: 5.80,
    dividend: 0.20,
    beta: 1.05,
    high52: 155.20,
    low52: 102.21,
    avgVolume: 28000000,
    description: 'Alphabet Inc. provides online advertising services in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
    analysts: { buy: 38, hold: 7, sell: 0, target: 165 },
    earnings: [
      { quarter: 'Q1 24', actual: 1.89, estimate: 1.51 },
      { quarter: 'Q4 23', actual: 1.64, estimate: 1.59 },
      { quarter: 'Q3 23', actual: 1.55, estimate: 1.45 },
      { quarter: 'Q2 23', actual: 1.44, estimate: 1.34 },
    ],
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    sector: 'Consumer Cyclical',
    price: 186.40,
    change: 3.15,
    changePercent: 1.72,
    marketCap: 1950000000000,
    pe: 58.2,
    forwardPe: 38.5,
    eps: 3.20,
    dividend: 0,
    beta: 1.16,
    high52: 191.70,
    low52: 118.35,
    avgVolume: 45000000,
    description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions through online and physical stores in North America and internationally.',
    analysts: { buy: 45, hold: 4, sell: 0, target: 210 },
    earnings: [
      { quarter: 'Q1 24', actual: 0.98, estimate: 0.83 },
      { quarter: 'Q4 23', actual: 1.00, estimate: 0.80 },
      { quarter: 'Q3 23', actual: 0.94, estimate: 0.58 },
      { quarter: 'Q2 23', actual: 0.65, estimate: 0.35 },
    ],
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    sector: 'Technology',
    price: 505.75,
    change: 8.30,
    changePercent: 1.67,
    marketCap: 1290000000000,
    pe: 28.4,
    forwardPe: 22.8,
    eps: 17.81,
    dividend: 0.50,
    beta: 1.24,
    high52: 531.49,
    low52: 274.38,
    avgVolume: 15000000,
    description: 'Meta Platforms, Inc. develops products that enable people to connect and share with friends and family through mobile devices, personal computers, and other surfaces worldwide.',
    analysts: { buy: 40, hold: 8, sell: 1, target: 550 },
    earnings: [
      { quarter: 'Q1 24', actual: 4.71, estimate: 4.32 },
      { quarter: 'Q4 23', actual: 5.33, estimate: 4.96 },
      { quarter: 'Q3 23', actual: 4.39, estimate: 3.63 },
      { quarter: 'Q2 23', actual: 2.98, estimate: 2.91 },
    ],
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'Consumer Cyclical',
    price: 245.80,
    change: -4.20,
    changePercent: -1.68,
    marketCap: 782000000000,
    pe: 72.5,
    forwardPe: 58.2,
    eps: 3.39,
    dividend: 0,
    beta: 2.08,
    high52: 299.29,
    low52: 152.37,
    avgVolume: 98000000,
    description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems worldwide.',
    analysts: { buy: 18, hold: 22, sell: 8, target: 225 },
    earnings: [
      { quarter: 'Q1 24', actual: 0.45, estimate: 0.52 },
      { quarter: 'Q4 23', actual: 0.71, estimate: 0.74 },
      { quarter: 'Q3 23', actual: 0.66, estimate: 0.73 },
      { quarter: 'Q2 23', actual: 0.91, estimate: 0.82 },
    ],
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'Financial Services',
    price: 198.50,
    change: 2.80,
    changePercent: 1.43,
    marketCap: 570000000000,
    pe: 11.8,
    forwardPe: 10.5,
    eps: 16.82,
    dividend: 4.60,
    beta: 1.12,
    high52: 205.88,
    low52: 135.19,
    avgVolume: 9500000,
    description: 'JPMorgan Chase & Co. operates as a financial services company worldwide. It operates through four segments: Consumer & Community Banking, Corporate & Investment Bank, Commercial Banking, and Asset & Wealth Management.',
    analysts: { buy: 15, hold: 10, sell: 2, target: 215 },
    earnings: [
      { quarter: 'Q1 24', actual: 4.44, estimate: 4.17 },
      { quarter: 'Q4 23', actual: 3.97, estimate: 3.65 },
      { quarter: 'Q3 23', actual: 4.33, estimate: 3.96 },
      { quarter: 'Q2 23', actual: 4.75, estimate: 4.10 },
    ],
  },
];

export default function EquityResearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(SAMPLE_COMPANIES[0]);
  const [recentSearches] = useState(['NVDA', 'GOOGL', 'AMZN', 'META']);

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    
    const searchLower = term.toLowerCase().trim();
    
    // First try exact symbol match
    let company = SAMPLE_COMPANIES.find(c => c.symbol.toLowerCase() === searchLower);
    
    // If not found, try partial symbol match
    if (!company) {
      company = SAMPLE_COMPANIES.find(c => c.symbol.toLowerCase().includes(searchLower));
    }
    
    // If still not found, try company name match
    if (!company) {
      company = SAMPLE_COMPANIES.find(c => c.name.toLowerCase().includes(searchLower));
    }
    
    if (company) {
      setSelectedCompany(company);
      setSearchTerm(''); // Clear search after finding
    } else {
      // Could show a "not found" message here
      alert(`Company "${term}" not found. Try: AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA, or JPM`);
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Equity Research</h1>
          <p className="page__subtitle">In-depth company analysis and fundamentals</p>
        </div>
      </div>

      {/* Search */}
      <div className="research-search">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by ticker or company name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch(searchTerm)}
          />
          <button className="btn btn--primary" onClick={() => handleSearch(searchTerm)}>
            Search
          </button>
        </div>
        <div className="recent-searches">
          <span>Recent:</span>
          {recentSearches.map(symbol => (
            <button key={symbol} className="recent-btn" onClick={() => handleSearch(symbol)}>
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {selectedCompany && (
        <div className="research-content">
          {/* Company Header */}
          <section className="card company-header-card">
            <div className="company-header">
              <div className="company-info">
                <div className="company-title">
                  <h2>{selectedCompany.symbol}</h2>
                  <span className="company-name">{selectedCompany.name}</span>
                  <a 
                    href={`https://finance.yahoo.com/quote/${selectedCompany.symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <span className="company-sector">
                  <Building2 size={14} />
                  {selectedCompany.sector}
                </span>
              </div>
              <div className="company-price">
                <span className="price">${selectedCompany.price.toFixed(2)}</span>
                <span className={`change ${selectedCompany.change >= 0 ? 'positive' : 'negative'}`}>
                  {selectedCompany.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {selectedCompany.change >= 0 ? '+' : ''}{selectedCompany.change.toFixed(2)} ({selectedCompany.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </section>

          <div className="research-grid">
            {/* Key Stats */}
            <section className="card">
              <div className="card__header">
                <h3 className="card__title">Key Statistics</h3>
              </div>
              <div className="card__body">
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Market Cap</span>
                    <span className="stat-value">${(selectedCompany.marketCap / 1e12).toFixed(2)}T</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">P/E Ratio</span>
                    <span className="stat-value">{selectedCompany.pe.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Forward P/E</span>
                    <span className="stat-value">{selectedCompany.forwardPe.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">EPS (TTM)</span>
                    <span className="stat-value">${selectedCompany.eps.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Dividend Yield</span>
                    <span className="stat-value">{selectedCompany.dividend.toFixed(2)}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Beta</span>
                    <span className="stat-value">{selectedCompany.beta.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">52W High</span>
                    <span className="stat-value">${selectedCompany.high52.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">52W Low</span>
                    <span className="stat-value">${selectedCompany.low52.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Avg Volume</span>
                    <span className="stat-value">{(selectedCompany.avgVolume / 1e6).toFixed(1)}M</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Analyst Ratings */}
            <section className="card">
              <div className="card__header">
                <h3 className="card__title">Analyst Ratings</h3>
              </div>
              <div className="card__body">
                <div className="analyst-ratings">
                  <div className="rating-bar">
                    <div 
                      className="rating-segment buy"
                      style={{ width: `${selectedCompany.analysts.buy / (selectedCompany.analysts.buy + selectedCompany.analysts.hold + selectedCompany.analysts.sell) * 100}%` }}
                    >
                      {selectedCompany.analysts.buy} Buy
                    </div>
                    <div 
                      className="rating-segment hold"
                      style={{ width: `${selectedCompany.analysts.hold / (selectedCompany.analysts.buy + selectedCompany.analysts.hold + selectedCompany.analysts.sell) * 100}%` }}
                    >
                      {selectedCompany.analysts.hold} Hold
                    </div>
                    {selectedCompany.analysts.sell > 0 && (
                      <div 
                        className="rating-segment sell"
                        style={{ width: `${selectedCompany.analysts.sell / (selectedCompany.analysts.buy + selectedCompany.analysts.hold + selectedCompany.analysts.sell) * 100}%` }}
                      >
                        {selectedCompany.analysts.sell} Sell
                      </div>
                    )}
                  </div>
                  <div className="price-target">
                    <span className="target-label">Average Price Target</span>
                    <span className="target-value">${selectedCompany.analysts.target}</span>
                    <span className={`target-upside ${selectedCompany.analysts.target > selectedCompany.price ? 'positive' : 'negative'}`}>
                      ({((selectedCompany.analysts.target - selectedCompany.price) / selectedCompany.price * 100).toFixed(1)}% upside)
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Earnings History */}
            <section className="card">
              <div className="card__header">
                <h3 className="card__title">Earnings History</h3>
              </div>
              <div className="card__body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={selectedCompany.earnings}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                    <XAxis dataKey="quarter" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} />
                    <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
                    />
                    <Bar dataKey="estimate" fill="#30363d" name="Estimate" />
                    <Bar dataKey="actual" fill="#58a6ff" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="earnings-legend">
                  <span><span className="legend-dot" style={{ backgroundColor: '#30363d' }} /> Estimate</span>
                  <span><span className="legend-dot" style={{ backgroundColor: '#58a6ff' }} /> Actual</span>
                </div>
              </div>
            </section>

            {/* Company Description */}
            <section className="card description-card">
              <div className="card__header">
                <h3 className="card__title">About {selectedCompany.name}</h3>
              </div>
              <div className="card__body">
                <p className="company-description">{selectedCompany.description}</p>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
