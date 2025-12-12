/**
 * Settings Page
 * 
 * Configure application preferences and account settings
 */

import { useState, useEffect } from 'react';
import { Save, Moon, Sun, Bell, Shield, Download, Trash2, RefreshCw, DollarSign, Palette, Globe } from 'lucide-react';
import { api } from '../services/api';
import './pages.css';

interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  currency: string;
  dateFormat: string;
  numberFormat: string;
  refreshInterval: number;
  notifications: {
    priceAlerts: boolean;
    portfolioUpdates: boolean;
    newsAlerts: boolean;
    emailDigest: boolean;
  };
  privacy: {
    hideBalances: boolean;
    anonymousAnalytics: boolean;
  };
  display: {
    compactMode: boolean;
    showCents: boolean;
    colorBlindMode: boolean;
    animationsEnabled: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  numberFormat: 'en-US',
  refreshInterval: 60,
  notifications: {
    priceAlerts: true,
    portfolioUpdates: true,
    newsAlerts: false,
    emailDigest: false,
  },
  privacy: {
    hideBalances: false,
    anonymousAnalytics: true,
  },
  display: {
    compactMode: false,
    showCents: true,
    colorBlindMode: false,
    animationsEnabled: true,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timeout);
  }, [saved]);

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setSaved(true);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('appSettings', JSON.stringify(DEFAULT_SETTINGS));
      setSaved(true);
    }
  };

  const handleExportData = async () => {
    const readFirst = (keys: string[]) => {
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) return raw;
      }
      return null;
    };

    const base = {
      settings,
      watchlist: JSON.parse(localStorage.getItem('watchlist') || '[]'),
      journal: JSON.parse(localStorage.getItem('tradeJournal') || '[]'),
      exportedAt: new Date().toISOString(),
    };

    let data: unknown = null;

    if (api.isAuthenticated()) {
      const exported = await api.exportPortfolios();
      if (exported.success && exported.data) {
        data = {
          ...base,
          portfolios: exported.data,
        };
      }
    }

    if (!data) {
      const investmentsRaw = readFirst(['portfolioInvestments', 'portfolio_investments']);
      const transactionsRaw = readFirst(['portfolioTransactions', 'portfolio_transactions']);
      data = {
        ...base,
        investments: JSON.parse(investmentsRaw || '[]'),
        transactions: JSON.parse(transactionsRaw || '[]'),
      };
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (confirm('This will delete all your portfolio data. Are you sure?')) {
      localStorage.removeItem('portfolioInvestments');
      localStorage.removeItem('portfolioTransactions');
      localStorage.removeItem('portfolio_investments');
      localStorage.removeItem('portfolio_transactions');
      localStorage.removeItem('watchlist');
      localStorage.removeItem('tradeJournal');
      window.location.reload();
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Settings</h1>
          <p className="page__subtitle">Configure your preferences</p>
        </div>
        <div className="page__actions">
          {saved && <span className="save-indicator">✓ Saved</span>}
          <button className="btn btn--primary" onClick={handleSave}>
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>

      <div className="settings-grid">
        {/* Appearance */}
        <section className="card settings-section">
          <div className="card__header">
            <h2 className="card__title">
              <Palette size={18} />
              Appearance
            </h2>
          </div>
          <div className="card__body">
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Theme</span>
                  <span className="setting-description">Choose your preferred color scheme</span>
                </div>
                <div className="theme-selector">
                  <button
                    className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  >
                    <Moon size={16} />
                    Dark
                  </button>
                  <button
                    className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, theme: 'light' })}
                  >
                    <Sun size={16} />
                    Light
                  </button>
                  <button
                    className={`theme-btn ${settings.theme === 'system' ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, theme: 'system' })}
                  >
                    System
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Compact Mode</span>
                  <span className="setting-description">Reduce spacing for more content</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.display.compactMode}
                    onChange={e => setSettings({
                      ...settings,
                      display: { ...settings.display, compactMode: e.target.checked }
                    })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Animations</span>
                  <span className="setting-description">Enable UI animations and transitions</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.display.animationsEnabled}
                    onChange={e => setSettings({
                      ...settings,
                      display: { ...settings.display, animationsEnabled: e.target.checked }
                    })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Color Blind Mode</span>
                  <span className="setting-description">Use patterns in addition to colors</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.display.colorBlindMode}
                    onChange={e => setSettings({
                      ...settings,
                      display: { ...settings.display, colorBlindMode: e.target.checked }
                    })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Localization */}
        <section className="card settings-section">
          <div className="card__header">
            <h2 className="card__title">
              <Globe size={18} />
              Localization
            </h2>
          </div>
          <div className="card__body">
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Currency</span>
                  <span className="setting-description">Default currency for display</span>
                </div>
                <select
                  className="form-select"
                  value={settings.currency}
                  onChange={e => setSettings({ ...settings, currency: e.target.value })}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Date Format</span>
                  <span className="setting-description">How dates are displayed</span>
                </div>
                <select
                  className="form-select"
                  value={settings.dateFormat}
                  onChange={e => setSettings({ ...settings, dateFormat: e.target.value })}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Show Cents</span>
                  <span className="setting-description">Display decimal places in amounts</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.display.showCents}
                    onChange={e => setSettings({
                      ...settings,
                      display: { ...settings.display, showCents: e.target.checked }
                    })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="card settings-section">
          <div className="card__header">
            <h2 className="card__title">
              <Bell size={18} />
              Notifications
            </h2>
          </div>
          <div className="card__body">
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Price Alerts</span>
                  <span className="setting-description">Get notified when prices hit targets</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifications.priceAlerts}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, priceAlerts: e.target.checked }
                    })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Portfolio Updates</span>
                  <span className="setting-description">Daily portfolio summary notifications</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifications.portfolioUpdates}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, portfolioUpdates: e.target.checked }
                    })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">News Alerts</span>
                  <span className="setting-description">Breaking news for your holdings</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifications.newsAlerts}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, newsAlerts: e.target.checked }
                    })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="card settings-section">
          <div className="card__header">
            <h2 className="card__title">
              <Shield size={18} />
              Privacy & Security
            </h2>
          </div>
          <div className="card__body">
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Hide Balances</span>
                  <span className="setting-description">Mask portfolio values in the UI</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.privacy.hideBalances}
                    onChange={e => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, hideBalances: e.target.checked }
                    })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Anonymous Analytics</span>
                  <span className="setting-description">Help improve the app with usage data</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.privacy.anonymousAnalytics}
                    onChange={e => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, anonymousAnalytics: e.target.checked }
                    })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="card settings-section">
          <div className="card__header">
            <h2 className="card__title">
              <DollarSign size={18} />
              Data Management
            </h2>
          </div>
          <div className="card__body">
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Auto-Refresh</span>
                  <span className="setting-description">How often to refresh market data</span>
                </div>
                <select
                  className="form-select"
                  value={settings.refreshInterval}
                  onChange={e => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })}
                >
                  <option value={30}>Every 30 seconds</option>
                  <option value={60}>Every minute</option>
                  <option value={300}>Every 5 minutes</option>
                  <option value={0}>Manual only</option>
                </select>
              </div>
            </div>

            <div className="data-actions">
              <button className="btn" onClick={handleExportData}>
                <Download size={16} />
                Export All Data
              </button>
              <button className="btn" onClick={handleReset}>
                <RefreshCw size={16} />
                Reset Settings
              </button>
              <button className="btn btn--danger" onClick={handleClearData}>
                <Trash2 size={16} />
                Clear All Data
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
