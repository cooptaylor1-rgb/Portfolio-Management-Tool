/**
 * Macro Page
 * 
 * Economic indicators and macro trends dashboard
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Calendar, Info } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import './pages.css';

interface Indicator {
  id: string;
  name: string;
  category: 'growth' | 'inflation' | 'employment' | 'rates' | 'housing';
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  frequency: string;
  description: string;
  history: { date: string; value: number }[];
}

const MACRO_INDICATORS: Indicator[] = [
  {
    id: 'gdp',
    name: 'GDP Growth (QoQ)',
    category: 'growth',
    value: 3.2,
    previousValue: 4.9,
    unit: '%',
    trend: 'down',
    lastUpdated: '2024-01-25',
    frequency: 'Quarterly',
    description: 'Real gross domestic product growth rate',
    history: [
      { date: 'Q1 23', value: 2.0 },
      { date: 'Q2 23', value: 2.1 },
      { date: 'Q3 23', value: 4.9 },
      { date: 'Q4 23', value: 3.2 },
    ],
  },
  {
    id: 'cpi',
    name: 'CPI (YoY)',
    category: 'inflation',
    value: 3.1,
    previousValue: 3.4,
    unit: '%',
    trend: 'down',
    lastUpdated: '2024-02-13',
    frequency: 'Monthly',
    description: 'Consumer Price Index year-over-year change',
    history: [
      { date: 'Sep', value: 3.7 },
      { date: 'Oct', value: 3.2 },
      { date: 'Nov', value: 3.1 },
      { date: 'Dec', value: 3.4 },
      { date: 'Jan', value: 3.1 },
    ],
  },
  {
    id: 'pce',
    name: 'Core PCE (YoY)',
    category: 'inflation',
    value: 2.8,
    previousValue: 2.9,
    unit: '%',
    trend: 'down',
    lastUpdated: '2024-01-26',
    frequency: 'Monthly',
    description: 'Personal Consumption Expenditures excluding food and energy',
    history: [
      { date: 'Sep', value: 3.7 },
      { date: 'Oct', value: 3.4 },
      { date: 'Nov', value: 3.2 },
      { date: 'Dec', value: 2.9 },
      { date: 'Jan', value: 2.8 },
    ],
  },
  {
    id: 'unemployment',
    name: 'Unemployment Rate',
    category: 'employment',
    value: 3.7,
    previousValue: 3.7,
    unit: '%',
    trend: 'stable',
    lastUpdated: '2024-02-02',
    frequency: 'Monthly',
    description: 'U.S. unemployment rate',
    history: [
      { date: 'Sep', value: 3.8 },
      { date: 'Oct', value: 3.9 },
      { date: 'Nov', value: 3.7 },
      { date: 'Dec', value: 3.7 },
      { date: 'Jan', value: 3.7 },
    ],
  },
  {
    id: 'nfp',
    name: 'Non-Farm Payrolls',
    category: 'employment',
    value: 353,
    previousValue: 333,
    unit: 'K',
    trend: 'up',
    lastUpdated: '2024-02-02',
    frequency: 'Monthly',
    description: 'Monthly change in non-farm employment',
    history: [
      { date: 'Sep', value: 262 },
      { date: 'Oct', value: 165 },
      { date: 'Nov', value: 182 },
      { date: 'Dec', value: 333 },
      { date: 'Jan', value: 353 },
    ],
  },
  {
    id: 'fed-rate',
    name: 'Fed Funds Rate',
    category: 'rates',
    value: 5.50,
    previousValue: 5.50,
    unit: '%',
    trend: 'stable',
    lastUpdated: '2024-01-31',
    frequency: 'FOMC Meeting',
    description: 'Federal Reserve target rate upper bound',
    history: [
      { date: 'Jul 23', value: 5.50 },
      { date: 'Sep 23', value: 5.50 },
      { date: 'Nov 23', value: 5.50 },
      { date: 'Dec 23', value: 5.50 },
      { date: 'Jan 24', value: 5.50 },
    ],
  },
  {
    id: '10y-yield',
    name: '10Y Treasury Yield',
    category: 'rates',
    value: 4.28,
    previousValue: 3.95,
    unit: '%',
    trend: 'up',
    lastUpdated: '2024-02-23',
    frequency: 'Daily',
    description: '10-year Treasury note yield',
    history: [
      { date: 'Oct', value: 4.93 },
      { date: 'Nov', value: 4.33 },
      { date: 'Dec', value: 3.88 },
      { date: 'Jan', value: 3.95 },
      { date: 'Feb', value: 4.28 },
    ],
  },
  {
    id: 'housing-starts',
    name: 'Housing Starts',
    category: 'housing',
    value: 1.46,
    previousValue: 1.56,
    unit: 'M',
    trend: 'down',
    lastUpdated: '2024-02-16',
    frequency: 'Monthly',
    description: 'Annualized new residential construction starts',
    history: [
      { date: 'Sep', value: 1.36 },
      { date: 'Oct', value: 1.37 },
      { date: 'Nov', value: 1.56 },
      { date: 'Dec', value: 1.46 },
    ],
  },
];

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'growth', name: 'Growth' },
  { id: 'inflation', name: 'Inflation' },
  { id: 'employment', name: 'Employment' },
  { id: 'rates', name: 'Rates' },
  { id: 'housing', name: 'Housing' },
];

export default function MacroPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(MACRO_INDICATORS[0]);

  const filteredIndicators = selectedCategory === 'all' 
    ? MACRO_INDICATORS 
    : MACRO_INDICATORS.filter(i => i.category === selectedCategory);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} className="trend-up" />;
      case 'down': return <TrendingDown size={16} className="trend-down" />;
      default: return <Minus size={16} className="trend-stable" />;
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Macro Indicators</h1>
          <p className="page__subtitle">Economic data and market trends</p>
        </div>
        <button className="btn btn--secondary">
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </div>

      {/* Category Filter */}
      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="macro-layout">
        {/* Indicators Grid */}
        <section className="indicators-grid">
          {filteredIndicators.map(indicator => (
            <div
              key={indicator.id}
              className={`indicator-card ${selectedIndicator?.id === indicator.id ? 'selected' : ''}`}
              onClick={() => setSelectedIndicator(indicator)}
            >
              <div className="indicator-card__header">
                <span className="indicator-name">{indicator.name}</span>
                {getTrendIcon(indicator.trend)}
              </div>
              <div className="indicator-value">
                {indicator.value}{indicator.unit}
              </div>
              <div className="indicator-change">
                <span className={indicator.value > indicator.previousValue ? 'positive' : indicator.value < indicator.previousValue ? 'negative' : ''}>
                  {indicator.value > indicator.previousValue ? '+' : ''}
                  {(indicator.value - indicator.previousValue).toFixed(2)}{indicator.unit}
                </span>
                <span className="indicator-date">
                  <Calendar size={12} />
                  {indicator.lastUpdated}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Indicator Detail */}
        {selectedIndicator && (
          <section className="indicator-detail">
            <div className="card">
              <div className="card__header">
                <div>
                  <h2 className="card__title">{selectedIndicator.name}</h2>
                  <p className="indicator-frequency">{selectedIndicator.frequency} | Last: {selectedIndicator.lastUpdated}</p>
                </div>
              </div>
              <div className="card__body">
                <div className="indicator-stats">
                  <div className="stat-box">
                    <span className="stat-label">Current</span>
                    <span className="stat-value">{selectedIndicator.value}{selectedIndicator.unit}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Previous</span>
                    <span className="stat-value">{selectedIndicator.previousValue}{selectedIndicator.unit}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Change</span>
                    <span className={`stat-value ${selectedIndicator.value > selectedIndicator.previousValue ? 'positive' : selectedIndicator.value < selectedIndicator.previousValue ? 'negative' : ''}`}>
                      {selectedIndicator.value > selectedIndicator.previousValue ? '+' : ''}
                      {(selectedIndicator.value - selectedIndicator.previousValue).toFixed(2)}{selectedIndicator.unit}
                    </span>
                  </div>
                </div>

                <div className="indicator-chart">
                  <h4>Historical Trend</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={selectedIndicator.history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                      <XAxis dataKey="date" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} />
                      <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value}${selectedIndicator.unit}`, selectedIndicator.name]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#58a6ff"
                        fill="rgba(88, 166, 255, 0.2)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="indicator-description">
                  <Info size={16} />
                  <p>{selectedIndicator.description}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
