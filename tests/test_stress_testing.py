"""Tests for stress testing module."""


import numpy as np
import pytest

from portfolio_management.analytics.stress_testing import (
    HISTORICAL_SCENARIOS,
    HYPOTHETICAL_SCENARIOS,
    Scenario,
    ScenarioResult,
    ScenarioType,
    StressTestEngine,
)


class TestScenario:
    """Tests for Scenario class."""

    def test_scenario_creation(self):
        """Test creating a scenario."""
        scenario = Scenario(
            name="Test Scenario",
            scenario_type=ScenarioType.HYPOTHETICAL,
            description="A test scenario",
            equity_shock=-0.20,
            rates_shock_bps=100,
        )

        assert scenario.name == "Test Scenario"
        assert scenario.scenario_type == ScenarioType.HYPOTHETICAL
        assert scenario.equity_shock == -0.20
        assert scenario.rates_shock_bps == 100

    def test_historical_scenarios_exist(self):
        """Test that historical scenarios are defined."""
        assert "GFC_2008" in HISTORICAL_SCENARIOS
        assert "COVID_2020" in HISTORICAL_SCENARIOS
        assert "DOTCOM_2000" in HISTORICAL_SCENARIOS
        assert "INFLATION_2022" in HISTORICAL_SCENARIOS

    def test_hypothetical_scenarios_exist(self):
        """Test that hypothetical scenarios are defined."""
        assert "RATES_UP_200" in HYPOTHETICAL_SCENARIOS
        assert "RATES_DOWN_200" in HYPOTHETICAL_SCENARIOS
        assert "EQUITY_VOL_40" in HYPOTHETICAL_SCENARIOS
        assert "CREDIT_CRISIS" in HYPOTHETICAL_SCENARIOS

    def test_gfc_scenario(self):
        """Test GFC 2008 scenario values."""
        gfc = HISTORICAL_SCENARIOS["GFC_2008"]
        assert gfc.scenario_type == ScenarioType.HISTORICAL
        assert gfc.equity_shock == -0.45
        assert gfc.rates_shock_bps == -200
        assert gfc.credit_spread_shock_bps == 500


class TestStressTestEngine:
    """Tests for StressTestEngine class."""

    @pytest.fixture
    def engine(self):
        """Create a stress test engine."""
        return StressTestEngine()

    @pytest.fixture
    def equity_positions(self):
        """Create sample equity positions."""
        return {
            "AAPL": (100000, 1.2),  # (value, beta)
            "MSFT": (80000, 1.1),
            "JPM": (50000, 1.4),
        }

    @pytest.fixture
    def fixed_income_positions(self):
        """Create sample fixed income positions."""
        return {
            "BOND1": (50000, 5.0, 0.5),  # (value, duration, convexity)
            "BOND2": (30000, 7.0, 0.8),
        }

    def test_engine_initialization(self, engine):
        """Test engine initialization."""
        assert len(engine.scenarios) > 0

    def test_list_scenarios(self, engine):
        """Test listing scenarios."""
        all_scenarios = engine.list_scenarios()
        historical = engine.list_scenarios(ScenarioType.HISTORICAL)
        hypothetical = engine.list_scenarios(ScenarioType.HYPOTHETICAL)

        assert len(all_scenarios) > 0
        assert len(historical) > 0
        assert len(hypothetical) > 0
        assert len(all_scenarios) == len(historical) + len(hypothetical)

    def test_add_custom_scenario(self, engine):
        """Test adding a custom scenario."""
        custom = Scenario(
            name="Custom Scenario",
            scenario_type=ScenarioType.CUSTOM,
            equity_shock=-0.30,
        )

        engine.add_scenario("CUSTOM_1", custom)

        assert engine.get_scenario("CUSTOM_1") is not None
        assert engine.get_scenario("CUSTOM_1").name == "Custom Scenario"

    def test_calculate_equity_impact(self, engine, equity_positions):
        """Test equity impact calculation."""
        total_impact, position_impacts = engine.calculate_equity_impact(
            equity_positions, equity_shock=-0.20
        )

        # AAPL: 100000 * 1.2 * -0.20 = -24000
        # MSFT: 80000 * 1.1 * -0.20 = -17600
        # JPM: 50000 * 1.4 * -0.20 = -14000
        # Total: -55600
        assert total_impact == pytest.approx(-55600, rel=0.01)
        assert position_impacts["AAPL"] == pytest.approx(-24000, rel=0.01)

    def test_calculate_fixed_income_impact(self, engine, fixed_income_positions):
        """Test fixed income impact calculation."""
        total_impact, position_impacts = engine.calculate_fixed_income_impact(
            fixed_income_positions,
            rates_shock_bps=100,  # +1%
            credit_spread_shock_bps=50,  # +0.5%
        )

        # Total shock: 150 bps = 1.5%
        # BOND1: -5.0 * 0.015 * 50000 + 0.5 * 0.5 * 0.015^2 * 50000
        # Duration effect dominates
        assert total_impact < 0  # Rates up = bond prices down

    def test_calculate_fx_impact(self, engine):
        """Test FX impact calculation."""
        exposures = {
            "USD/EUR": 100000,
            "USD/JPY": 50000,
        }
        shocks = {
            "USD/EUR": -0.10,  # USD weakens 10%
            "USD/JPY": -0.05,
        }

        total_impact, exposure_impacts = engine.calculate_fx_impact(exposures, shocks)

        # USD/EUR: 100000 * -0.10 = -10000
        # USD/JPY: 50000 * -0.05 = -2500
        assert total_impact == pytest.approx(-12500, rel=0.01)

    def test_run_scenario(self, engine, equity_positions, fixed_income_positions):
        """Test running a scenario."""
        scenario = engine.get_scenario("GFC_2008")
        result = engine.run_scenario(
            scenario,
            equity_positions=equity_positions,
            fixed_income_positions=fixed_income_positions,
        )

        assert isinstance(result, ScenarioResult)
        assert result.scenario.name == "Global Financial Crisis 2008"
        assert result.portfolio_impact < 0  # Should be negative
        assert result.equity_impact < 0
        assert len(result.position_impacts) > 0

    def test_run_all_scenarios(self, engine, equity_positions):
        """Test running all scenarios."""
        results = engine.run_all_scenarios(
            equity_positions=equity_positions,
            scenario_type=ScenarioType.HISTORICAL,
        )

        assert len(results) > 0
        assert all(isinstance(r, ScenarioResult) for r in results)

    def test_monte_carlo_simulation(self, engine):
        """Test Monte Carlo simulation."""
        np.random.seed(42)
        returns = np.random.normal(0.0003, 0.02, (3, 252))
        weights = np.array([0.4, 0.3, 0.3])

        results = engine.monte_carlo_simulation(
            returns,
            weights,
            num_simulations=1000,
            time_horizon=252,
            initial_value=1000000,
        )

        assert "mean_final_value" in results
        assert "percentile_5" in results
        assert "percentile_95" in results
        assert "prob_loss" in results

        # Mean should be around starting value (with some drift)
        assert results["mean_final_value"] > 800000
        assert results["mean_final_value"] < 1500000

        # 5th percentile should be less than mean
        assert results["percentile_5"] < results["mean_final_value"]

        # 95th percentile should be greater than mean
        assert results["percentile_95"] > results["mean_final_value"]

    def test_rates_up_scenario(self, engine, fixed_income_positions):
        """Test rates up scenario impact on fixed income."""
        scenario = engine.get_scenario("RATES_UP_200")
        result = engine.run_scenario(
            scenario,
            fixed_income_positions=fixed_income_positions,
        )

        # Rising rates should hurt bond portfolio
        assert result.fixed_income_impact < 0

    def test_rates_down_scenario(self, engine, fixed_income_positions):
        """Test rates down scenario impact on fixed income."""
        scenario = engine.get_scenario("RATES_DOWN_200")
        result = engine.run_scenario(
            scenario,
            fixed_income_positions=fixed_income_positions,
        )

        # Falling rates should help bond portfolio
        assert result.fixed_income_impact > 0
