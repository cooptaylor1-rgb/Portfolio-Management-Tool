"""Security models for portfolio management.

This module defines the base security classes for equities and fixed income instruments.
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from enum import Enum
from typing import Optional


class SecurityType(Enum):
    """Enumeration of security types."""

    EQUITY = "equity"
    FIXED_INCOME = "fixed_income"


class EquityType(Enum):
    """Enumeration of equity types."""

    COMMON_STOCK = "common_stock"
    PREFERRED_STOCK = "preferred_stock"
    ADR = "adr"
    ETF = "etf"


class FixedIncomeType(Enum):
    """Enumeration of fixed income types."""

    CORPORATE_BOND = "corporate_bond"
    GOVERNMENT_BOND = "government_bond"
    MUNICIPAL_BOND = "municipal_bond"
    TREASURY_BILL = "treasury_bill"
    TREASURY_NOTE = "treasury_note"
    TREASURY_BOND = "treasury_bond"


@dataclass
class Security:
    """Base class for all securities.

    Attributes:
        symbol: The ticker symbol or identifier for the security.
        name: The full name of the security.
        security_type: The type of security (equity or fixed income).
        currency: The currency the security is denominated in.
    """

    symbol: str
    name: str
    security_type: SecurityType = SecurityType.EQUITY  # Default, overridden by subclasses
    currency: str = "USD"

    def __post_init__(self) -> None:
        """Validate security data after initialization."""
        if not self.symbol:
            raise ValueError("Security symbol cannot be empty")
        if not self.name:
            raise ValueError("Security name cannot be empty")


@dataclass
class Equity(Security):
    """Represents an equity security (stock).

    Attributes:
        equity_type: The specific type of equity.
        sector: The sector the company operates in.
        industry: The industry the company operates in.
        market_cap: The market capitalization in the security's currency.
        shares_outstanding: Total number of shares outstanding.
        dividend_yield: Annual dividend yield as a decimal.
        exchange: The exchange where the security is traded.
    """

    equity_type: EquityType = EquityType.COMMON_STOCK
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[Decimal] = None
    shares_outstanding: Optional[int] = None
    dividend_yield: Optional[Decimal] = None
    exchange: Optional[str] = None

    def __post_init__(self) -> None:
        """Initialize equity with correct security type."""
        self.security_type = SecurityType.EQUITY
        super().__post_init__()


@dataclass
class FixedIncome(Security):
    """Represents a fixed income security (bond).

    Attributes:
        fixed_income_type: The specific type of fixed income instrument.
        coupon_rate: The annual coupon rate as a decimal.
        maturity_date: The date when the bond matures.
        face_value: The face value of the bond.
        issue_date: The date when the bond was issued.
        issuer: The entity that issued the bond.
        credit_rating: The credit rating of the bond.
        call_date: The earliest date the bond can be called, if callable.
        is_callable: Whether the bond can be called before maturity.
    """

    fixed_income_type: FixedIncomeType = FixedIncomeType.CORPORATE_BOND
    coupon_rate: Decimal = Decimal("0")
    maturity_date: Optional[date] = None
    face_value: Decimal = Decimal("1000")
    issue_date: Optional[date] = None
    issuer: Optional[str] = None
    credit_rating: Optional[str] = None
    call_date: Optional[date] = None
    is_callable: bool = False

    def __post_init__(self) -> None:
        """Initialize fixed income with correct security type."""
        self.security_type = SecurityType.FIXED_INCOME
        super().__post_init__()

    def years_to_maturity(self, as_of_date: Optional[date] = None) -> Optional[float]:
        """Calculate years remaining until maturity.

        Args:
            as_of_date: The date to calculate from. Defaults to today.

        Returns:
            Years to maturity, or None if maturity date is not set.
        """
        if self.maturity_date is None:
            return None

        if as_of_date is None:
            as_of_date = date.today()

        delta = self.maturity_date - as_of_date
        return delta.days / 365.25


@dataclass
class Position:
    """Represents a position in a security.

    Attributes:
        security: The security held in this position.
        quantity: Number of units held.
        cost_basis: The total cost basis for this position.
        acquisition_date: The date the position was acquired.
        current_price: The current market price per unit.
    """

    security: Security
    quantity: Decimal
    cost_basis: Decimal
    acquisition_date: Optional[date] = None
    current_price: Optional[Decimal] = None

    @property
    def market_value(self) -> Optional[Decimal]:
        """Calculate the current market value of the position.

        Returns:
            Market value, or None if current price is not available.
        """
        if self.current_price is None:
            return None
        return self.quantity * self.current_price

    @property
    def unrealized_gain_loss(self) -> Optional[Decimal]:
        """Calculate unrealized gain or loss.

        Returns:
            Unrealized gain (positive) or loss (negative), or None if not calculable.
        """
        market_value = self.market_value
        if market_value is None:
            return None
        return market_value - self.cost_basis

    @property
    def unrealized_gain_loss_percent(self) -> Optional[Decimal]:
        """Calculate unrealized gain or loss as a percentage.

        Returns:
            Percentage gain or loss, or None if not calculable.
        """
        if self.cost_basis == 0:
            return None
        gain_loss = self.unrealized_gain_loss
        if gain_loss is None:
            return None
        return (gain_loss / self.cost_basis) * 100
