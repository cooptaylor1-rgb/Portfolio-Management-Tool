"""Portfolio optimization module.

This module provides portfolio construction and optimization capabilities
including mean-variance optimization, Black-Litterman, and risk parity.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

import numpy as np
from numpy.typing import NDArray
from scipy import optimize

# Constants
BASIS_POINTS_PER_UNIT = 10000  # Conversion factor: 1 = 10000 bps


class OptimizationObjective(Enum):
    """Optimization objectives."""

    MAX_SHARPE = "maximize_sharpe_ratio"
    MIN_VARIANCE = "minimize_variance"
    MAX_RETURN = "maximize_return"
    RISK_PARITY = "risk_parity"
    TARGET_RETURN = "target_return"
    TARGET_VOLATILITY = "target_volatility"


@dataclass
class OptimizationConstraints:
    """Constraints for portfolio optimization.

    Attributes:
        min_weight: Minimum weight per asset.
        max_weight: Maximum weight per asset.
        max_sector_weight: Maximum weight per sector.
        max_factor_exposure: Maximum factor exposure limits.
        target_return: Target portfolio return.
        target_volatility: Target portfolio volatility.
        long_only: Whether to allow short positions.
        max_turnover: Maximum portfolio turnover.
        min_positions: Minimum number of positions.
        max_positions: Maximum number of positions.
        custom_constraints: Additional custom constraints.
    """

    min_weight: float = 0.0
    max_weight: float = 1.0
    max_sector_weight: Optional[float] = None
    max_factor_exposure: Optional[dict[str, float]] = None
    target_return: Optional[float] = None
    target_volatility: Optional[float] = None
    long_only: bool = True
    max_turnover: Optional[float] = None
    min_positions: Optional[int] = None
    max_positions: Optional[int] = None
    custom_constraints: list = field(default_factory=list)


@dataclass
class OptimizationResult:
    """Result of portfolio optimization.

    Attributes:
        weights: Optimal portfolio weights.
        expected_return: Expected portfolio return.
        expected_volatility: Expected portfolio volatility.
        sharpe_ratio: Expected Sharpe ratio.
        success: Whether optimization succeeded.
        message: Optimization status message.
        iterations: Number of iterations.
    """

    weights: dict[str, float]
    expected_return: float
    expected_volatility: float
    sharpe_ratio: float
    success: bool
    message: str = ""
    iterations: int = 0


class PortfolioOptimizer:
    """Portfolio optimization engine.

    This class provides various portfolio optimization methods
    including mean-variance, Black-Litterman, and risk parity.
    """

    def __init__(self, risk_free_rate: float = 0.05) -> None:
        """Initialize the optimizer.

        Args:
            risk_free_rate: Annual risk-free rate.
        """
        self.risk_free_rate = risk_free_rate
        self.trading_days_per_year = 252

    def calculate_portfolio_stats(
        self,
        weights: NDArray[np.float64],
        expected_returns: NDArray[np.float64],
        cov_matrix: NDArray[np.float64],
    ) -> tuple[float, float, float]:
        """Calculate portfolio expected return, volatility, and Sharpe ratio.

        Args:
            weights: Portfolio weights.
            expected_returns: Expected returns per asset (annualized).
            cov_matrix: Covariance matrix (annualized).

        Returns:
            Tuple of (expected_return, volatility, sharpe_ratio).
        """
        portfolio_return = float(np.dot(weights, expected_returns))
        portfolio_vol = float(np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights))))

        if portfolio_vol == 0:
            sharpe = 0.0
        else:
            sharpe = (portfolio_return - self.risk_free_rate) / portfolio_vol

        return portfolio_return, portfolio_vol, sharpe

    def mean_variance_optimization(
        self,
        symbols: list[str],
        expected_returns: NDArray[np.float64],
        cov_matrix: NDArray[np.float64],
        objective: OptimizationObjective = OptimizationObjective.MAX_SHARPE,
        constraints: Optional[OptimizationConstraints] = None,
    ) -> OptimizationResult:
        """Perform mean-variance optimization.

        Args:
            symbols: List of asset symbols.
            expected_returns: Expected returns per asset (annualized).
            cov_matrix: Covariance matrix (annualized).
            objective: Optimization objective.
            constraints: Optimization constraints.

        Returns:
            OptimizationResult with optimal weights.
        """
        n_assets = len(symbols)
        if constraints is None:
            constraints = OptimizationConstraints()

        # Initial weights (equal weight)
        init_weights = np.array([1.0 / n_assets] * n_assets)

        # Bounds
        if constraints.long_only:
            bounds = tuple(
                (max(0, constraints.min_weight), constraints.max_weight)
                for _ in range(n_assets)
            )
        else:
            bounds = tuple(
                (constraints.min_weight, constraints.max_weight) for _ in range(n_assets)
            )

        # Constraints list
        opt_constraints = [{"type": "eq", "fun": lambda x: np.sum(x) - 1}]

        # Add target return constraint if specified
        if objective == OptimizationObjective.TARGET_RETURN and constraints.target_return:
            opt_constraints.append(
                {
                    "type": "eq",
                    "fun": lambda x: np.dot(x, expected_returns) - constraints.target_return,
                }
            )

        # Add target volatility constraint if specified
        if objective == OptimizationObjective.TARGET_VOLATILITY and constraints.target_volatility:
            opt_constraints.append(
                {
                    "type": "eq",
                    "fun": lambda x: np.sqrt(np.dot(x.T, np.dot(cov_matrix, x)))
                    - constraints.target_volatility,
                }
            )

        # Define objective function
        if objective == OptimizationObjective.MAX_SHARPE:

            def neg_sharpe(weights):
                ret = np.dot(weights, expected_returns)
                vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
                if vol == 0:
                    return 0
                return -(ret - self.risk_free_rate) / vol

            obj_func = neg_sharpe

        elif objective == OptimizationObjective.MIN_VARIANCE:

            def portfolio_variance(weights):
                return np.dot(weights.T, np.dot(cov_matrix, weights))

            obj_func = portfolio_variance

        elif objective == OptimizationObjective.MAX_RETURN:

            def neg_return(weights):
                return -np.dot(weights, expected_returns)

            obj_func = neg_return

        elif objective in [
            OptimizationObjective.TARGET_RETURN,
            OptimizationObjective.TARGET_VOLATILITY,
        ]:
            # For target return/vol, minimize variance subject to constraint

            def portfolio_variance(weights):
                return np.dot(weights.T, np.dot(cov_matrix, weights))

            obj_func = portfolio_variance

        else:
            raise ValueError(f"Unsupported objective: {objective}")

        # Run optimization
        result = optimize.minimize(
            obj_func,
            init_weights,
            method="SLSQP",
            bounds=bounds,
            constraints=opt_constraints,
            options={"maxiter": 1000, "ftol": 1e-9},
        )

        if result.success:
            optimal_weights = result.x
            exp_ret, exp_vol, sharpe = self.calculate_portfolio_stats(
                optimal_weights, expected_returns, cov_matrix
            )

            return OptimizationResult(
                weights=dict(zip(symbols, optimal_weights.tolist())),
                expected_return=exp_ret,
                expected_volatility=exp_vol,
                sharpe_ratio=sharpe,
                success=True,
                message="Optimization successful",
                iterations=result.nit,
            )
        else:
            return OptimizationResult(
                weights=dict(zip(symbols, init_weights.tolist())),
                expected_return=0.0,
                expected_volatility=0.0,
                sharpe_ratio=0.0,
                success=False,
                message=result.message,
                iterations=result.nit,
            )

    def risk_parity_optimization(
        self,
        symbols: list[str],
        cov_matrix: NDArray[np.float64],
        risk_budget: Optional[NDArray[np.float64]] = None,
    ) -> OptimizationResult:
        """Perform risk parity optimization.

        Risk parity allocates capital such that each asset contributes
        equally to total portfolio risk.

        Args:
            symbols: List of asset symbols.
            cov_matrix: Covariance matrix (annualized).
            risk_budget: Optional risk budget per asset (defaults to equal).

        Returns:
            OptimizationResult with risk parity weights.
        """
        n_assets = len(symbols)

        if risk_budget is None:
            risk_budget = np.array([1.0 / n_assets] * n_assets)

        init_weights = np.array([1.0 / n_assets] * n_assets)

        def risk_contribution(weights):
            """Calculate risk contribution of each asset."""
            portfolio_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
            if portfolio_vol == 0:
                return np.zeros(n_assets)
            marginal_risk = np.dot(cov_matrix, weights) / portfolio_vol
            return weights * marginal_risk

        def risk_parity_objective(weights):
            """Objective: minimize squared deviation from target risk budget."""
            rc = risk_contribution(weights)
            total_risk = np.sum(rc)
            if total_risk == 0:
                return 0
            rc_pct = rc / total_risk
            return np.sum((rc_pct - risk_budget) ** 2)

        bounds = tuple((0.01, 1.0) for _ in range(n_assets))
        constraints = [{"type": "eq", "fun": lambda x: np.sum(x) - 1}]

        result = optimize.minimize(
            risk_parity_objective,
            init_weights,
            method="SLSQP",
            bounds=bounds,
            constraints=constraints,
            options={"maxiter": 1000, "ftol": 1e-10},
        )

        if result.success:
            optimal_weights = result.x
            # Calculate portfolio stats (assume 0 expected return for risk parity)
            portfolio_vol = float(
                np.sqrt(np.dot(optimal_weights.T, np.dot(cov_matrix, optimal_weights)))
            )

            return OptimizationResult(
                weights=dict(zip(symbols, optimal_weights.tolist())),
                expected_return=0.0,  # Risk parity doesn't optimize for return
                expected_volatility=portfolio_vol,
                sharpe_ratio=0.0,
                success=True,
                message="Risk parity optimization successful",
                iterations=result.nit,
            )
        else:
            return OptimizationResult(
                weights=dict(zip(symbols, init_weights.tolist())),
                expected_return=0.0,
                expected_volatility=0.0,
                sharpe_ratio=0.0,
                success=False,
                message=result.message,
                iterations=result.nit,
            )

    def black_litterman_optimization(
        self,
        symbols: list[str],
        market_cap_weights: NDArray[np.float64],
        cov_matrix: NDArray[np.float64],
        views: Optional[list[tuple[int, float, float]]] = None,
        tau: float = 0.05,
        risk_aversion: float = 2.5,
    ) -> OptimizationResult:
        """Perform Black-Litterman optimization.

        The Black-Litterman model combines market equilibrium with
        investor views to generate expected returns.

        Args:
            symbols: List of asset symbols.
            market_cap_weights: Market cap weights for equilibrium.
            cov_matrix: Covariance matrix (annualized).
            views: List of views as (asset_index, expected_return, confidence).
            tau: Scaling factor for uncertainty (typically 0.01-0.1).
            risk_aversion: Market risk aversion coefficient.

        Returns:
            OptimizationResult with Black-Litterman weights.
        """
        n_assets = len(symbols)

        # Calculate implied equilibrium returns (reverse optimization)
        pi = risk_aversion * np.dot(cov_matrix, market_cap_weights)

        # If no views, use equilibrium returns
        if views is None or len(views) == 0:
            bl_returns = pi
        else:
            # Construct pick_matrix, view_returns, and omega (view uncertainty)
            n_views = len(views)
            pick_matrix = np.zeros((n_views, n_assets))
            view_returns = np.zeros(n_views)
            omega_diag = np.zeros(n_views)

            for i, (asset_idx, view_return, confidence) in enumerate(views):
                pick_matrix[i, asset_idx] = 1.0
                view_returns[i] = view_return
                # Omega diagonal: lower confidence = higher uncertainty
                omega_diag[i] = (1.0 / confidence) * tau * cov_matrix[asset_idx, asset_idx]

            omega = np.diag(omega_diag)

            # Black-Litterman formula
            tau_cov = tau * cov_matrix
            tau_cov_inv = np.linalg.inv(tau_cov)
            omega_inv = np.linalg.inv(omega)

            # Combined covariance
            combined_cov_inv = tau_cov_inv + np.dot(pick_matrix.T, np.dot(omega_inv, pick_matrix))
            combined_cov = np.linalg.inv(combined_cov_inv)

            # BL expected returns
            bl_returns = np.dot(
                combined_cov,
                np.dot(tau_cov_inv, pi) + np.dot(pick_matrix.T, np.dot(omega_inv, view_returns)),
            )

        # Now optimize with BL expected returns
        return self.mean_variance_optimization(
            symbols,
            bl_returns,
            cov_matrix,
            objective=OptimizationObjective.MAX_SHARPE,
        )

    def efficient_frontier(
        self,
        symbols: list[str],
        expected_returns: NDArray[np.float64],
        cov_matrix: NDArray[np.float64],
        n_points: int = 50,
        constraints: Optional[OptimizationConstraints] = None,
    ) -> list[OptimizationResult]:
        """Generate efficient frontier.

        Args:
            symbols: List of asset symbols.
            expected_returns: Expected returns per asset (annualized).
            cov_matrix: Covariance matrix (annualized).
            n_points: Number of points on the frontier.
            constraints: Optimization constraints.

        Returns:
            List of OptimizationResults along the frontier.
        """
        # Find min and max return portfolios
        min_ret_result = self.mean_variance_optimization(
            symbols,
            expected_returns,
            cov_matrix,
            objective=OptimizationObjective.MIN_VARIANCE,
            constraints=constraints,
        )

        max_ret_result = self.mean_variance_optimization(
            symbols,
            expected_returns,
            cov_matrix,
            objective=OptimizationObjective.MAX_RETURN,
            constraints=constraints,
        )

        min_ret = min_ret_result.expected_return
        max_ret = max_ret_result.expected_return

        if min_ret >= max_ret:
            return [min_ret_result]

        # Generate target returns
        target_returns = np.linspace(min_ret, max_ret, n_points)

        frontier = []
        for target in target_returns:
            if constraints is None:
                cons = OptimizationConstraints()
            else:
                cons = OptimizationConstraints(
                    min_weight=constraints.min_weight,
                    max_weight=constraints.max_weight,
                    long_only=constraints.long_only,
                )
            cons.target_return = target

            result = self.mean_variance_optimization(
                symbols,
                expected_returns,
                cov_matrix,
                objective=OptimizationObjective.TARGET_RETURN,
                constraints=cons,
            )

            if result.success:
                frontier.append(result)

        return frontier

    def calculate_marginal_contribution_to_risk(
        self,
        weights: NDArray[np.float64],
        cov_matrix: NDArray[np.float64],
    ) -> NDArray[np.float64]:
        """Calculate marginal contribution to risk for each asset.

        Args:
            weights: Portfolio weights.
            cov_matrix: Covariance matrix.

        Returns:
            Array of marginal contributions to risk.
        """
        portfolio_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        if portfolio_vol == 0:
            return np.zeros(len(weights))
        return np.dot(cov_matrix, weights) / portfolio_vol

    def calculate_risk_contribution(
        self,
        weights: NDArray[np.float64],
        cov_matrix: NDArray[np.float64],
    ) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
        """Calculate absolute and percentage risk contribution.

        Args:
            weights: Portfolio weights.
            cov_matrix: Covariance matrix.

        Returns:
            Tuple of (absolute_contribution, percentage_contribution).
        """
        mcr = self.calculate_marginal_contribution_to_risk(weights, cov_matrix)
        absolute_contribution = weights * mcr
        total_risk = np.sum(absolute_contribution)

        if total_risk == 0:
            percentage_contribution = np.zeros(len(weights))
        else:
            percentage_contribution = absolute_contribution / total_risk

        return absolute_contribution, percentage_contribution


class LiquidityAnalyzer:
    """Analyze portfolio liquidity and market impact.

    This class provides tools for assessing liquidity risk
    and estimating trading costs.
    """

    def __init__(self) -> None:
        """Initialize the liquidity analyzer."""
        pass

    def estimate_market_impact(
        self,
        shares_to_trade: int,
        adv: int,
        spread_bps: float = 10.0,
        volatility: float = 0.02,
        participation_rate: float = 0.10,
    ) -> dict:
        """Estimate market impact of a trade.

        Uses a simplified square-root market impact model.

        Args:
            shares_to_trade: Number of shares to trade.
            adv: Average daily volume.
            spread_bps: Bid-ask spread in basis points.
            volatility: Daily volatility of the stock.
            participation_rate: Target participation rate.

        Returns:
            Dictionary with impact estimates.
        """
        if adv == 0:
            return {
                "pct_adv": float("inf"),
                "days_to_trade": float("inf"),
                "spread_cost_bps": spread_bps,
                "market_impact_bps": 0,
                "total_cost_bps": spread_bps,
            }

        pct_adv = shares_to_trade / adv
        days_to_trade = shares_to_trade / (adv * participation_rate)

        # Square-root impact model
        # Impact = volatility * sqrt(pct_adv)
        market_impact_bps = volatility * np.sqrt(pct_adv) * BASIS_POINTS_PER_UNIT

        total_cost_bps = (spread_bps / 2) + market_impact_bps

        return {
            "pct_adv": pct_adv,
            "days_to_trade": days_to_trade,
            "spread_cost_bps": spread_bps / 2,
            "market_impact_bps": market_impact_bps,
            "total_cost_bps": total_cost_bps,
        }

    def calculate_liquidity_score(
        self,
        positions: dict[str, tuple[float, int]],  # symbol -> (value, adv)
    ) -> dict:
        """Calculate portfolio liquidity metrics.

        Args:
            positions: Dict mapping symbol to (position_value, average_daily_volume).

        Returns:
            Dictionary with liquidity metrics.
        """
        if not positions:
            return {
                "weighted_pct_adv": 0.0,
                "max_pct_adv": 0.0,
                "days_to_liquidate_100pct": 0.0,
                "days_to_liquidate_10pct_participation": 0.0,
                "liquidity_score": 100,
            }

        total_value = sum(v for v, _ in positions.values())
        if total_value == 0:
            return {
                "weighted_pct_adv": 0.0,
                "max_pct_adv": 0.0,
                "days_to_liquidate_100pct": 0.0,
                "days_to_liquidate_10pct_participation": 0.0,
                "liquidity_score": 100,
            }

        pct_advs = []
        for _symbol, (value, adv) in positions.items():
            if adv > 0:
                pct_adv = value / adv  # Assumes $1 per share for simplicity
                pct_advs.append((value / total_value, pct_adv))
            else:
                pct_advs.append((value / total_value, float("inf")))

        weighted_pct_adv = sum(w * p for w, p in pct_advs if p != float("inf"))
        max_pct_adv = max((p for _, p in pct_advs if p != float("inf")), default=0)

        # Days to liquidate at 100% participation
        days_100pct = max_pct_adv

        # Days to liquidate at 10% participation
        days_10pct = days_100pct / 0.10 if days_100pct < float("inf") else float("inf")

        # Simple liquidity score (0-100, higher is more liquid)
        if weighted_pct_adv == 0:
            liquidity_score = 100
        elif weighted_pct_adv < 0.01:
            liquidity_score = 95
        elif weighted_pct_adv < 0.05:
            liquidity_score = 80
        elif weighted_pct_adv < 0.10:
            liquidity_score = 60
        elif weighted_pct_adv < 0.25:
            liquidity_score = 40
        else:
            liquidity_score = 20

        return {
            "weighted_pct_adv": weighted_pct_adv,
            "max_pct_adv": max_pct_adv,
            "days_to_liquidate_100pct": days_100pct,
            "days_to_liquidate_10pct_participation": days_10pct,
            "liquidity_score": liquidity_score,
        }

    def crowding_analysis(
        self,
        portfolio_positions: dict[str, float],  # symbol -> value
        hedge_fund_ownership: dict[str, float],  # symbol -> % owned by HFs
    ) -> dict[str, float]:
        """Analyze position crowding risk.

        Args:
            portfolio_positions: Portfolio position values.
            hedge_fund_ownership: Hedge fund ownership percentages.

        Returns:
            Dictionary mapping symbols to crowding scores.
        """
        crowding_scores = {}

        for symbol, _value in portfolio_positions.items():
            hf_ownership = hedge_fund_ownership.get(symbol, 0.0)

            # Simple crowding score: higher HF ownership = more crowded
            if hf_ownership > 0.30:
                score = 90  # Very crowded
            elif hf_ownership > 0.20:
                score = 70  # Crowded
            elif hf_ownership > 0.10:
                score = 50  # Moderate
            elif hf_ownership > 0.05:
                score = 30  # Low
            else:
                score = 10  # Uncrowded

            crowding_scores[symbol] = score

        return crowding_scores
