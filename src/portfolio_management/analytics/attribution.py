"""Attribution analysis module.

This module provides performance attribution capabilities including
sector attribution, factor attribution, and alpha/beta decomposition.
"""

from dataclasses import dataclass, field
from datetime import date
from enum import Enum
from typing import Optional

import numpy as np
from numpy.typing import NDArray


class AttributionFrequency(Enum):
    """Frequency for attribution analysis."""

    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class AttributionMethod(Enum):
    """Method for attribution calculation."""

    BRINSON_FACHLER = "brinson_fachler"
    BRINSON_HOOD_BEEBOWER = "brinson_hood_beebower"
    FACTOR_BASED = "factor_based"


@dataclass
class SectorAttribution:
    """Sector-level attribution results.

    Attributes:
        sector: Sector name.
        portfolio_weight: Portfolio weight in the sector.
        benchmark_weight: Benchmark weight in the sector.
        portfolio_return: Portfolio return in the sector.
        benchmark_return: Benchmark return in the sector.
        allocation_effect: Return from allocation decision.
        selection_effect: Return from security selection.
        interaction_effect: Interaction between allocation and selection.
        total_effect: Total attribution effect.
    """

    sector: str
    portfolio_weight: float
    benchmark_weight: float
    portfolio_return: float
    benchmark_return: float
    allocation_effect: float = 0.0
    selection_effect: float = 0.0
    interaction_effect: float = 0.0
    total_effect: float = 0.0


@dataclass
class FactorAttribution:
    """Factor-level attribution results.

    Attributes:
        factor: Factor name.
        factor_exposure: Portfolio exposure to the factor.
        factor_return: Factor return for the period.
        contribution: Factor contribution to portfolio return.
    """

    factor: str
    factor_exposure: float
    factor_return: float
    contribution: float


@dataclass
class AttributionResult:
    """Complete attribution analysis result.

    Attributes:
        period_start: Start of the attribution period.
        period_end: End of the attribution period.
        portfolio_return: Total portfolio return.
        benchmark_return: Total benchmark return.
        excess_return: Return above benchmark.
        sector_attribution: Sector-level attribution breakdown.
        factor_attribution: Factor-level attribution breakdown.
        alpha: Risk-adjusted excess return.
        beta_contribution: Return from beta exposure.
        selection_total: Total security selection effect.
        allocation_total: Total allocation effect.
        timing_contribution: Market timing contribution.
        transaction_cost_drag: Impact of transaction costs.
    """

    period_start: date
    period_end: date
    portfolio_return: float
    benchmark_return: float
    excess_return: float
    sector_attribution: list[SectorAttribution] = field(default_factory=list)
    factor_attribution: list[FactorAttribution] = field(default_factory=list)
    alpha: float = 0.0
    beta_contribution: float = 0.0
    selection_total: float = 0.0
    allocation_total: float = 0.0
    timing_contribution: float = 0.0
    transaction_cost_drag: float = 0.0


class AttributionAnalyzer:
    """Attribution analysis engine.

    This class provides methods to decompose portfolio returns
    into various attribution effects.
    """

    def __init__(self, risk_free_rate: float = 0.05) -> None:
        """Initialize the attribution analyzer.

        Args:
            risk_free_rate: Annual risk-free rate.
        """
        self.risk_free_rate = risk_free_rate
        self.trading_days_per_year = 252

    def calculate_brinson_fachler_attribution(
        self,
        portfolio_weights: dict[str, float],
        benchmark_weights: dict[str, float],
        portfolio_returns: dict[str, float],
        benchmark_returns: dict[str, float],
    ) -> list[SectorAttribution]:
        """Calculate Brinson-Fachler attribution by sector.

        The Brinson-Fachler method separates returns into:
        - Allocation: Did we overweight/underweight sectors that performed well?
        - Selection: Did we pick better securities within sectors?
        - Interaction: Combined effect of both decisions.

        Args:
            portfolio_weights: Dict mapping sector to portfolio weight.
            benchmark_weights: Dict mapping sector to benchmark weight.
            portfolio_returns: Dict mapping sector to portfolio return.
            benchmark_returns: Dict mapping sector to benchmark return.

        Returns:
            List of SectorAttribution results.
        """
        all_sectors = set(portfolio_weights.keys()) | set(benchmark_weights.keys())

        # Calculate total benchmark return for allocation effect
        total_benchmark_return = sum(
            benchmark_weights.get(s, 0.0) * benchmark_returns.get(s, 0.0)
            for s in all_sectors
        )

        attributions = []
        for sector in all_sectors:
            pw = portfolio_weights.get(sector, 0.0)
            bw = benchmark_weights.get(sector, 0.0)
            pr = portfolio_returns.get(sector, 0.0)
            br = benchmark_returns.get(sector, 0.0)

            # Allocation effect: weight difference times benchmark sector vs total
            allocation = (pw - bw) * (br - total_benchmark_return)

            # Selection effect: benchmark weight times security selection
            selection = bw * (pr - br)

            # Interaction effect: weight difference times selection
            interaction = (pw - bw) * (pr - br)

            total = allocation + selection + interaction

            attributions.append(
                SectorAttribution(
                    sector=sector,
                    portfolio_weight=pw,
                    benchmark_weight=bw,
                    portfolio_return=pr,
                    benchmark_return=br,
                    allocation_effect=allocation,
                    selection_effect=selection,
                    interaction_effect=interaction,
                    total_effect=total,
                )
            )

        return attributions

    def calculate_factor_attribution(
        self,
        portfolio_returns: NDArray[np.float64],
        factor_exposures: dict[str, float],
        factor_returns: dict[str, NDArray[np.float64]],
    ) -> list[FactorAttribution]:
        """Calculate factor-based attribution.

        Decomposes portfolio returns into factor contributions.

        Args:
            portfolio_returns: Array of portfolio returns.
            factor_exposures: Dict mapping factor to portfolio exposure.
            factor_returns: Dict mapping factor to return array.

        Returns:
            List of FactorAttribution results.
        """
        attributions = []

        for factor, exposure in factor_exposures.items():
            if factor in factor_returns:
                fr = factor_returns[factor]
                # Use same length
                min_len = min(len(portfolio_returns), len(fr))
                mean_factor_return = float(np.mean(fr[:min_len]))
                contribution = exposure * mean_factor_return

                attributions.append(
                    FactorAttribution(
                        factor=factor,
                        factor_exposure=exposure,
                        factor_return=mean_factor_return,
                        contribution=contribution,
                    )
                )

        return attributions

    def calculate_alpha_beta_decomposition(
        self,
        portfolio_returns: NDArray[np.float64],
        benchmark_returns: NDArray[np.float64],
    ) -> tuple[float, float, float]:
        """Decompose returns into alpha and beta components.

        Args:
            portfolio_returns: Array of portfolio returns.
            benchmark_returns: Array of benchmark returns.

        Returns:
            Tuple of (alpha, beta, beta_contribution).
        """
        if len(portfolio_returns) != len(benchmark_returns):
            min_len = min(len(portfolio_returns), len(benchmark_returns))
            portfolio_returns = portfolio_returns[:min_len]
            benchmark_returns = benchmark_returns[:min_len]

        # Calculate beta
        covariance = np.cov(portfolio_returns, benchmark_returns)[0, 1]
        benchmark_variance = np.var(benchmark_returns, ddof=1)

        beta = 0.0 if benchmark_variance == 0 else float(covariance / benchmark_variance)

        # Calculate alpha (Jensen's alpha)
        rf_daily = self.risk_free_rate / self.trading_days_per_year
        portfolio_excess = np.mean(portfolio_returns) - rf_daily
        benchmark_excess = np.mean(benchmark_returns) - rf_daily

        daily_alpha = portfolio_excess - beta * benchmark_excess
        alpha = float(daily_alpha * self.trading_days_per_year)

        # Beta contribution to total return
        beta_contribution = float(beta * np.mean(benchmark_returns) * self.trading_days_per_year)

        return alpha, beta, beta_contribution

    def calculate_timing_contribution(
        self,
        portfolio_weights_series: list[dict[str, float]],
        sector_returns_series: list[dict[str, float]],
    ) -> float:
        """Calculate market timing contribution.

        Measures value added from changing allocations over time.

        Args:
            portfolio_weights_series: Time series of portfolio weights.
            sector_returns_series: Time series of sector returns.

        Returns:
            Timing contribution to return.
        """
        if len(portfolio_weights_series) < 2:
            return 0.0

        timing_contribution = 0.0

        for i in range(1, len(portfolio_weights_series)):
            current_weights = portfolio_weights_series[i]
            prev_weights = portfolio_weights_series[i - 1]
            returns = sector_returns_series[i]

            for sector in current_weights:
                weight_change = current_weights.get(sector, 0.0) - prev_weights.get(sector, 0.0)
                sector_return = returns.get(sector, 0.0)
                timing_contribution += weight_change * sector_return

        return timing_contribution

    def calculate_transaction_cost_impact(
        self,
        trades: list[tuple[str, float, float]],  # (symbol, shares, cost_per_share)
        total_nav: float,
    ) -> float:
        """Calculate impact of transaction costs on returns.

        Args:
            trades: List of (symbol, shares, cost_per_share) tuples.
            total_nav: Total net asset value of portfolio.

        Returns:
            Transaction cost drag as a decimal.
        """
        if total_nav == 0:
            return 0.0

        total_cost = sum(abs(shares) * cost for _, shares, cost in trades)
        return -total_cost / total_nav

    def full_attribution_analysis(
        self,
        period_start: date,
        period_end: date,
        portfolio_returns: NDArray[np.float64],
        benchmark_returns: NDArray[np.float64],
        portfolio_weights: dict[str, float],
        benchmark_weights: dict[str, float],
        sector_portfolio_returns: dict[str, float],
        sector_benchmark_returns: dict[str, float],
        factor_exposures: Optional[dict[str, float]] = None,
        factor_returns: Optional[dict[str, NDArray[np.float64]]] = None,
        trades: Optional[list[tuple[str, float, float]]] = None,
        total_nav: float = 0.0,
    ) -> AttributionResult:
        """Run complete attribution analysis.

        Args:
            period_start: Start date of the period.
            period_end: End date of the period.
            portfolio_returns: Array of daily portfolio returns.
            benchmark_returns: Array of daily benchmark returns.
            portfolio_weights: Dict of sector weights in portfolio.
            benchmark_weights: Dict of sector weights in benchmark.
            sector_portfolio_returns: Dict of portfolio returns by sector.
            sector_benchmark_returns: Dict of benchmark returns by sector.
            factor_exposures: Optional factor exposures.
            factor_returns: Optional factor return series.
            trades: Optional list of trades for cost calculation.
            total_nav: Total NAV for cost calculation.

        Returns:
            Complete AttributionResult.
        """
        # Total returns
        total_portfolio_return = float(np.prod(1 + portfolio_returns) - 1)
        total_benchmark_return = float(np.prod(1 + benchmark_returns) - 1)
        excess_return = total_portfolio_return - total_benchmark_return

        # Sector attribution
        sector_attribution = self.calculate_brinson_fachler_attribution(
            portfolio_weights,
            benchmark_weights,
            sector_portfolio_returns,
            sector_benchmark_returns,
        )

        # Calculate totals from sector attribution
        selection_total = sum(s.selection_effect for s in sector_attribution)
        allocation_total = sum(s.allocation_effect for s in sector_attribution)

        # Alpha/beta decomposition
        alpha, beta, beta_contribution = self.calculate_alpha_beta_decomposition(
            portfolio_returns, benchmark_returns
        )

        # Factor attribution
        factor_attribution = []
        if factor_exposures and factor_returns:
            factor_attribution = self.calculate_factor_attribution(
                portfolio_returns, factor_exposures, factor_returns
            )

        # Transaction cost impact
        transaction_cost_drag = 0.0
        if trades and total_nav > 0:
            transaction_cost_drag = self.calculate_transaction_cost_impact(trades, total_nav)

        return AttributionResult(
            period_start=period_start,
            period_end=period_end,
            portfolio_return=total_portfolio_return,
            benchmark_return=total_benchmark_return,
            excess_return=excess_return,
            sector_attribution=sector_attribution,
            factor_attribution=factor_attribution,
            alpha=alpha,
            beta_contribution=beta_contribution,
            selection_total=selection_total,
            allocation_total=allocation_total,
            transaction_cost_drag=transaction_cost_drag,
        )


class IdeaTracker:
    """Track investment ideas and their performance.

    This class helps manage investment theses, catalysts, and KPIs.
    """

    @dataclass
    class Idea:
        """Represents an investment idea.

        Attributes:
            id: Unique identifier.
            symbol: Security symbol.
            thesis: Investment thesis description.
            catalysts: List of potential catalysts.
            kpis: Key performance indicators to track.
            conviction: Conviction score (1-5).
            entry_date: Date idea was initiated.
            entry_price: Entry price.
            target_price: Target price.
            stop_price: Stop loss price.
            current_price: Current price.
            status: Active, closed, or stopped.
            analyst: Analyst name.
            notes: Additional notes.
        """

        id: str
        symbol: str
        thesis: str
        catalysts: list[str] = field(default_factory=list)
        kpis: dict[str, float] = field(default_factory=dict)
        conviction: int = 3
        entry_date: Optional[date] = None
        entry_price: Optional[float] = None
        target_price: Optional[float] = None
        stop_price: Optional[float] = None
        current_price: Optional[float] = None
        status: str = "active"
        analyst: Optional[str] = None
        notes: str = ""

        @property
        def return_pct(self) -> Optional[float]:
            """Calculate current return percentage."""
            if self.entry_price and self.current_price:
                return (self.current_price - self.entry_price) / self.entry_price
            return None

        @property
        def upside_pct(self) -> Optional[float]:
            """Calculate upside to target."""
            if self.target_price and self.current_price:
                return (self.target_price - self.current_price) / self.current_price
            return None

        @property
        def risk_reward_ratio(self) -> Optional[float]:
            """Calculate risk/reward ratio."""
            if all([self.entry_price, self.target_price, self.stop_price]):
                upside = self.target_price - self.entry_price
                downside = self.entry_price - self.stop_price
                if downside > 0:
                    return upside / downside
            return None

    def __init__(self) -> None:
        """Initialize the idea tracker."""
        self.ideas: dict[str, IdeaTracker.Idea] = {}

    def add_idea(self, idea: "IdeaTracker.Idea") -> None:
        """Add an investment idea.

        Args:
            idea: The idea to add.
        """
        self.ideas[idea.id] = idea

    def get_idea(self, idea_id: str) -> Optional["IdeaTracker.Idea"]:
        """Get an idea by ID.

        Args:
            idea_id: The idea identifier.

        Returns:
            The idea, or None if not found.
        """
        return self.ideas.get(idea_id)

    def update_prices(self, prices: dict[str, float]) -> None:
        """Update current prices for all ideas.

        Args:
            prices: Dict mapping symbols to current prices.
        """
        for idea in self.ideas.values():
            if idea.symbol in prices:
                idea.current_price = prices[idea.symbol]

    def get_active_ideas(self) -> list["IdeaTracker.Idea"]:
        """Get all active ideas.

        Returns:
            List of active ideas.
        """
        return [i for i in self.ideas.values() if i.status == "active"]

    def get_ideas_by_conviction(self, min_conviction: int = 4) -> list["IdeaTracker.Idea"]:
        """Get ideas by minimum conviction level.

        Args:
            min_conviction: Minimum conviction score.

        Returns:
            List of high-conviction ideas.
        """
        return [i for i in self.ideas.values() if i.conviction >= min_conviction]

    def calculate_idea_performance(
        self,
        idea_id: str,
        price_series: NDArray[np.float64],
        dates: list[date],
    ) -> dict:
        """Calculate performance metrics for an idea.

        Args:
            idea_id: The idea identifier.
            price_series: Historical price series.
            dates: Corresponding dates.

        Returns:
            Dictionary of performance metrics.
        """
        idea = self.get_idea(idea_id)
        if not idea or not idea.entry_date:
            return {}

        # Find entry index
        entry_idx = None
        for i, d in enumerate(dates):
            if d >= idea.entry_date:
                entry_idx = i
                break

        if entry_idx is None:
            return {}

        prices_since_entry = price_series[entry_idx:]
        returns = np.diff(prices_since_entry) / prices_since_entry[:-1]

        # Calculate metrics
        total_return = float((prices_since_entry[-1] / prices_since_entry[0]) - 1)
        volatility = float(np.std(returns) * np.sqrt(252))
        max_price = float(np.max(prices_since_entry))
        min_price = float(np.min(prices_since_entry))
        max_drawdown = float((min_price - max_price) / max_price)

        return {
            "total_return": total_return,
            "volatility": volatility,
            "max_price": max_price,
            "min_price": min_price,
            "max_drawdown": max_drawdown,
            "days_held": len(prices_since_entry),
        }
