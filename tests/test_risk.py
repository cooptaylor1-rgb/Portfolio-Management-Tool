"""Tests for risk analytics module."""

from datetime import date

import numpy as np
import pytest

from portfolio_management.analytics.risk import RiskAnalyzer, RiskMetrics


class TestRiskAnalyzer:
    """Tests for RiskAnalyzer class."""

    @pytest.fixture
    def analyzer(self):
        """Create a risk analyzer instance."""
        return RiskAnalyzer(risk_free_rate=0.05)

    @pytest.fixture
    def sample_returns(self):
        """Create sample return data."""
        np.random.seed(42)
        return np.random.normal(0.0005, 0.02, 252)  # ~12.5% annual return, ~32% vol

    @pytest.fixture
    def sample_prices(self, sample_returns):
        """Create sample price data from returns."""
        prices = [100.0]
        for ret in sample_returns:
            prices.append(prices[-1] * (1 + ret))
        return np.array(prices)

    @pytest.fixture
    def benchmark_returns(self):
        """Create sample benchmark returns."""
        np.random.seed(123)
        return np.random.normal(0.0003, 0.015, 252)

    def test_calculate_returns(self, analyzer, sample_prices):
        """Test return calculation."""
        log_returns = analyzer.calculate_returns(sample_prices, method="log")
        simple_returns = analyzer.calculate_returns(sample_prices, method="simple")

        assert len(log_returns) == len(sample_prices) - 1
        assert len(simple_returns) == len(sample_prices) - 1

    def test_calculate_volatility(self, analyzer, sample_returns):
        """Test volatility calculation."""
        annual_vol = analyzer.calculate_volatility(sample_returns, annualize=True)
        daily_vol = analyzer.calculate_volatility(sample_returns, annualize=False)

        assert annual_vol > 0
        assert daily_vol > 0
        assert annual_vol > daily_vol  # Annualized should be higher
        # Check annualization factor
        assert abs(annual_vol / daily_vol - np.sqrt(252)) < 0.1

    def test_calculate_var_historical(self, analyzer, sample_returns):
        """Test historical VaR calculation."""
        var_95 = analyzer.calculate_var(sample_returns, 0.95, method="historical")
        var_99 = analyzer.calculate_var(sample_returns, 0.99, method="historical")

        assert var_95 > 0
        assert var_99 > 0
        assert var_99 > var_95  # 99% VaR should be higher

    def test_calculate_var_parametric(self, analyzer, sample_returns):
        """Test parametric VaR calculation."""
        var_95 = analyzer.calculate_var(sample_returns, 0.95, method="parametric")

        assert var_95 > 0

    def test_calculate_var_monte_carlo(self, analyzer, sample_returns):
        """Test Monte Carlo VaR calculation."""
        var_95 = analyzer.calculate_var(sample_returns, 0.95, method="monte_carlo")

        assert var_95 > 0

    def test_calculate_var_with_portfolio_value(self, analyzer, sample_returns):
        """Test VaR with portfolio value."""
        portfolio_value = 1000000
        var = analyzer.calculate_var(
            sample_returns, 0.95, method="historical", portfolio_value=portfolio_value
        )

        # Dollar VaR should be scaled by portfolio value
        assert var > 1000  # Reasonable dollar amount

    def test_calculate_cvar(self, analyzer, sample_returns):
        """Test CVaR calculation."""
        cvar_95 = analyzer.calculate_cvar(sample_returns, 0.95)
        var_95 = analyzer.calculate_var(sample_returns, 0.95)

        assert cvar_95 > 0
        assert cvar_95 >= var_95  # CVaR should be >= VaR

    def test_calculate_beta(self, analyzer, sample_returns, benchmark_returns):
        """Test beta calculation."""
        beta = analyzer.calculate_beta(sample_returns, benchmark_returns)

        # Beta should be reasonable
        assert -2 < beta < 3

    def test_calculate_alpha(self, analyzer, sample_returns, benchmark_returns):
        """Test alpha calculation."""
        alpha = analyzer.calculate_alpha(sample_returns, benchmark_returns)

        # Alpha should be in reasonable range (annualized %)
        assert -0.5 < alpha < 0.5

    def test_calculate_sharpe_ratio(self, analyzer, sample_returns):
        """Test Sharpe ratio calculation."""
        sharpe = analyzer.calculate_sharpe_ratio(sample_returns)

        # Sharpe should be in reasonable range
        assert -3 < sharpe < 5

    def test_calculate_sortino_ratio(self, analyzer, sample_returns):
        """Test Sortino ratio calculation."""
        sortino = analyzer.calculate_sortino_ratio(sample_returns)

        # Sortino should be in reasonable range
        assert -3 < sortino < 10

    def test_calculate_max_drawdown(self, analyzer, sample_prices):
        """Test maximum drawdown calculation."""
        max_dd, peak_idx, trough_idx = analyzer.calculate_max_drawdown(sample_prices)

        assert max_dd <= 0  # Drawdown is negative
        assert max_dd >= -1  # Can't lose more than 100%
        assert peak_idx <= trough_idx  # Peak before trough

    def test_calculate_calmar_ratio(self, analyzer, sample_returns, sample_prices):
        """Test Calmar ratio calculation."""
        calmar = analyzer.calculate_calmar_ratio(sample_returns, sample_prices)

        # Calmar can be positive or negative
        assert calmar is not None

    def test_calculate_tracking_error(self, analyzer, sample_returns, benchmark_returns):
        """Test tracking error calculation."""
        te = analyzer.calculate_tracking_error(sample_returns, benchmark_returns)

        assert te >= 0  # Tracking error is always positive

    def test_calculate_information_ratio(self, analyzer, sample_returns, benchmark_returns):
        """Test information ratio calculation."""
        ir = analyzer.calculate_information_ratio(sample_returns, benchmark_returns)

        # IR can be positive or negative
        assert -5 < ir < 5

    def test_calculate_capture_ratios(self, analyzer, sample_returns, benchmark_returns):
        """Test capture ratio calculation."""
        upside, downside = analyzer.calculate_capture_ratios(sample_returns, benchmark_returns)

        assert upside > 0
        assert downside > 0

    def test_calculate_all_metrics(
        self, analyzer, sample_returns, sample_prices, benchmark_returns
    ):
        """Test calculating all metrics at once."""
        metrics = analyzer.calculate_all_metrics(
            sample_returns, sample_prices, benchmark_returns
        )

        assert isinstance(metrics, RiskMetrics)
        assert metrics.as_of_date == date.today()
        assert metrics.volatility_annual is not None
        assert metrics.var_95 is not None
        assert metrics.var_99 is not None
        assert metrics.cvar_95 is not None
        assert metrics.sharpe_ratio is not None
        assert metrics.sortino_ratio is not None
        assert metrics.max_drawdown is not None
        assert metrics.beta is not None
        assert metrics.tracking_error is not None
        assert metrics.information_ratio is not None

    def test_calculate_correlation_matrix(self, analyzer):
        """Test correlation matrix calculation."""
        np.random.seed(42)
        returns_dict = {
            "AAPL": np.random.normal(0.001, 0.02, 100),
            "MSFT": np.random.normal(0.001, 0.02, 100),
            "JPM": np.random.normal(0.0005, 0.025, 100),
        }

        symbols, corr_matrix = analyzer.calculate_correlation_matrix(returns_dict)

        assert len(symbols) == 3
        assert corr_matrix.shape == (3, 3)
        # Diagonal should be 1
        assert all(abs(corr_matrix[i, i] - 1.0) < 0.0001 for i in range(3))
        # Correlations should be between -1 and 1
        assert np.all(corr_matrix >= -1)
        assert np.all(corr_matrix <= 1)

    def test_calculate_portfolio_var(self, analyzer):
        """Test portfolio VaR calculation."""
        np.random.seed(42)
        weights = np.array([0.4, 0.3, 0.3])
        returns_matrix = np.random.normal(0.001, 0.02, (3, 100))

        portfolio_var = analyzer.calculate_portfolio_var(
            weights, returns_matrix, 0.95, portfolio_value=1000000
        )

        assert portfolio_var > 0

    def test_different_length_returns(self, analyzer):
        """Test handling of different length return series."""
        returns = np.random.normal(0, 0.02, 100)
        benchmark = np.random.normal(0, 0.015, 80)

        # Should handle gracefully by truncating to min length
        beta = analyzer.calculate_beta(returns, benchmark)
        assert beta is not None
