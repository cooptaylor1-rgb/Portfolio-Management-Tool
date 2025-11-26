"""Stress testing and scenario analysis module.

This module provides stress testing capabilities including historical
scenario replays and hypothetical shock scenarios.
"""

from dataclasses import dataclass, field
from datetime import date
from enum import Enum
from typing import Optional

import numpy as np
from numpy.typing import NDArray


class ScenarioType(Enum):
    """Types of stress scenarios."""

    HISTORICAL = "historical"
    HYPOTHETICAL = "hypothetical"
    CUSTOM = "custom"


@dataclass
class Scenario:
    """Represents a stress scenario.

    Attributes:
        name: Name of the scenario.
        scenario_type: Type of scenario.
        description: Detailed description of the scenario.
        equity_shock: Shock to equity markets (as decimal, e.g., -0.20 for -20%).
        rates_shock_bps: Interest rate shock in basis points.
        credit_spread_shock_bps: Credit spread widening in basis points.
        fx_shocks: Dictionary of currency pair shocks.
        commodity_shocks: Dictionary of commodity shocks.
        volatility_shock: Implied volatility shock (as absolute change in vol points).
        start_date: Start date for historical scenarios.
        end_date: End date for historical scenarios.
    """

    name: str
    scenario_type: ScenarioType
    description: str = ""
    equity_shock: float = 0.0
    rates_shock_bps: float = 0.0
    credit_spread_shock_bps: float = 0.0
    fx_shocks: dict[str, float] = field(default_factory=dict)
    commodity_shocks: dict[str, float] = field(default_factory=dict)
    volatility_shock: float = 0.0
    start_date: Optional[date] = None
    end_date: Optional[date] = None


@dataclass
class ScenarioResult:
    """Results from a scenario analysis.

    Attributes:
        scenario: The scenario that was run.
        portfolio_impact: Total portfolio P&L impact.
        equity_impact: Impact from equity positions.
        fixed_income_impact: Impact from fixed income positions.
        fx_impact: Impact from FX exposures.
        commodity_impact: Impact from commodity exposures.
        position_impacts: Per-position impact breakdown.
        risk_metrics_change: Change in risk metrics.
    """

    scenario: Scenario
    portfolio_impact: float
    equity_impact: float = 0.0
    fixed_income_impact: float = 0.0
    fx_impact: float = 0.0
    commodity_impact: float = 0.0
    position_impacts: dict[str, float] = field(default_factory=dict)
    risk_metrics_change: dict[str, float] = field(default_factory=dict)


# Pre-defined historical scenarios
HISTORICAL_SCENARIOS = {
    "GFC_2008": Scenario(
        name="Global Financial Crisis 2008",
        scenario_type=ScenarioType.HISTORICAL,
        description="Sept-Nov 2008 financial crisis period",
        equity_shock=-0.45,
        rates_shock_bps=-200,
        credit_spread_shock_bps=500,
        volatility_shock=60,
        start_date=date(2008, 9, 15),
        end_date=date(2008, 11, 20),
    ),
    "COVID_2020": Scenario(
        name="COVID Crash 2020",
        scenario_type=ScenarioType.HISTORICAL,
        description="Feb-Mar 2020 pandemic crash",
        equity_shock=-0.35,
        rates_shock_bps=-150,
        credit_spread_shock_bps=350,
        volatility_shock=65,
        start_date=date(2020, 2, 19),
        end_date=date(2020, 3, 23),
    ),
    "DOTCOM_2000": Scenario(
        name="Dot-Com Crash 2000",
        scenario_type=ScenarioType.HISTORICAL,
        description="Tech bubble burst 2000-2002",
        equity_shock=-0.50,
        rates_shock_bps=-300,
        credit_spread_shock_bps=200,
        volatility_shock=30,
        start_date=date(2000, 3, 10),
        end_date=date(2002, 10, 9),
    ),
    "INFLATION_2022": Scenario(
        name="Inflation Spike 2022",
        scenario_type=ScenarioType.HISTORICAL,
        description="2022 inflation and rate hiking cycle",
        equity_shock=-0.25,
        rates_shock_bps=300,
        credit_spread_shock_bps=150,
        volatility_shock=15,
        start_date=date(2022, 1, 1),
        end_date=date(2022, 10, 12),
    ),
    "FED_TAPER_2013": Scenario(
        name="Taper Tantrum 2013",
        scenario_type=ScenarioType.HISTORICAL,
        description="Fed tightening announcement shock",
        equity_shock=-0.08,
        rates_shock_bps=100,
        credit_spread_shock_bps=50,
        volatility_shock=8,
        start_date=date(2013, 5, 22),
        end_date=date(2013, 8, 30),
    ),
    "OIL_CRASH_2014": Scenario(
        name="Oil Price Crash 2014-2015",
        scenario_type=ScenarioType.HISTORICAL,
        description="Oil price collapse from $100+ to below $30",
        equity_shock=-0.10,
        rates_shock_bps=-50,
        credit_spread_shock_bps=200,
        commodity_shocks={"OIL": -0.70, "NATURAL_GAS": -0.30},
        start_date=date(2014, 6, 20),
        end_date=date(2016, 2, 11),
    ),
    "CHINA_DEVALUATION_2015": Scenario(
        name="China Devaluation 2015",
        scenario_type=ScenarioType.HISTORICAL,
        description="China CNY devaluation and growth concerns",
        equity_shock=-0.12,
        rates_shock_bps=-25,
        credit_spread_shock_bps=100,
        fx_shocks={"USD/CNY": 0.05, "USD/EUR": -0.03},
        start_date=date(2015, 8, 11),
        end_date=date(2016, 2, 11),
    ),
}

# Pre-defined hypothetical scenarios
HYPOTHETICAL_SCENARIOS = {
    "RATES_UP_200": Scenario(
        name="Rates +200bps",
        scenario_type=ScenarioType.HYPOTHETICAL,
        description="Parallel shift up in rates by 200 basis points",
        equity_shock=-0.10,
        rates_shock_bps=200,
        credit_spread_shock_bps=50,
    ),
    "RATES_DOWN_200": Scenario(
        name="Rates -200bps",
        scenario_type=ScenarioType.HYPOTHETICAL,
        description="Parallel shift down in rates by 200 basis points",
        equity_shock=0.05,
        rates_shock_bps=-200,
        credit_spread_shock_bps=-25,
    ),
    "EQUITY_VOL_40": Scenario(
        name="Equity Vol +40",
        scenario_type=ScenarioType.HYPOTHETICAL,
        description="VIX spike to 40",
        equity_shock=-0.15,
        volatility_shock=40,
        credit_spread_shock_bps=100,
    ),
    "EQUITY_VOL_80": Scenario(
        name="Equity Vol +80",
        scenario_type=ScenarioType.HYPOTHETICAL,
        description="VIX spike to 80 (crisis level)",
        equity_shock=-0.30,
        volatility_shock=80,
        credit_spread_shock_bps=250,
    ),
    "EQUITY_VOL_120": Scenario(
        name="Equity Vol +120",
        scenario_type=ScenarioType.HYPOTHETICAL,
        description="VIX spike to 120 (extreme crisis)",
        equity_shock=-0.45,
        volatility_shock=120,
        credit_spread_shock_bps=500,
    ),
    "CREDIT_CRISIS": Scenario(
        name="Credit Crisis",
        scenario_type=ScenarioType.HYPOTHETICAL,
        description="Major credit spread widening",
        equity_shock=-0.20,
        rates_shock_bps=-100,
        credit_spread_shock_bps=400,
    ),
    "STAGFLATION": Scenario(
        name="Stagflation",
        scenario_type=ScenarioType.HYPOTHETICAL,
        description="High inflation with weak growth",
        equity_shock=-0.25,
        rates_shock_bps=150,
        credit_spread_shock_bps=200,
        commodity_shocks={"OIL": 0.40, "GOLD": 0.20},
    ),
    "USD_CRISIS": Scenario(
        name="USD Crisis",
        scenario_type=ScenarioType.HYPOTHETICAL,
        description="Major USD weakness",
        equity_shock=-0.10,
        rates_shock_bps=50,
        fx_shocks={"USD/EUR": -0.15, "USD/JPY": -0.10, "USD/GBP": -0.12},
    ),
    "EM_CONTAGION": Scenario(
        name="EM Contagion",
        scenario_type=ScenarioType.HYPOTHETICAL,
        description="Emerging market crisis with contagion",
        equity_shock=-0.20,
        rates_shock_bps=-50,
        credit_spread_shock_bps=300,
        fx_shocks={"USD/BRL": 0.25, "USD/MXN": 0.20, "USD/ZAR": 0.30},
    ),
    "COMMODITY_CRASH": Scenario(
        name="Commodity Crash",
        scenario_type=ScenarioType.HYPOTHETICAL,
        description="Broad commodity price collapse",
        equity_shock=-0.15,
        rates_shock_bps=-100,
        commodity_shocks={"OIL": -0.40, "COPPER": -0.30, "IRON_ORE": -0.35},
    ),
}


class StressTestEngine:
    """Engine for running stress tests and scenario analysis.

    This class provides methods to run various stress scenarios
    on portfolios and analyze the potential impact.
    """

    def __init__(self) -> None:
        """Initialize the stress test engine."""
        self.scenarios: dict[str, Scenario] = {}
        self._load_default_scenarios()

    def _load_default_scenarios(self) -> None:
        """Load all pre-defined scenarios."""
        self.scenarios.update(HISTORICAL_SCENARIOS)
        self.scenarios.update(HYPOTHETICAL_SCENARIOS)

    def add_scenario(self, key: str, scenario: Scenario) -> None:
        """Add a custom scenario.

        Args:
            key: Unique identifier for the scenario.
            scenario: The scenario to add.
        """
        self.scenarios[key] = scenario

    def get_scenario(self, key: str) -> Optional[Scenario]:
        """Get a scenario by key.

        Args:
            key: The scenario key.

        Returns:
            The scenario, or None if not found.
        """
        return self.scenarios.get(key)

    def list_scenarios(self, scenario_type: Optional[ScenarioType] = None) -> list[str]:
        """List available scenarios.

        Args:
            scenario_type: Optional filter by scenario type.

        Returns:
            List of scenario keys.
        """
        if scenario_type is None:
            return list(self.scenarios.keys())
        return [k for k, v in self.scenarios.items() if v.scenario_type == scenario_type]

    def calculate_equity_impact(
        self,
        positions: dict[str, tuple[float, float]],  # symbol -> (value, beta)
        equity_shock: float,
    ) -> tuple[float, dict[str, float]]:
        """Calculate impact on equity positions.

        Args:
            positions: Dict mapping symbol to (market_value, beta).
            equity_shock: Market shock as decimal.

        Returns:
            Tuple of (total_impact, position_impacts).
        """
        total_impact = 0.0
        position_impacts: dict[str, float] = {}

        for symbol, (value, beta) in positions.items():
            impact = value * beta * equity_shock
            position_impacts[symbol] = impact
            total_impact += impact

        return total_impact, position_impacts

    def calculate_fixed_income_impact(
        self,
        positions: dict[str, tuple[float, float, float]],  # symbol -> (value, duration, convexity)
        rates_shock_bps: float,
        credit_spread_shock_bps: float = 0.0,
    ) -> tuple[float, dict[str, float]]:
        """Calculate impact on fixed income positions.

        Args:
            positions: Dict mapping symbol to (market_value, duration, convexity).
            rates_shock_bps: Interest rate shock in basis points.
            credit_spread_shock_bps: Credit spread shock in basis points.

        Returns:
            Tuple of (total_impact, position_impacts).
        """
        total_impact = 0.0
        position_impacts: dict[str, float] = {}

        total_shock_decimal = (rates_shock_bps + credit_spread_shock_bps) / 10000

        for symbol, (value, duration, convexity) in positions.items():
            # Duration effect
            duration_impact = -duration * total_shock_decimal * value

            # Convexity effect (second order)
            convexity_impact = 0.5 * convexity * (total_shock_decimal**2) * value

            impact = duration_impact + convexity_impact
            position_impacts[symbol] = impact
            total_impact += impact

        return total_impact, position_impacts

    def calculate_fx_impact(
        self,
        exposures: dict[str, float],  # currency_pair -> net_exposure
        fx_shocks: dict[str, float],
    ) -> tuple[float, dict[str, float]]:
        """Calculate impact from FX exposures.

        Args:
            exposures: Dict mapping currency pairs to net exposure.
            fx_shocks: Dict mapping currency pairs to shock amounts.

        Returns:
            Tuple of (total_impact, exposure_impacts).
        """
        total_impact = 0.0
        exposure_impacts: dict[str, float] = {}

        for pair, exposure in exposures.items():
            shock = fx_shocks.get(pair, 0.0)
            impact = exposure * shock
            exposure_impacts[pair] = impact
            total_impact += impact

        return total_impact, exposure_impacts

    def calculate_commodity_impact(
        self,
        exposures: dict[str, float],  # commodity -> net_exposure
        commodity_shocks: dict[str, float],
    ) -> tuple[float, dict[str, float]]:
        """Calculate impact from commodity exposures.

        Args:
            exposures: Dict mapping commodities to net exposure.
            commodity_shocks: Dict mapping commodities to shock amounts.

        Returns:
            Tuple of (total_impact, exposure_impacts).
        """
        total_impact = 0.0
        exposure_impacts: dict[str, float] = {}

        for commodity, exposure in exposures.items():
            shock = commodity_shocks.get(commodity, 0.0)
            impact = exposure * shock
            exposure_impacts[commodity] = impact
            total_impact += impact

        return total_impact, exposure_impacts

    def run_scenario(
        self,
        scenario: Scenario,
        equity_positions: Optional[dict[str, tuple[float, float]]] = None,
        fixed_income_positions: Optional[dict[str, tuple[float, float, float]]] = None,
        fx_exposures: Optional[dict[str, float]] = None,
        commodity_exposures: Optional[dict[str, float]] = None,
    ) -> ScenarioResult:
        """Run a stress scenario on portfolio positions.

        Args:
            scenario: The scenario to run.
            equity_positions: Dict of symbol -> (value, beta).
            fixed_income_positions: Dict of symbol -> (value, duration, convexity).
            fx_exposures: Dict of currency_pair -> exposure.
            commodity_exposures: Dict of commodity -> exposure.

        Returns:
            ScenarioResult with impact analysis.
        """
        equity_impact = 0.0
        fi_impact = 0.0
        fx_impact = 0.0
        commodity_impact = 0.0
        position_impacts: dict[str, float] = {}

        # Calculate equity impact
        if equity_positions:
            equity_impact, eq_positions = self.calculate_equity_impact(
                equity_positions, scenario.equity_shock
            )
            position_impacts.update(eq_positions)

        # Calculate fixed income impact
        if fixed_income_positions:
            fi_impact, fi_positions = self.calculate_fixed_income_impact(
                fixed_income_positions,
                scenario.rates_shock_bps,
                scenario.credit_spread_shock_bps,
            )
            position_impacts.update(fi_positions)

        # Calculate FX impact
        if fx_exposures and scenario.fx_shocks:
            fx_impact, fx_positions = self.calculate_fx_impact(
                fx_exposures, scenario.fx_shocks
            )
            position_impacts.update(fx_positions)

        # Calculate commodity impact
        if commodity_exposures and scenario.commodity_shocks:
            commodity_impact, comm_positions = self.calculate_commodity_impact(
                commodity_exposures, scenario.commodity_shocks
            )
            position_impacts.update(comm_positions)

        total_impact = equity_impact + fi_impact + fx_impact + commodity_impact

        return ScenarioResult(
            scenario=scenario,
            portfolio_impact=total_impact,
            equity_impact=equity_impact,
            fixed_income_impact=fi_impact,
            fx_impact=fx_impact,
            commodity_impact=commodity_impact,
            position_impacts=position_impacts,
        )

    def run_all_scenarios(
        self,
        equity_positions: Optional[dict[str, tuple[float, float]]] = None,
        fixed_income_positions: Optional[dict[str, tuple[float, float, float]]] = None,
        fx_exposures: Optional[dict[str, float]] = None,
        commodity_exposures: Optional[dict[str, float]] = None,
        scenario_type: Optional[ScenarioType] = None,
    ) -> list[ScenarioResult]:
        """Run all matching scenarios on portfolio.

        Args:
            equity_positions: Dict of symbol -> (value, beta).
            fixed_income_positions: Dict of symbol -> (value, duration, convexity).
            fx_exposures: Dict of currency_pair -> exposure.
            commodity_exposures: Dict of commodity -> exposure.
            scenario_type: Optional filter by scenario type.

        Returns:
            List of ScenarioResults.
        """
        results = []
        scenario_keys = self.list_scenarios(scenario_type)

        for key in scenario_keys:
            scenario = self.scenarios[key]
            result = self.run_scenario(
                scenario,
                equity_positions,
                fixed_income_positions,
                fx_exposures,
                commodity_exposures,
            )
            results.append(result)

        return results

    def monte_carlo_simulation(
        self,
        returns: NDArray[np.float64],
        weights: NDArray[np.float64],
        num_simulations: int = 10000,
        time_horizon: int = 252,
        initial_value: float = 1000000,
    ) -> dict:
        """Run Monte Carlo simulation for portfolio.

        Args:
            returns: Historical returns matrix (assets x time).
            weights: Portfolio weights.
            num_simulations: Number of simulations to run.
            time_horizon: Number of days to simulate.
            initial_value: Starting portfolio value.

        Returns:
            Dictionary with simulation results.
        """
        # Calculate mean and covariance from historical returns
        mean_returns = np.mean(returns, axis=1)
        cov_matrix = np.cov(returns)

        # Generate correlated random returns
        simulated_returns = np.random.multivariate_normal(
            mean_returns, cov_matrix, (num_simulations, time_horizon)
        )

        # Calculate portfolio returns for each simulation
        portfolio_returns = np.dot(simulated_returns, weights)

        # Calculate cumulative values
        cumulative_returns = np.cumprod(1 + portfolio_returns, axis=1)
        final_values = initial_value * cumulative_returns[:, -1]

        # Calculate statistics
        percentiles = np.percentile(final_values, [1, 5, 10, 25, 50, 75, 90, 95, 99])

        return {
            "mean_final_value": float(np.mean(final_values)),
            "std_final_value": float(np.std(final_values)),
            "min_final_value": float(np.min(final_values)),
            "max_final_value": float(np.max(final_values)),
            "percentile_1": float(percentiles[0]),
            "percentile_5": float(percentiles[1]),
            "percentile_10": float(percentiles[2]),
            "percentile_25": float(percentiles[3]),
            "percentile_50": float(percentiles[4]),
            "percentile_75": float(percentiles[5]),
            "percentile_90": float(percentiles[6]),
            "percentile_95": float(percentiles[7]),
            "percentile_99": float(percentiles[8]),
            "prob_loss": float(np.mean(final_values < initial_value)),
            "expected_shortfall_5": float(
                np.mean(final_values[final_values <= percentiles[1]])
            ),
        }
