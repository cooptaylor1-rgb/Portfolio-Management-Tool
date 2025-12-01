import { Activity, TestTube } from 'lucide-react';

type Environment = 'live' | 'paper' | 'simulation';

interface EnvironmentBannerProps {
  environment: Environment;
  onEnvironmentChange?: (env: Environment) => void;
}

export function EnvironmentBanner({ environment, onEnvironmentChange }: EnvironmentBannerProps) {
  const configs = {
    live: {
      label: 'LIVE TRADING',
      icon: <Activity size={16} />,
      className: 'env-live',
      warning: '⚠ Real money at risk'
    },
    paper: {
      label: 'PAPER TRADING',
      icon: <TestTube size={16} />,
      className: 'env-paper',
      warning: 'Simulated trades with real-time data'
    },
    simulation: {
      label: 'SIMULATION MODE',
      icon: <TestTube size={16} />,
      className: 'env-simulation',
      warning: 'Test environment - No real trades'
    }
  };

  const config = configs[environment];

  return (
    <div className={`environment-banner ${config.className}`}>
      <div className="environment-banner-content">
        <span className="environment-banner-icon">{config.icon}</span>
        <span className="environment-banner-label">{config.label}</span>
        <span className="environment-banner-separator">|</span>
        <span className="environment-banner-warning">{config.warning}</span>
      </div>
      {onEnvironmentChange && (
        <select 
          className="environment-banner-select"
          value={environment}
          onChange={(e) => onEnvironmentChange(e.target.value as Environment)}
        >
          <option value="simulation">Simulation</option>
          <option value="paper">Paper Trading</option>
          <option value="live">Live Trading</option>
        </select>
      )}
    </div>
  );
}
