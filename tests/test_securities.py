"""Tests for security models."""

from datetime import date
from decimal import Decimal

import pytest

from portfolio_management.models.securities import (
    Equity,
    EquityType,
    FixedIncome,
    FixedIncomeType,
    Position,
    SecurityType,
)


class TestEquity:
    """Tests for Equity class."""

    def test_equity_creation(self):
        """Test creating an equity security."""
        equity = Equity(
            symbol="AAPL",
            name="Apple Inc.",
            sector="Technology",
            industry="Consumer Electronics",
            market_cap=Decimal("3000000000000"),
        )

        assert equity.symbol == "AAPL"
        assert equity.name == "Apple Inc."
        assert equity.security_type == SecurityType.EQUITY
        assert equity.equity_type == EquityType.COMMON_STOCK
        assert equity.sector == "Technology"
        assert equity.currency == "USD"

    def test_equity_validation(self):
        """Test equity validation."""
        with pytest.raises(ValueError, match="symbol cannot be empty"):
            Equity(symbol="", name="Test")

        with pytest.raises(ValueError, match="name cannot be empty"):
            Equity(symbol="TEST", name="")

    def test_equity_types(self):
        """Test different equity types."""
        etf = Equity(
            symbol="SPY",
            name="SPDR S&P 500 ETF",
            equity_type=EquityType.ETF,
        )
        assert etf.equity_type == EquityType.ETF

        adr = Equity(
            symbol="TSM",
            name="Taiwan Semiconductor ADR",
            equity_type=EquityType.ADR,
        )
        assert adr.equity_type == EquityType.ADR


class TestFixedIncome:
    """Tests for FixedIncome class."""

    def test_fixed_income_creation(self):
        """Test creating a fixed income security."""
        bond = FixedIncome(
            symbol="US912828ZT90",
            name="US Treasury 10Y",
            fixed_income_type=FixedIncomeType.TREASURY_NOTE,
            coupon_rate=Decimal("0.025"),
            maturity_date=date(2034, 5, 15),
            face_value=Decimal("1000"),
        )

        assert bond.symbol == "US912828ZT90"
        assert bond.security_type == SecurityType.FIXED_INCOME
        assert bond.fixed_income_type == FixedIncomeType.TREASURY_NOTE
        assert bond.coupon_rate == Decimal("0.025")

    def test_years_to_maturity(self):
        """Test years to maturity calculation."""
        bond = FixedIncome(
            symbol="TEST",
            name="Test Bond",
            maturity_date=date(2030, 1, 1),
        )

        years = bond.years_to_maturity(as_of_date=date(2025, 1, 1))
        assert years is not None
        assert 4.9 < years < 5.1  # Approximately 5 years

    def test_years_to_maturity_no_date(self):
        """Test years to maturity when maturity date is not set."""
        bond = FixedIncome(
            symbol="TEST",
            name="Test Bond",
        )

        assert bond.years_to_maturity() is None

    def test_callable_bond(self):
        """Test callable bond attributes."""
        bond = FixedIncome(
            symbol="CALLABLE",
            name="Callable Bond",
            is_callable=True,
            call_date=date(2028, 1, 1),
            maturity_date=date(2035, 1, 1),
        )

        assert bond.is_callable is True
        assert bond.call_date == date(2028, 1, 1)


class TestPosition:
    """Tests for Position class."""

    def test_position_creation(self):
        """Test creating a position."""
        equity = Equity(symbol="AAPL", name="Apple Inc.")
        position = Position(
            security=equity,
            quantity=Decimal("100"),
            cost_basis=Decimal("15000"),
            current_price=Decimal("175"),
        )

        assert position.security.symbol == "AAPL"
        assert position.quantity == Decimal("100")
        assert position.cost_basis == Decimal("15000")

    def test_market_value(self):
        """Test market value calculation."""
        equity = Equity(symbol="AAPL", name="Apple Inc.")
        position = Position(
            security=equity,
            quantity=Decimal("100"),
            cost_basis=Decimal("15000"),
            current_price=Decimal("175"),
        )

        assert position.market_value == Decimal("17500")

    def test_market_value_no_price(self):
        """Test market value when price is not available."""
        equity = Equity(symbol="AAPL", name="Apple Inc.")
        position = Position(
            security=equity,
            quantity=Decimal("100"),
            cost_basis=Decimal("15000"),
        )

        assert position.market_value is None

    def test_unrealized_gain_loss(self):
        """Test unrealized gain/loss calculation."""
        equity = Equity(symbol="AAPL", name="Apple Inc.")
        position = Position(
            security=equity,
            quantity=Decimal("100"),
            cost_basis=Decimal("15000"),
            current_price=Decimal("175"),
        )

        assert position.unrealized_gain_loss == Decimal("2500")
        assert position.unrealized_gain_loss_percent is not None
        assert abs(position.unrealized_gain_loss_percent - Decimal("16.67")) < Decimal("0.1")

    def test_unrealized_loss(self):
        """Test unrealized loss calculation."""
        equity = Equity(symbol="AAPL", name="Apple Inc.")
        position = Position(
            security=equity,
            quantity=Decimal("100"),
            cost_basis=Decimal("20000"),
            current_price=Decimal("175"),
        )

        assert position.unrealized_gain_loss == Decimal("-2500")
