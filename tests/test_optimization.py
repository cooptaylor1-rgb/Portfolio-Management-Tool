"""Tests for portfolio optimization module."""

import numpy as np
import pytest

from portfolio_management.analytics.optimization import (
    LiquidityAnalyzer,
    OptimizationConstraints,
    OptimizationObjective,
    OptimizationResult,
    PortfolioOptimizer,
)


class TestPortfolioOptimizer:
    """Tests for PortfolioOptimizer class."""

    @pytest.fixture
    def optimizer(self):
        """Create an optimizer instance."""
        return PortfolioOptimizer(risk_free_rate=0.05)

    @pytest.fixture
    def sample_data(self):
        """Create sample data for optimization."""
        symbols = ["AAPL", "MSFT", "JPM", "JNJ", "XOM"]
        expected_returns = np.array([0.12, 0.10, 0.08, 0.06, 0.07])

        # Create a reasonable covariance matrix
        np.random.seed(42)
        volatilities = np.array([0.25, 0.22, 0.28, 0.15, 0.20])
        correlations = np.array([
            [1.0, 0.7, 0.4, 0.2, 0.3],
            [0.7, 1.0, 0.3, 0.2, 0.2],
            [0.4, 0.3, 1.0, 0.4, 0.5],
            [0.2, 0.2, 0.4, 1.0, 0.3],
            [0.3, 0.2, 0.5, 0.3, 1.0],
        ])

        cov_matrix = np.outer(volatilities, volatilities) * correlations

        return symbols, expected_returns, cov_matrix

    def test_calculate_portfolio_stats(self, optimizer, sample_data):
        """Test portfolio statistics calculation."""
        symbols, expected_returns, cov_matrix = sample_data
        weights = np.array([0.2, 0.2, 0.2, 0.2, 0.2])

        ret, vol, sharpe = optimizer.calculate_portfolio_stats(
            weights, expected_returns, cov_matrix
        )

        assert ret > 0
        assert vol > 0
        assert sharpe != 0

    def test_mean_variance_max_sharpe(self, optimizer, sample_data):
        """Test mean-variance optimization for max Sharpe."""
        symbols, expected_returns, cov_matrix = sample_data

        result = optimizer.mean_variance_optimization(
            symbols,
            expected_returns,
            cov_matrix,
            objective=OptimizationObjective.MAX_SHARPE,
        )

        assert isinstance(result, OptimizationResult)
        assert result.success
        assert len(result.weights) == len(symbols)

        # Weights should sum to 1
        total_weight = sum(result.weights.values())
        assert abs(total_weight - 1.0) < 0.01

        # All weights should be non-negative (long only by default)
        assert all(w >= -0.001 for w in result.weights.values())

    def test_mean_variance_min_variance(self, optimizer, sample_data):
        """Test mean-variance optimization for minimum variance."""
        symbols, expected_returns, cov_matrix = sample_data

        result = optimizer.mean_variance_optimization(
            symbols,
            expected_returns,
            cov_matrix,
            objective=OptimizationObjective.MIN_VARIANCE,
        )

        assert result.success
        assert result.expected_volatility > 0

    def test_mean_variance_with_constraints(self, optimizer, sample_data):
        """Test optimization with constraints."""
        symbols, expected_returns, cov_matrix = sample_data

        constraints = OptimizationConstraints(
            min_weight=0.05,
            max_weight=0.40,
            long_only=True,
        )

        result = optimizer.mean_variance_optimization(
            symbols,
            expected_returns,
            cov_matrix,
            objective=OptimizationObjective.MAX_SHARPE,
            constraints=constraints,
        )

        assert result.success

        # Check constraints are satisfied
        for weight in result.weights.values():
            assert weight >= 0.05 - 0.01  # Allow small tolerance
            assert weight <= 0.40 + 0.01

    def test_mean_variance_target_return(self, optimizer, sample_data):
        """Test optimization with target return."""
        symbols, expected_returns, cov_matrix = sample_data

        constraints = OptimizationConstraints(target_return=0.08)

        result = optimizer.mean_variance_optimization(
            symbols,
            expected_returns,
            cov_matrix,
            objective=OptimizationObjective.TARGET_RETURN,
            constraints=constraints,
        )

        assert result.success
        assert abs(result.expected_return - 0.08) < 0.01

    def test_risk_parity_optimization(self, optimizer, sample_data):
        """Test risk parity optimization."""
        symbols, _, cov_matrix = sample_data

        result = optimizer.risk_parity_optimization(symbols, cov_matrix)

        assert result.success
        assert len(result.weights) == len(symbols)

        # Weights should sum to 1
        total_weight = sum(result.weights.values())
        assert abs(total_weight - 1.0) < 0.01

    def test_black_litterman_optimization(self, optimizer, sample_data):
        """Test Black-Litterman optimization."""
        symbols, _, cov_matrix = sample_data
        market_cap_weights = np.array([0.3, 0.25, 0.15, 0.15, 0.15])

        # View: AAPL will outperform (10% expected return, high confidence)
        views = [(0, 0.15, 0.8)]  # (asset_idx, view_return, confidence)

        result = optimizer.black_litterman_optimization(
            symbols,
            market_cap_weights,
            cov_matrix,
            views=views,
        )

        assert result.success
        # AAPL should have higher weight than equilibrium due to positive view
        assert result.weights["AAPL"] >= 0.25

    def test_black_litterman_no_views(self, optimizer, sample_data):
        """Test Black-Litterman with no views (should return equilibrium)."""
        symbols, _, cov_matrix = sample_data
        market_cap_weights = np.array([0.3, 0.25, 0.15, 0.15, 0.15])

        result = optimizer.black_litterman_optimization(
            symbols,
            market_cap_weights,
            cov_matrix,
        )

        assert result.success

    def test_efficient_frontier(self, optimizer, sample_data):
        """Test efficient frontier generation."""
        symbols, expected_returns, cov_matrix = sample_data

        frontier = optimizer.efficient_frontier(
            symbols,
            expected_returns,
            cov_matrix,
            n_points=10,
        )

        assert len(frontier) >= 5  # Should have multiple points

        # Returns should be increasing along frontier
        returns = [r.expected_return for r in frontier]
        assert all(r1 <= r2 for r1, r2 in zip(returns[:-1], returns[1:]))

    def test_marginal_contribution_to_risk(self, optimizer, sample_data):
        """Test marginal contribution to risk calculation."""
        _, _, cov_matrix = sample_data
        weights = np.array([0.2, 0.2, 0.2, 0.2, 0.2])

        mcr = optimizer.calculate_marginal_contribution_to_risk(weights, cov_matrix)

        assert len(mcr) == len(weights)
        assert all(m >= 0 for m in mcr)  # MCR should be positive for long positions

    def test_risk_contribution(self, optimizer, sample_data):
        """Test risk contribution calculation."""
        _, _, cov_matrix = sample_data
        weights = np.array([0.2, 0.2, 0.2, 0.2, 0.2])

        abs_contrib, pct_contrib = optimizer.calculate_risk_contribution(weights, cov_matrix)

        assert len(abs_contrib) == len(weights)
        assert len(pct_contrib) == len(weights)

        # Percentage contributions should sum to 1
        assert abs(sum(pct_contrib) - 1.0) < 0.01


class TestLiquidityAnalyzer:
    """Tests for LiquidityAnalyzer class."""

    @pytest.fixture
    def analyzer(self):
        """Create a liquidity analyzer."""
        return LiquidityAnalyzer()

    def test_estimate_market_impact(self, analyzer):
        """Test market impact estimation."""
        impact = analyzer.estimate_market_impact(
            shares_to_trade=100000,
            adv=1000000,  # 10% of ADV
            spread_bps=10,
            volatility=0.02,
            participation_rate=0.10,
        )

        assert "pct_adv" in impact
        assert "days_to_trade" in impact
        assert "market_impact_bps" in impact
        assert "total_cost_bps" in impact

        assert impact["pct_adv"] == pytest.approx(0.10, rel=0.01)
        assert impact["days_to_trade"] == pytest.approx(1.0, rel=0.01)
        assert impact["market_impact_bps"] > 0

    def test_estimate_market_impact_zero_adv(self, analyzer):
        """Test market impact with zero ADV."""
        impact = analyzer.estimate_market_impact(
            shares_to_trade=100000,
            adv=0,
        )

        assert impact["pct_adv"] == float("inf")
        assert impact["days_to_trade"] == float("inf")

    def test_calculate_liquidity_score(self, analyzer):
        """Test liquidity score calculation."""
        positions = {
            "AAPL": (1000000, 50000000),  # Very liquid
            "SMALL": (100000, 100000),  # Less liquid
        }

        score = analyzer.calculate_liquidity_score(positions)

        assert "liquidity_score" in score
        assert "weighted_pct_adv" in score
        assert "max_pct_adv" in score
        assert 0 <= score["liquidity_score"] <= 100

    def test_calculate_liquidity_score_empty(self, analyzer):
        """Test liquidity score for empty portfolio."""
        score = analyzer.calculate_liquidity_score({})

        assert score["liquidity_score"] == 100
        assert score["weighted_pct_adv"] == 0

    def test_crowding_analysis(self, analyzer):
        """Test crowding analysis."""
        positions = {
            "AAPL": 100000,
            "CROWDED": 50000,
        }
        hf_ownership = {
            "AAPL": 0.15,  # 15% HF ownership
            "CROWDED": 0.35,  # 35% HF ownership - crowded
        }

        crowding = analyzer.crowding_analysis(positions, hf_ownership)

        assert "AAPL" in crowding
        assert "CROWDED" in crowding
        assert crowding["CROWDED"] > crowding["AAPL"]  # Crowded should have higher score
