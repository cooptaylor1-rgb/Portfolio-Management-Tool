"""Risk analytics module for portfolio management.

This module provides comprehensive risk analysis including VaR, volatility,
beta, factor analysis, and stress testing capabilities.
"""

from dataclasses import dataclass
from datetime import date
from enum import Enum
from typing import Optional

import numpy as np
from numpy.typing import NDArray
from scipy import stats


class RiskMetricType(Enum):
    """Types of risk metrics."""

    VAR = "value_at_risk"
    CVAR = "conditional_value_at_risk"
    VOLATILITY = "volatility"
    BETA = "beta"
    SHARPE = "sharpe_ratio"
    SORTINO = "sortino_ratio"
    MAX_DRAWDOWN = "maximum_drawdown"
    TRACKING_ERROR = "tracking_error"
    INFORMATION_RATIO = "information_ratio"


@dataclass
class RiskMetrics:
    """Container for portfolio risk metrics.

    Attributes:
        as_of_date: Date of the risk calculation.
        volatility_annual: Annualized volatility.
        var_95: Value at Risk at 95% confidence.
        var_99: Value at Risk at 99% confidence.
        cvar_95: Conditional VaR at 95% confidence.
        cvar_99: Conditional VaR at 99% confidence.
        beta: Portfolio beta to benchmark.
        sharpe_ratio: Sharpe ratio.
        sortino_ratio: Sortino ratio.
        max_drawdown: Maximum drawdown.
        calmar_ratio: Calmar ratio.
        tracking_error: Tracking error vs benchmark.
        information_ratio: Information ratio.
        downside_deviation: Downside deviation.
        upside_capture: Upside capture ratio.
        downside_capture: Downside capture ratio.
    """

    as_of_date: date
    volatility_annual: Optional[float] = None
    var_95: Optional[float] = None
    var_99: Optional[float] = None
    cvar_95: Optional[float] = None
    cvar_99: Optional[float] = None
    beta: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    calmar_ratio: Optional[float] = None
    tracking_error: Optional[float] = None
    information_ratio: Optional[float] = None
    downside_deviation: Optional[float] = None
    upside_capture: Optional[float] = None
    downside_capture: Optional[float] = None


@dataclass
class FactorExposures:
    """Container for factor exposures (Barra-style).

    Attributes:
        as_of_date: Date of the factor analysis.
        market: Market factor exposure (beta).
        size: Size factor exposure (SMB).
        value: Value factor exposure (HML).
        momentum: Momentum factor exposure.
        quality: Quality factor exposure.
        low_volatility: Low volatility factor exposure.
        growth: Growth factor exposure.
        dividend_yield: Dividend yield factor exposure.
        liquidity: Liquidity factor exposure.
    """

    as_of_date: date
    market: Optional[float] = None
    size: Optional[float] = None
    value: Optional[float] = None
    momentum: Optional[float] = None
    quality: Optional[float] = None
    low_volatility: Optional[float] = None
    growth: Optional[float] = None
    dividend_yield: Optional[float] = None
    liquidity: Optional[float] = None


@dataclass
class FixedIncomeRisk:
    """Fixed income specific risk metrics.

    Attributes:
        as_of_date: Date of the calculation.
        duration: Modified duration.
        convexity: Convexity measure.
        key_rate_durations: Key rate durations by tenor.
        dv01: Dollar value of a basis point.
        spread_duration: Spread duration.
        oas: Option-adjusted spread.
        credit_var: Credit VaR.
    """

    as_of_date: date
    duration: Optional[float] = None
    convexity: Optional[float] = None
    key_rate_durations: Optional[dict[str, float]] = None
    dv01: Optional[float] = None
    spread_duration: Optional[float] = None
    oas: Optional[float] = None
    credit_var: Optional[float] = None


class RiskAnalyzer:
    """Risk analysis engine for portfolio analytics.

    This class provides methods to calculate various risk metrics
    for portfolios of equities and fixed income securities.
    """

    TRADING_DAYS_PER_YEAR = 252

    def __init__(self, risk_free_rate: float = 0.05) -> None:
        """Initialize the risk analyzer.

        Args:
            risk_free_rate: Annual risk-free rate for calculations.
        """
        self.risk_free_rate = risk_free_rate

    def calculate_returns(
        self,
        prices: NDArray[np.float64],
        method: str = "log",
    ) -> NDArray[np.float64]:
        """Calculate returns from price series.

        Args:
            prices: Array of prices.
            method: Return calculation method ('log' or 'simple').

        Returns:
            Array of returns.
        """
        if method == "log":
            return np.diff(np.log(prices))
        return np.diff(prices) / prices[:-1]

    def calculate_volatility(
        self,
        returns: NDArray[np.float64],
        annualize: bool = True,
    ) -> float:
        """Calculate volatility from returns.

        Args:
            returns: Array of returns.
            annualize: Whether to annualize the volatility.

        Returns:
            Volatility as a decimal.
        """
        vol = np.std(returns, ddof=1)
        if annualize:
            vol *= np.sqrt(self.TRADING_DAYS_PER_YEAR)
        return float(vol)

    def calculate_var(
        self,
        returns: NDArray[np.float64],
        confidence_level: float = 0.95,
        method: str = "historical",
        portfolio_value: float = 1.0,
    ) -> float:
        """Calculate Value at Risk.

        Args:
            returns: Array of returns.
            confidence_level: Confidence level (e.g., 0.95 for 95%).
            method: VaR method ('historical', 'parametric', 'monte_carlo').
            portfolio_value: Portfolio value for dollar VaR.

        Returns:
            VaR as a positive number (potential loss).
        """
        if method == "historical":
            var = -np.percentile(returns, (1 - confidence_level) * 100)
        elif method == "parametric":
            mu = np.mean(returns)
            sigma = np.std(returns, ddof=1)
            var = -(mu + stats.norm.ppf(1 - confidence_level) * sigma)
        elif method == "monte_carlo":
            mu = np.mean(returns)
            sigma = np.std(returns, ddof=1)
            simulated = np.random.normal(mu, sigma, 10000)
            var = -np.percentile(simulated, (1 - confidence_level) * 100)
        else:
            raise ValueError(f"Unknown VaR method: {method}")

        return float(var * portfolio_value)

    def calculate_cvar(
        self,
        returns: NDArray[np.float64],
        confidence_level: float = 0.95,
        portfolio_value: float = 1.0,
    ) -> float:
        """Calculate Conditional Value at Risk (Expected Shortfall).

        Args:
            returns: Array of returns.
            confidence_level: Confidence level.
            portfolio_value: Portfolio value for dollar CVaR.

        Returns:
            CVaR as a positive number (expected loss beyond VaR).
        """
        threshold = np.percentile(returns, (1 - confidence_level) * 100)
        tail_returns = returns[returns <= threshold]
        if len(tail_returns) == 0:
            return self.calculate_var(returns, confidence_level)
        cvar = -np.mean(tail_returns)
        return float(cvar * portfolio_value)

    def calculate_beta(
        self,
        returns: NDArray[np.float64],
        benchmark_returns: NDArray[np.float64],
    ) -> float:
        """Calculate beta relative to benchmark.

        Args:
            returns: Portfolio returns.
            benchmark_returns: Benchmark returns.

        Returns:
            Beta coefficient.
        """
        if len(returns) != len(benchmark_returns):
            min_len = min(len(returns), len(benchmark_returns))
            returns = returns[:min_len]
            benchmark_returns = benchmark_returns[:min_len]

        covariance = np.cov(returns, benchmark_returns)[0, 1]
        benchmark_variance = np.var(benchmark_returns, ddof=1)

        if benchmark_variance == 0:
            return 0.0

        return float(covariance / benchmark_variance)

    def calculate_alpha(
        self,
        returns: NDArray[np.float64],
        benchmark_returns: NDArray[np.float64],
        beta: Optional[float] = None,
    ) -> float:
        """Calculate Jensen's alpha.

        Args:
            returns: Portfolio returns.
            benchmark_returns: Benchmark returns.
            beta: Pre-calculated beta (optional).

        Returns:
            Annualized alpha.
        """
        if beta is None:
            beta = self.calculate_beta(returns, benchmark_returns)

        rf_daily = self.risk_free_rate / self.TRADING_DAYS_PER_YEAR
        portfolio_excess = np.mean(returns) - rf_daily
        benchmark_excess = np.mean(benchmark_returns) - rf_daily

        daily_alpha = portfolio_excess - beta * benchmark_excess
        return float(daily_alpha * self.TRADING_DAYS_PER_YEAR)

    def calculate_sharpe_ratio(
        self,
        returns: NDArray[np.float64],
    ) -> float:
        """Calculate Sharpe ratio.

        Args:
            returns: Array of returns.

        Returns:
            Annualized Sharpe ratio.
        """
        rf_daily = self.risk_free_rate / self.TRADING_DAYS_PER_YEAR
        excess_returns = returns - rf_daily
        mean_excess = np.mean(excess_returns)
        std_excess = np.std(excess_returns, ddof=1)

        if std_excess == 0:
            return 0.0

        sharpe = mean_excess / std_excess
        return float(sharpe * np.sqrt(self.TRADING_DAYS_PER_YEAR))

    def calculate_sortino_ratio(
        self,
        returns: NDArray[np.float64],
        target_return: float = 0.0,
    ) -> float:
        """Calculate Sortino ratio using downside deviation.

        Args:
            returns: Array of returns.
            target_return: Target return for downside calculation.

        Returns:
            Annualized Sortino ratio.
        """
        rf_daily = self.risk_free_rate / self.TRADING_DAYS_PER_YEAR
        excess_returns = returns - rf_daily
        mean_excess = np.mean(excess_returns)

        downside_returns = excess_returns[excess_returns < target_return]
        if len(downside_returns) == 0:
            return float("inf") if mean_excess > 0 else 0.0

        downside_dev = np.sqrt(np.mean(downside_returns**2))

        if downside_dev == 0:
            return float("inf") if mean_excess > 0 else 0.0

        sortino = mean_excess / downside_dev
        return float(sortino * np.sqrt(self.TRADING_DAYS_PER_YEAR))

    def calculate_max_drawdown(
        self,
        prices: NDArray[np.float64],
    ) -> tuple[float, int, int]:
        """Calculate maximum drawdown.

        Args:
            prices: Array of prices or portfolio values.

        Returns:
            Tuple of (max_drawdown, peak_index, trough_index).
        """
        cumulative_max = np.maximum.accumulate(prices)
        drawdowns = (prices - cumulative_max) / cumulative_max

        max_dd = float(np.min(drawdowns))
        trough_idx = int(np.argmin(drawdowns))
        peak_idx = int(np.argmax(prices[:trough_idx + 1]))

        return max_dd, peak_idx, trough_idx

    def calculate_calmar_ratio(
        self,
        returns: NDArray[np.float64],
        prices: NDArray[np.float64],
    ) -> float:
        """Calculate Calmar ratio (return / max drawdown).

        Args:
            returns: Array of returns.
            prices: Array of prices for drawdown calculation.

        Returns:
            Calmar ratio.
        """
        annual_return = float(np.mean(returns) * self.TRADING_DAYS_PER_YEAR)
        max_dd, _, _ = self.calculate_max_drawdown(prices)

        if max_dd == 0:
            return float("inf") if annual_return > 0 else 0.0

        return annual_return / abs(max_dd)

    def calculate_tracking_error(
        self,
        returns: NDArray[np.float64],
        benchmark_returns: NDArray[np.float64],
    ) -> float:
        """Calculate tracking error vs benchmark.

        Args:
            returns: Portfolio returns.
            benchmark_returns: Benchmark returns.

        Returns:
            Annualized tracking error.
        """
        if len(returns) != len(benchmark_returns):
            min_len = min(len(returns), len(benchmark_returns))
            returns = returns[:min_len]
            benchmark_returns = benchmark_returns[:min_len]

        excess_returns = returns - benchmark_returns
        te = np.std(excess_returns, ddof=1)
        return float(te * np.sqrt(self.TRADING_DAYS_PER_YEAR))

    def calculate_information_ratio(
        self,
        returns: NDArray[np.float64],
        benchmark_returns: NDArray[np.float64],
    ) -> float:
        """Calculate information ratio.

        Args:
            returns: Portfolio returns.
            benchmark_returns: Benchmark returns.

        Returns:
            Annualized information ratio.
        """
        if len(returns) != len(benchmark_returns):
            min_len = min(len(returns), len(benchmark_returns))
            returns = returns[:min_len]
            benchmark_returns = benchmark_returns[:min_len]

        excess_returns = returns - benchmark_returns
        mean_excess = np.mean(excess_returns)
        tracking_error = np.std(excess_returns, ddof=1)

        if tracking_error == 0:
            return float("inf") if mean_excess > 0 else 0.0

        ir = mean_excess / tracking_error
        return float(ir * np.sqrt(self.TRADING_DAYS_PER_YEAR))

    def calculate_capture_ratios(
        self,
        returns: NDArray[np.float64],
        benchmark_returns: NDArray[np.float64],
    ) -> tuple[float, float]:
        """Calculate upside and downside capture ratios.

        Args:
            returns: Portfolio returns.
            benchmark_returns: Benchmark returns.

        Returns:
            Tuple of (upside_capture, downside_capture).
        """
        if len(returns) != len(benchmark_returns):
            min_len = min(len(returns), len(benchmark_returns))
            returns = returns[:min_len]
            benchmark_returns = benchmark_returns[:min_len]

        # Upside capture: performance when benchmark is up
        up_mask = benchmark_returns > 0
        if np.sum(up_mask) > 0:
            portfolio_up = np.mean(returns[up_mask])
            benchmark_up = np.mean(benchmark_returns[up_mask])
            upside_capture = float((1 + portfolio_up) / (1 + benchmark_up))
        else:
            upside_capture = 1.0

        # Downside capture: performance when benchmark is down
        down_mask = benchmark_returns < 0
        if np.sum(down_mask) > 0:
            portfolio_down = np.mean(returns[down_mask])
            benchmark_down = np.mean(benchmark_returns[down_mask])
            downside_capture = float((1 + portfolio_down) / (1 + benchmark_down))
        else:
            downside_capture = 1.0

        return upside_capture, downside_capture

    def calculate_all_metrics(
        self,
        returns: NDArray[np.float64],
        prices: NDArray[np.float64],
        benchmark_returns: Optional[NDArray[np.float64]] = None,
    ) -> RiskMetrics:
        """Calculate all risk metrics for a portfolio.

        Args:
            returns: Portfolio returns.
            prices: Portfolio prices/values.
            benchmark_returns: Optional benchmark returns.

        Returns:
            RiskMetrics object with all calculated metrics.
        """
        metrics = RiskMetrics(as_of_date=date.today())

        metrics.volatility_annual = self.calculate_volatility(returns)
        metrics.var_95 = self.calculate_var(returns, 0.95)
        metrics.var_99 = self.calculate_var(returns, 0.99)
        metrics.cvar_95 = self.calculate_cvar(returns, 0.95)
        metrics.cvar_99 = self.calculate_cvar(returns, 0.99)
        metrics.sharpe_ratio = self.calculate_sharpe_ratio(returns)
        metrics.sortino_ratio = self.calculate_sortino_ratio(returns)
        metrics.max_drawdown, _, _ = self.calculate_max_drawdown(prices)
        metrics.calmar_ratio = self.calculate_calmar_ratio(returns, prices)
        metrics.downside_deviation = float(
            np.std(returns[returns < 0], ddof=1) * np.sqrt(self.TRADING_DAYS_PER_YEAR)
            if np.sum(returns < 0) > 1
            else 0.0
        )

        if benchmark_returns is not None:
            metrics.beta = self.calculate_beta(returns, benchmark_returns)
            metrics.tracking_error = self.calculate_tracking_error(returns, benchmark_returns)
            metrics.information_ratio = self.calculate_information_ratio(
                returns, benchmark_returns
            )
            metrics.upside_capture, metrics.downside_capture = self.calculate_capture_ratios(
                returns, benchmark_returns
            )

        return metrics

    def calculate_correlation_matrix(
        self,
        returns_dict: dict[str, NDArray[np.float64]],
    ) -> tuple[list[str], NDArray[np.float64]]:
        """Calculate correlation matrix for multiple assets.

        Args:
            returns_dict: Dictionary mapping symbols to return arrays.

        Returns:
            Tuple of (symbols list, correlation matrix).
        """
        symbols = list(returns_dict.keys())

        # Find minimum length
        min_len = min(len(r) for r in returns_dict.values())
        returns_matrix = np.array([returns_dict[s][:min_len] for s in symbols])

        corr_matrix = np.corrcoef(returns_matrix)
        return symbols, corr_matrix

    def calculate_portfolio_var(
        self,
        weights: NDArray[np.float64],
        returns_matrix: NDArray[np.float64],
        confidence_level: float = 0.95,
        portfolio_value: float = 1.0,
    ) -> float:
        """Calculate portfolio VaR considering correlations.

        Args:
            weights: Portfolio weights.
            returns_matrix: Matrix of asset returns (assets x time).
            confidence_level: Confidence level.
            portfolio_value: Portfolio value.

        Returns:
            Portfolio VaR.
        """
        portfolio_returns = np.dot(weights, returns_matrix)
        return self.calculate_var(
            portfolio_returns, confidence_level, "historical", portfolio_value
        )
