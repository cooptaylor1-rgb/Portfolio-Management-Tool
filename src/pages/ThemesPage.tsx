/**
 * Themes Page
 * 
 * Thematic investment research and trends
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, ExternalLink, Zap, Leaf, Brain, Shield, Heart, Factory, Cpu } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './pages.css';

interface Theme {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  trend: 'up' | 'down' | 'neutral';
  ytdReturn: number;
  relatedStocks: string[];
  keyDrivers: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  timeHorizon: string;
  performance: { month: string; value: number }[];
}

const THEMES: Theme[] = [
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    icon: <Brain size={24} />,
    description: 'Companies developing and deploying AI/ML technologies including generative AI, enterprise AI, and AI infrastructure.',
    trend: 'up',
    ytdReturn: 45.2,
    relatedStocks: ['NVDA', 'MSFT', 'GOOGL', 'AMD', 'PLTR'],
    keyDrivers: ['GenAI adoption', 'Enterprise automation', 'GPU demand'],
    riskLevel: 'High',
    timeHorizon: '5-10 years',
    performance: [
      { month: 'Jan', value: 100 },
      { month: 'Feb', value: 108 },
      { month: 'Mar', value: 115 },
      { month: 'Apr', value: 122 },
      { month: 'May', value: 135 },
      { month: 'Jun', value: 145 },
    ],
  },
  {
    id: 'cleanenergy',
    name: 'Clean Energy',
    icon: <Leaf size={24} />,
    description: 'Renewable energy, energy storage, and clean technology companies driving the transition to sustainable energy.',
    trend: 'up',
    ytdReturn: 12.8,
    relatedStocks: ['ENPH', 'SEDG', 'FSLR', 'NEE', 'PLUG'],
    keyDrivers: ['IRA incentives', 'Grid modernization', 'EV adoption'],
    riskLevel: 'Medium',
    timeHorizon: '10+ years',
    performance: [
      { month: 'Jan', value: 100 },
      { month: 'Feb', value: 95 },
      { month: 'Mar', value: 102 },
      { month: 'Apr', value: 98 },
      { month: 'May', value: 108 },
      { month: 'Jun', value: 113 },
    ],
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    icon: <Shield size={24} />,
    description: 'Companies providing cybersecurity solutions including cloud security, endpoint protection, and identity management.',
    trend: 'up',
    ytdReturn: 18.5,
    relatedStocks: ['CRWD', 'PANW', 'ZS', 'FTNT', 'S'],
    keyDrivers: ['Rising threats', 'Zero trust adoption', 'Cloud migration'],
    riskLevel: 'Medium',
    timeHorizon: '3-5 years',
    performance: [
      { month: 'Jan', value: 100 },
      { month: 'Feb', value: 105 },
      { month: 'Mar', value: 108 },
      { month: 'Apr', value: 112 },
      { month: 'May', value: 115 },
      { month: 'Jun', value: 118 },
    ],
  },
  {
    id: 'semiconductor',
    name: 'Semiconductor',
    icon: <Cpu size={24} />,
    description: 'Chip manufacturers and semiconductor equipment companies powering the digital economy.',
    trend: 'up',
    ytdReturn: 38.7,
    relatedStocks: ['NVDA', 'AMD', 'ASML', 'TSM', 'AVGO'],
    keyDrivers: ['AI compute', 'Data center growth', 'Supply chain reshoring'],
    riskLevel: 'High',
    timeHorizon: '5-7 years',
    performance: [
      { month: 'Jan', value: 100 },
      { month: 'Feb', value: 110 },
      { month: 'Mar', value: 118 },
      { month: 'Apr', value: 125 },
      { month: 'May', value: 132 },
      { month: 'Jun', value: 139 },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare Innovation',
    icon: <Heart size={24} />,
    description: 'Biotech, medtech, and digital health companies transforming patient care and drug development.',
    trend: 'neutral',
    ytdReturn: 5.2,
    relatedStocks: ['LLY', 'NVO', 'ISRG', 'DXCM', 'VEEV'],
    keyDrivers: ['GLP-1 drugs', 'AI diagnostics', 'Telehealth'],
    riskLevel: 'High',
    timeHorizon: '5-10 years',
    performance: [
      { month: 'Jan', value: 100 },
      { month: 'Feb', value: 98 },
      { month: 'Mar', value: 102 },
      { month: 'Apr', value: 100 },
      { month: 'May', value: 103 },
      { month: 'Jun', value: 105 },
    ],
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    icon: <Factory size={24} />,
    description: 'Companies benefiting from infrastructure spending including construction, materials, and industrial equipment.',
    trend: 'up',
    ytdReturn: 15.3,
    relatedStocks: ['CAT', 'DE', 'VMC', 'MLM', 'URI'],
    keyDrivers: ['IIJA spending', 'Reshoring', 'Grid investment'],
    riskLevel: 'Low',
    timeHorizon: '3-5 years',
    performance: [
      { month: 'Jan', value: 100 },
      { month: 'Feb', value: 103 },
      { month: 'Mar', value: 107 },
      { month: 'Apr', value: 110 },
      { month: 'May', value: 113 },
      { month: 'Jun', value: 115 },
    ],
  },
];

export default function ThemesPage() {
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [watchedThemes, setWatchedThemes] = useState<string[]>(['ai', 'cybersecurity']);

  const toggleWatchTheme = (themeId: string) => {
    setWatchedThemes(prev => 
      prev.includes(themeId) 
        ? prev.filter(id => id !== themeId)
        : [...prev, themeId]
    );
  };

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Investment Themes</h1>
          <p className="page__subtitle">Explore thematic investment opportunities and trends</p>
        </div>
      </div>

      <div className="themes-layout">
        {/* Theme Cards Grid */}
        <section className="themes-grid">
          {THEMES.map(theme => (
            <div 
              key={theme.id}
              className={`theme-card ${selectedTheme.id === theme.id ? 'selected' : ''}`}
              onClick={() => setSelectedTheme(theme)}
            >
              <div className="theme-card__header">
                <div className="theme-icon">{theme.icon}</div>
                <button 
                  className={`watch-btn ${watchedThemes.includes(theme.id) ? 'watched' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleWatchTheme(theme.id); }}
                >
                  {watchedThemes.includes(theme.id) ? '★' : '☆'}
                </button>
              </div>
              <h3 className="theme-card__title">{theme.name}</h3>
              <div className="theme-card__stats">
                <span className={`ytd-return ${theme.ytdReturn >= 0 ? 'positive' : 'negative'}`}>
                  {theme.ytdReturn >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {theme.ytdReturn >= 0 ? '+' : ''}{theme.ytdReturn.toFixed(1)}% YTD
                </span>
                <span className={`risk-badge risk-${theme.riskLevel.toLowerCase()}`}>
                  {theme.riskLevel} Risk
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Theme Details */}
        <section className="theme-details">
          <div className="card">
            <div className="card__header">
              <div className="theme-details__title">
                <span className="theme-icon-large">{selectedTheme.icon}</span>
                <div>
                  <h2>{selectedTheme.name}</h2>
                  <span className="time-horizon">Investment Horizon: {selectedTheme.timeHorizon}</span>
                </div>
              </div>
            </div>
            <div className="card__body">
              <p className="theme-description">{selectedTheme.description}</p>

              <div className="theme-chart">
                <h4>Performance (YTD)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={selectedTheme.performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                    <XAxis dataKey="month" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} />
                    <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value.toFixed(1)}`, 'Value']}
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

              <div className="theme-sections">
                <div className="theme-section">
                  <h4>Key Drivers</h4>
                  <ul className="drivers-list">
                    {selectedTheme.keyDrivers.map((driver, i) => (
                      <li key={i}>
                        <Zap size={14} />
                        {driver}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="theme-section">
                  <h4>Related Stocks</h4>
                  <div className="related-stocks">
                    {selectedTheme.relatedStocks.map(symbol => (
                      <a
                        key={symbol}
                        href={`https://finance.yahoo.com/quote/${symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="stock-chip"
                      >
                        {symbol}
                        <ExternalLink size={12} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
