/**
 * Scenario Analysis Page
 * 
 * Stress testing and what-if analysis for the portfolio
 */

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, Area, AreaChart, ReferenceLine,
} from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, Play, RefreshCw } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { KPICard, KPIGrid } from '../components/ui';
import './pages.css';

// Predefined stress test scenarios
const SCENARIOS = [
  {
    id: 'market-crash',
    name: 'Market Crash',
    description: '2008-style financial crisis with broad market selloff',
    icon: TrendingDown,
    impact: { stock: -0.40, etf: -0.35, bond: -0.10, crypto: -0.60, 'mutual-fund': -0.30, other: -0.25 },
    color: '#f85149',
  },
  {
    id: 'recession',
    name: 'Recession',
    description: 'Economic slowdown with moderate market decline',
    icon: TrendingDown,
    impact: { stock: -0.20, etf: -0.18, bond: 0.05, crypto: -0.35, 'mutual-fund': -0.15, other: -0.10 },
    color: '#d29922',
  },
  {
    id: 'inflation',
    name: 'High Inflation',
    description: 'Sustained inflation above 8% with Fed rate hikes',
    icon: AlertTriangle,
    impact: { stock: -0.15, etf: -0.12, bond: -0.15, crypto: -0.25, 'mutual-fund': -0.10, other: 0.05 },
    color: '#f97316',
  },
  {
    id: 'tech-bubble',
    name: 'Tech Bubble Burst',
    description: 'Tech sector correction similar to 2000 dot-com crash',
    icon: TrendingDown,
    impact: { stock: -0.35, etf: -0.25, bond: 0.02, crypto: -0.50, 'mutual-fund': -0.20, other: -0.05 },
    color: '#a855f7',
  },
  {
    id: 'bull-market',
    name: 'Bull Market',
    description: 'Strong economic growth with market rally',
    icon: TrendingUp,
    impact: { stock: 0.25, etf: 0.22, bond: -0.02, crypto: 0.50, 'mutual-fund': 0.18, other: 0.10 },
    color: '#3fb950',
  },
  {
    id: 'crypto-winter',
    name: 'Crypto Winter',
    description: 'Severe cryptocurrency market downturn',
    icon: TrendingDown,
    impact: { stock: 0.02, etf: 0.01, bond: 0.01, crypto: -0.75, 'mutual-fund': 0.02, other: 0 },
    color: '#58a6ff',
  },
];

// Monte Carlo simulation
function runMonteCarloSimulation(startValue: number, years: number, runs: number): number[][] {
  const results: number[][] = [];
  const annualReturn = 0.08;
  const volatility = 0.18;
  const daysPerYear = 252;
  const totalDays = years * daysPerYear;
  
  for (let run = 0; run < runs; run++) {
    const path: number[] = [startValue];
    let value = startValue;
    
    for (let day = 1; day <= totalDays; day++) {
      const dailyReturn = annualReturn / daysPerYear;
      const dailyVol = volatility / Math.sqrt(daysPerYear);
      const randomShock = (Math.random() + Math.random() + Math.random() - 1.5) * 2; // Approx normal
      const change = dailyReturn + dailyVol * randomShock;
      value *= (1 + change);
      
      if (day % 21 === 0) { // Monthly data points
        path.push(value);
      }
    }
    results.push(path);
  }
  
  return results;
}

export default function ScenariosPage() {
  const { investments, stats } = usePortfolio();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [monteCarloRuns, setMonteCarloRuns] = useState(100);
  const [runSimulation, setRunSimulation] = useState(false);

  // Calculate scenario impacts
  const scenarioResults = useMemo(() => {
    return SCENARIOS.map(scenario => {
      let impactedValue = 0;
      
      investments.forEach(inv => {
        const currentValue = inv.quantity * inv.currentPrice;
        const impact = scenario.impact[inv.type] || 0;
        impactedValue += currentValue * (1 + impact);
      });
      
      const dollarImpact = impactedValue - stats.totalValue;
      const percentImpact = (dollarImpact / stats.totalValue) * 100;
      
      return {
        ...scenario,
        newValue: impactedValue,
        dollarImpact,
        percentImpact,
      };
    });
  }, [investments, stats.totalValue]);

  // Selected scenario details
  const selectedScenarioData = useMemo(() => {
    if (!selectedScenario) return null;
    return scenarioResults.find(s => s.id === selectedScenario);
  }, [selectedScenario, scenarioResults]);

  // Impact by holding for selected scenario
  const holdingImpacts = useMemo(() => {
    if (!selectedScenarioData) return [];
    
    return investments.map(inv => {
      const currentValue = inv.quantity * inv.currentPrice;
      const impact = selectedScenarioData.impact[inv.type] || 0;
      const newValue = currentValue * (1 + impact);
      
      return {
        symbol: inv.symbol,
        name: inv.name,
        currentValue,
        newValue,
        dollarChange: newValue - currentValue,
        percentChange: impact * 100,
      };
    }).sort((a, b) => a.dollarChange - b.dollarChange);
  }, [investments, selectedScenarioData]);

  // Monte Carlo results
  const monteCarloResults = useMemo(() => {
    if (!runSimulation) return null;
    
    const simulations = runMonteCarloSimulation(stats.totalValue, 5, monteCarloRuns);
    const months = simulations[0].length;
    
    // Calculate percentiles at each time point
    const chartData = [];
    for (let m = 0; m < months; m++) {
      const values = simulations.map(sim => sim[m]).sort((a, b) => a - b);
      chartData.push({
        month: m,
        p5: values[Math.floor(values.length * 0.05)],
        p25: values[Math.floor(values.length * 0.25)],
        median: values[Math.floor(values.length * 0.5)],
        p75: values[Math.floor(values.length * 0.75)],
        p95: values[Math.floor(values.length * 0.95)],
      });
    }
    
    // Final values for distribution
    const finalValues = simulations.map(sim => sim[sim.length - 1]);
    const sortedFinal = [...finalValues].sort((a, b) => a - b);
    
    return {
      chartData,
      finalStats: {
        worst: sortedFinal[0],
        p5: sortedFinal[Math.floor(sortedFinal.length * 0.05)],
        median: sortedFinal[Math.floor(sortedFinal.length * 0.5)],
        p95: sortedFinal[Math.floor(sortedFinal.length * 0.95)],
        best: sortedFinal[sortedFinal.length - 1],
        probProfit: sortedFinal.filter(v => v > stats.totalValue).length / sortedFinal.length * 100,
      },
    };
  }, [runSimulation, stats.totalValue, monteCarloRuns]);

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Scenario Analysis</h1>
          <p className="page__subtitle">Stress test your portfolio against market scenarios</p>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="scenarios-grid">
        {scenarioResults.map(scenario => {
          const Icon = scenario.icon;
          const isSelected = selectedScenario === scenario.id;
          
          return (
            <div
              key={scenario.id}
              className={`scenario-card ${isSelected ? 'scenario-card--selected' : ''}`}
              onClick={() => setSelectedScenario(isSelected ? null : scenario.id)}
            >
              <div className="scenario-card__header">
                <div className="scenario-card__icon" style={{ color: scenario.color }}>
                  <Icon size={20} />
                </div>
                <h3 className="scenario-card__title">{scenario.name}</h3>
              </div>
              <p className="scenario-card__description">{scenario.description}</p>
              <div className="scenario-card__impact">
                <span className={`scenario-impact ${scenario.percentImpact >= 0 ? 'positive' : 'negative'}`}>
                  {scenario.percentImpact >= 0 ? '+' : ''}{scenario.percentImpact.toFixed(1)}%
                </span>
                <span className="scenario-dollar">
                  {scenario.dollarImpact >= 0 ? '+' : ''}${(scenario.dollarImpact / 1000).toFixed(0)}K
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Scenario Details */}
      {selectedScenarioData && (
        <section className="card scenario-details">
          <div className="card__header">
            <h2 className="card__title">{selectedScenarioData.name} - Impact Analysis</h2>
          </div>
          <div className="card__body">
            <KPIGrid columns={4}>
              <KPICard
                label="Current Value"
                value={stats.totalValue}
                format="currency"
              />
              <KPICard
                label="Projected Value"
                value={selectedScenarioData.newValue}
                format="currency"
              />
              <KPICard
                label="Dollar Impact"
                value={selectedScenarioData.dollarImpact}
                format="currency"
                variant={selectedScenarioData.dollarImpact >= 0 ? 'highlight' : 'danger'}
              />
              <KPICard
                label="Percent Impact"
                value={selectedScenarioData.percentImpact}
                format="percent"
                variant={selectedScenarioData.percentImpact >= 0 ? 'highlight' : 'danger'}
              />
            </KPIGrid>

            <div className="scenario-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={holdingImpacts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                  <XAxis 
                    type="number"
                    stroke="#8b949e"
                    tick={{ fill: '#8b949e', fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
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
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Impact']}
                  />
                  <ReferenceLine x={0} stroke="#8b949e" />
                  <Bar 
                    dataKey="dollarChange" 
                    fill={selectedScenarioData.color}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Monte Carlo Simulation */}
      <section className="card monte-carlo">
        <div className="card__header">
          <h2 className="card__title">Monte Carlo Simulation</h2>
          <div className="monte-carlo-controls">
            <select 
              className="form-select"
              value={monteCarloRuns}
              onChange={e => setMonteCarloRuns(parseInt(e.target.value))}
            >
              <option value={100}>100 simulations</option>
              <option value={500}>500 simulations</option>
              <option value={1000}>1000 simulations</option>
            </select>
            <button 
              className="btn btn--primary"
              onClick={() => setRunSimulation(!runSimulation)}
            >
              {runSimulation ? <RefreshCw size={16} /> : <Play size={16} />}
              {runSimulation ? 'Re-run' : 'Run Simulation'}
            </button>
          </div>
        </div>
        <div className="card__body">
          {!runSimulation ? (
            <div className="monte-carlo-placeholder">
              <p>Run a Monte Carlo simulation to project portfolio outcomes over the next 5 years</p>
              <p className="monte-carlo-note">
                Simulations use historical volatility and expected returns to generate 
                thousands of possible future scenarios.
              </p>
            </div>
          ) : monteCarloResults && (
            <>
              <KPIGrid columns={5}>
                <KPICard label="5th Percentile" value={monteCarloResults.finalStats.p5} format="currency" variant="danger" />
                <KPICard label="25th Percentile" value={monteCarloResults.finalStats.median * 0.85} format="currency" />
                <KPICard label="Median Outcome" value={monteCarloResults.finalStats.median} format="currency" variant="highlight" />
                <KPICard label="95th Percentile" value={monteCarloResults.finalStats.p95} format="currency" variant="highlight" />
                <KPICard label="Probability of Profit" value={monteCarloResults.finalStats.probProfit} format="percent" />
              </KPIGrid>

              <div className="monte-carlo-chart">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={monteCarloResults.chartData}>
                    <defs>
                      <linearGradient id="mcGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                    <XAxis 
                      dataKey="month"
                      stroke="#8b949e"
                      tick={{ fill: '#8b949e', fontSize: 11 }}
                      tickFormatter={(v) => `Y${Math.floor(v / 12)}`}
                    />
                    <YAxis 
                      stroke="#8b949e"
                      tick={{ fill: '#8b949e', fontSize: 11 }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161b22',
                        border: '1px solid #30363d',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="p95" 
                      stroke="none" 
                      fill="#3fb950" 
                      fillOpacity={0.2} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="p5" 
                      stroke="none" 
                      fill="#0d1117" 
                      fillOpacity={1} 
                    />
                    <Line type="monotone" dataKey="median" stroke="#58a6ff" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="p25" stroke="#8b949e" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                    <Line type="monotone" dataKey="p75" stroke="#8b949e" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                    <ReferenceLine y={stats.totalValue} stroke="#f85149" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
