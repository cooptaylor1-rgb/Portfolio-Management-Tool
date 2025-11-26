"""Tests for portfolio model."""

from decimal import Decimal

import pytest

from portfolio_management.models.portfolio import Portfolio
from portfolio_management.models.securities import (
    Equity,
    FixedIncome,
    FixedIncomeType,
    Position,
)


class TestPortfolio:
    """Tests for Portfolio class."""

    @pytest.fixture
    def sample_portfolio(self):
        """Create a sample portfolio for testing."""
        portfolio = Portfolio(name="Test Portfolio")

        # Add equity positions
        aapl = Equity(symbol="AAPL", name="Apple Inc.", sector="Technology")
        portfolio.add_position(
            Position(
                security=aapl,
                quantity=Decimal("100"),
                cost_basis=Decimal("15000"),
                current_price=Decimal("175"),
            )
        )

        msft = Equity(symbol="MSFT", name="Microsoft Corp.", sector="Technology")
        portfolio.add_position(
            Position(
                security=msft,
                quantity=Decimal("50"),
                cost_basis=Decimal("15000"),
                current_price=Decimal("350"),
            )
        )

        jpm = Equity(symbol="JPM", name="JPMorgan Chase", sector="Financials")
        portfolio.add_position(
            Position(
                security=jpm,
                quantity=Decimal("75"),
                cost_basis=Decimal("10000"),
                current_price=Decimal("150"),
            )
        )

        # Add fixed income position
        bond = FixedIncome(
            symbol="BOND1",
            name="Corporate Bond",
            fixed_income_type=FixedIncomeType.CORPORATE_BOND,
        )
        portfolio.add_position(
            Position(
                security=bond,
                quantity=Decimal("10"),
                cost_basis=Decimal("10000"),
                current_price=Decimal("980"),
            )
        )

        return portfolio

    def test_portfolio_creation(self):
        """Test creating a portfolio."""
        portfolio = Portfolio(name="My Portfolio")
        assert portfolio.name == "My Portfolio"
        assert len(portfolio.positions) == 0
        assert portfolio.base_currency == "USD"

    def test_add_position(self, sample_portfolio):
        """Test adding positions to portfolio."""
        assert len(sample_portfolio.positions) == 4

    def test_add_duplicate_position(self, sample_portfolio):
        """Test adding a position for the same security combines them."""
        aapl = Equity(symbol="AAPL", name="Apple Inc.")
        sample_portfolio.add_position(
            Position(
                security=aapl,
                quantity=Decimal("50"),
                cost_basis=Decimal("7500"),
                current_price=Decimal("180"),
            )
        )

        # Should still have 4 positions (combined AAPL)
        assert len(sample_portfolio.positions) == 4

        aapl_position = sample_portfolio.get_position("AAPL")
        assert aapl_position is not None
        assert aapl_position.quantity == Decimal("150")
        assert aapl_position.cost_basis == Decimal("22500")
        assert aapl_position.current_price == Decimal("180")

    def test_remove_position(self, sample_portfolio):
        """Test removing a position."""
        removed = sample_portfolio.remove_position("AAPL")
        assert removed is not None
        assert removed.security.symbol == "AAPL"
        assert len(sample_portfolio.positions) == 3

    def test_remove_nonexistent_position(self, sample_portfolio):
        """Test removing a non-existent position."""
        removed = sample_portfolio.remove_position("NONEXISTENT")
        assert removed is None
        assert len(sample_portfolio.positions) == 4

    def test_get_position(self, sample_portfolio):
        """Test getting a position by symbol."""
        position = sample_portfolio.get_position("MSFT")
        assert position is not None
        assert position.security.symbol == "MSFT"

    def test_total_market_value(self, sample_portfolio):
        """Test total market value calculation."""
        # AAPL: 100 * 175 = 17500
        # MSFT: 50 * 350 = 17500
        # JPM: 75 * 150 = 11250
        # BOND1: 10 * 980 = 9800
        # Total: 56050
        assert sample_portfolio.total_market_value == Decimal("56050")

    def test_total_cost_basis(self, sample_portfolio):
        """Test total cost basis calculation."""
        # 15000 + 15000 + 10000 + 10000 = 50000
        assert sample_portfolio.total_cost_basis == Decimal("50000")

    def test_equity_positions(self, sample_portfolio):
        """Test getting equity positions."""
        equity_positions = sample_portfolio.equity_positions
        assert len(equity_positions) == 3
        symbols = {p.security.symbol for p in equity_positions}
        assert symbols == {"AAPL", "MSFT", "JPM"}

    def test_fixed_income_positions(self, sample_portfolio):
        """Test getting fixed income positions."""
        fi_positions = sample_portfolio.fixed_income_positions
        assert len(fi_positions) == 1
        assert fi_positions[0].security.symbol == "BOND1"

    def test_equity_allocation(self, sample_portfolio):
        """Test equity allocation calculation."""
        # Equity: 17500 + 17500 + 11250 = 46250
        # Total: 56050
        # Allocation: 46250 / 56050 = 82.5%
        allocation = sample_portfolio.equity_allocation
        assert abs(allocation - Decimal("82.5")) < Decimal("0.5")

    def test_fixed_income_allocation(self, sample_portfolio):
        """Test fixed income allocation calculation."""
        # FI: 9800
        # Total: 56050
        # Allocation: 9800 / 56050 = 17.5%
        allocation = sample_portfolio.fixed_income_allocation
        assert abs(allocation - Decimal("17.5")) < Decimal("0.5")

    def test_sector_allocation(self, sample_portfolio):
        """Test sector allocation calculation."""
        sector_allocation = sample_portfolio.get_sector_allocation()

        # Technology: (17500 + 17500) / 56050 = 62.4%
        # Financials: 11250 / 56050 = 20.1%
        assert "Technology" in sector_allocation
        assert "Financials" in sector_allocation
        assert abs(sector_allocation["Technology"] - Decimal("62.4")) < Decimal("1")
        assert abs(sector_allocation["Financials"] - Decimal("20.1")) < Decimal("1")

    def test_position_weights(self, sample_portfolio):
        """Test position weight calculation."""
        weights = sample_portfolio.get_position_weights()

        assert len(weights) == 4
        assert "AAPL" in weights
        assert "MSFT" in weights

        # Check weights sum to 100%
        total_weight = sum(weights.values())
        assert abs(total_weight - Decimal("100")) < Decimal("0.01")

    def test_summary(self, sample_portfolio):
        """Test portfolio summary generation."""
        summary = sample_portfolio.summary()

        assert summary["name"] == "Test Portfolio"
        assert summary["total_positions"] == 4
        assert summary["equity_positions"] == 3
        assert summary["fixed_income_positions"] == 1
        assert summary["total_market_value"] == Decimal("56050")
        assert summary["base_currency"] == "USD"

    def test_empty_portfolio(self):
        """Test empty portfolio behavior."""
        portfolio = Portfolio(name="Empty")

        assert portfolio.total_market_value == Decimal("0")
        assert portfolio.total_cost_basis == Decimal("0")
        assert portfolio.equity_allocation == Decimal("0")
        assert portfolio.fixed_income_allocation == Decimal("0")
        assert portfolio.get_sector_allocation() == {}
        assert portfolio.get_position_weights() == {}
