/**
 * Risk Analysis Page
 * 
 * Portfolio risk metrics, VaR analysis, and risk breakdown
 */

import { useMemo, useState, useEffect } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Shield, AlertTriangle, TrendingDown, Activity, Target, Gauge, Columns, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { KPICard, KPIGrid } from '../components/ui';
import {
  ColumnCustomizationDialog,
  loadTablePreferences,
  saveTablePreferences,
  getOrderedVisibleColumns,
  updateSort,
  type TablePreferences,
} from '../features/columns';
import {
  RISK_COLUMNS,
  RISK_CATEGORIES,
  DEFAULT_RISK_COLUMNS,
  type RiskColumnId,
} from '../features/risk';
import './pages.css';

export default function RiskPage() {
  const { investments, stats, riskMetrics } = usePortfolio();

  // Column customization state
  const [preferences, setPreferences] = useState<TablePreferences<RiskColumnId>>(() =>
    loadTablePreferences('risk', RISK_COLUMNS, DEFAULT_RISK_COLUMNS)
  );
  const [showColumnDialog, setShowColumnDialog] = useState(false);

  // Save preferences when they change
  useEffect(() => {
    saveTablePreferences('risk', preferences);
  }, [preferences]);

  // Get visible columns in order
  const visibleColumns = useMemo(
    () => getOrderedVisibleColumns(RISK_COLUMNS, preferences),
    [preferences]
  );

  // Sorting helpers
  const handleSort = (columnId: RiskColumnId) => {
    setPreferences(prev => updateSort(prev, columnId));
  };

  const getSortIcon = (columnId: RiskColumnId) => {
    if (preferences.sortBy?.columnId !== columnId) {
      return <ArrowUpDown size={12} className="sort-icon sort-icon--inactive" />;
    }
    return preferences.sortBy.direction === 'asc'
      ? <ArrowUp size={12} className="sort-icon" />
      : <ArrowDown size={12} className="sort-icon" />;
  };

  // Risk breakdown by holding
  const riskByHolding = useMemo(() => {
    return investments.map(inv => {
      const value = inv.quantity * inv.currentPrice;
      const weight = value / stats.totalValue;
      // Simulate volatility based on asset type
      const baseVol = inv.type === 'crypto' ? 0.6 : inv.type === 'stock' ? 0.25 : 0.1;
      const volatility = baseVol * (0.8 + Math.random() * 0.4);
      const riskContribution = weight * volatility;
      
      return {
        symbol: inv.symbol,
        name: inv.name,
        weight: weight * 100,
        volatility: volatility * 100,
        riskContribution: riskContribution * 100,
        var95: value * volatility * 1.65,
      };
    }).sort((a, b) => b.riskContribution - a.riskContribution);
  }, [investments, stats.totalValue]);

  // Risk by sector
  const riskBySector = useMemo(() => {
    const sectorData: Record<string, { value: number; risk: number }> = {};
    
    investments.forEach(inv => {
      const sector = inv.sector || 'Other';
      const value = inv.quantity * inv.currentPrice;
      const baseVol = inv.type === 'crypto' ? 0.6 : inv.type === 'stock' ? 0.25 : 0.1;
      
      if (!sectorData[sector]) {
        sectorData[sector] = { value: 0, risk: 0 };
      }
      sectorData[sector].value += value;
      sectorData[sector].risk += value * baseVol;
    });

    return Object.entries(sectorData).map(([sector, data]) => ({
      sector,
      value: data.value,
      weight: (data.value / stats.totalValue) * 100,
      risk: (data.risk / stats.totalValue) * 100,
    })).sort((a, b) => b.risk - a.risk);
  }, [investments, stats.totalValue]);

  // Radar chart data for risk profile
  const radarData = [
    { metric: 'Volatility', value: Math.min(riskMetrics.portfolioVolatility * 4, 100), fullMark: 100 },
    { metric: 'Concentration', value: 100 - stats.diversificationScore, fullMark: 100 },
    { metric: 'Beta', value: Math.min(riskMetrics.beta * 50, 100), fullMark: 100 },
    { metric: 'Drawdown', value: Math.min(riskMetrics.maxDrawdown * 5, 100), fullMark: 100 },
    { metric: 'VaR', value: Math.min((riskMetrics.valueAtRisk / stats.totalValue) * 500, 100), fullMark: 100 },
    { metric: 'Sector Risk', value: riskBySector[0]?.weight || 0, fullMark: 100 },
  ];

  // VaR scenarios
  const varScenarios = [
    { confidence: '95%', var: riskMetrics.valueAtRisk, probability: '1 in 20 days' },
    { confidence: '99%', var: riskMetrics.valueAtRisk * 1.4, probability: '1 in 100 days' },
    { confidence: '99.9%', var: riskMetrics.valueAtRisk * 1.8, probability: '1 in 1000 days' },
  ];

  const COLORS = ['#58a6ff', '#3fb950', '#a855f7', '#f97316', '#ec4899', '#14b8a6'];

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Risk Analysis</h1>
          <p className="page__subtitle">
            Portfolio risk metrics and exposure analysis
          </p>
        </div>
        <div className="page__actions">
          <div className={`risk-badge risk-badge--${riskMetrics.riskLevel.toLowerCase()}`}>
            <Shield size={16} />
            {riskMetrics.riskLevel} Risk
          </div>
        </div>
      </div>

      {/* Risk KPIs */}
      <KPIGrid columns={5}>
        <KPICard
          label="Portfolio Volatility"
          value={riskMetrics.portfolioVolatility}
          format="percent"
          icon={<Activity size={18} />}
        />
        <KPICard
          label="Sharpe Ratio"
          value={riskMetrics.sharpeRatio}
          icon={<Target size={18} />}
          variant={riskMetrics.sharpeRatio >= 1 ? 'highlight' : 'default'}
        />
        <KPICard
          label="Beta"
          value={riskMetrics.beta}
          icon={<Gauge size={18} />}
        />
        <KPICard
          label="Max Drawdown"
          value={-riskMetrics.maxDrawdown}
          format="percent"
          icon={<TrendingDown size={18} />}
          variant="danger"
        />
        <KPICard
          label="Value at Risk (95%)"
          value={riskMetrics.valueAtRisk}
          format="currency"
          icon={<AlertTriangle size={18} />}
          variant="warning"
        />
      </KPIGrid>

      <div className="risk-grid">
        {/* Risk Profile Radar */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Risk Profile</h2>
          </div>
          <div className="card__body">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#30363d" />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fill: '#8b949e', fontSize: 11 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fill: '#8b949e', fontSize: 10 }}
                />
                <Radar
                  name="Risk"
                  dataKey="value"
                  stroke="#f85149"
                  fill="#f85149"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* VaR Scenarios */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Value at Risk Scenarios</h2>
          </div>
          <div className="card__body">
            <div className="var-scenarios">
              {varScenarios.map(scenario => (
                <div key={scenario.confidence} className="var-scenario">
                  <div className="var-scenario__header">
                    <span className="var-scenario__confidence">{scenario.confidence} Confidence</span>
                    <span className="var-scenario__probability">{scenario.probability}</span>
                  </div>
                  <div className="var-scenario__value">
                    -${scenario.var.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="var-scenario__bar">
                    <div 
                      className="var-scenario__fill"
                      style={{ width: `${(scenario.var / (stats.totalValue * 0.3)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="var-explanation">
              Value at Risk (VaR) represents the maximum expected loss at the given confidence level 
              over a one-day period under normal market conditions.
            </p>
          </div>
        </section>

        {/* Risk by Sector */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Risk by Sector</h2>
          </div>
          <div className="card__body">
            <div className="risk-sector-chart">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={riskBySector}
                    dataKey="risk"
                    nameKey="sector"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {riskBySector.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161b22',
                      border: '1px solid #30363d',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="risk-sector-legend">
                {riskBySector.map((sector, index) => (
                  <div key={sector.sector} className="risk-sector-item">
                    <span 
                      className="risk-sector-dot"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="risk-sector-name">{sector.sector}</span>
                    <span className="risk-sector-value">{sector.risk.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Risk Contribution by Holding */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Risk Contribution by Holding</h2>
          </div>
          <div className="card__body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={riskByHolding.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis 
                  type="number"
                  stroke="#8b949e"
                  tick={{ fill: '#8b949e', fontSize: 11 }}
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                />
                <YAxis 
                  type="category"
                  dataKey="symbol"
                  stroke="#8b949e"
                  tick={{ fill: '#8b949e', fontSize: 11 }}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Risk Contribution']}
                />
                <Bar dataKey="riskContribution" fill="#f85149" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Risk Details Table */}
        <section className="card risk-table-card">
          <div className="card__header">
            <h2 className="card__title">Detailed Risk Metrics</h2>
            <button 
              className="btn btn--ghost btn--sm"
              onClick={() => setShowColumnDialog(true)}
              title="Customize columns"
            >
              <Columns size={14} />
            </button>
          </div>
          <div className="card__body card__body--flush">
            <table className="holdings-table">
              <thead>
                <tr>
                  {visibleColumns.map(col => (
                    <th
                      key={col.id}
                      className={col.sortable ? 'sortable' : ''}
                      onClick={() => col.sortable && handleSort(col.id)}
                    >
                      {col.label}
                      {col.sortable && getSortIcon(col.id)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {riskByHolding.map(h => (
                  <tr key={h.symbol}>
                    {visibleColumns.map(col => (
                      <td key={col.id} className={col.canBeNegative && col.id === 'riskContribution' && h.riskContribution > 5 ? 'text-negative' : ''}>
                        {col.id === 'symbol' && (
                          <div className="holding-symbol">
                            <span className="holding-ticker">{h.symbol}</span>
                            <span className="holding-name">{h.name}</span>
                          </div>
                        )}
                        {col.id === 'weight' && `${h.weight.toFixed(1)}%`}
                        {col.id === 'volatility' && `${h.volatility.toFixed(1)}%`}
                        {col.id === 'riskContribution' && `${h.riskContribution.toFixed(2)}%`}
                        {col.id === 'var95' && `$${h.var95.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        {col.id === 'var99' && `$${(h.var95 * 1.4).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        {col.id === 'beta' && (0.8 + Math.random() * 0.6).toFixed(2)}
                        {col.id === 'correlation' && (0.5 + Math.random() * 0.4).toFixed(2)}
                        {col.id === 'maxDrawdown' && `-${(5 + Math.random() * 25).toFixed(1)}%`}
                        {col.id === 'currentDrawdown' && `-${(2 + Math.random() * 15).toFixed(1)}%`}
                        {col.id === 'cvar' && `$${(h.var95 * 1.2).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        {col.id === 'tailRisk' && `${(1 + Math.random() * 5).toFixed(1)}%`}
                        {col.id === 'volatility30d' && `${(h.volatility * 0.9).toFixed(1)}%`}
                        {col.id === 'volatility90d' && `${(h.volatility * 1.1).toFixed(1)}%`}
                        {col.id === 'systematicRisk' && `${(h.riskContribution * 0.6).toFixed(2)}%`}
                        {col.id === 'idiosyncraticRisk' && `${(h.riskContribution * 0.4).toFixed(2)}%`}
                        {col.id === 'marginalVar' && `$${(h.var95 * 0.1).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        {col.id === 'componentVar' && `$${(h.var95 * 0.15).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        {col.id === 'skewness' && (-0.5 + Math.random()).toFixed(2)}
                        {col.id === 'kurtosis' && (2 + Math.random() * 2).toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Column Customization Dialog */}
      {showColumnDialog && (
        <ColumnCustomizationDialog
          columns={RISK_COLUMNS}
          categories={RISK_CATEGORIES}
          preferences={preferences}
          onPreferencesChange={setPreferences}
          onClose={() => setShowColumnDialog(false)}
          defaultVisibleIds={DEFAULT_RISK_COLUMNS}
          title="Customize Risk Columns"
        />
      )}
    </div>
  );
}
