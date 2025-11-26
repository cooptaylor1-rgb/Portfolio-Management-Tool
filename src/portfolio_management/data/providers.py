"""Data provider base classes and interfaces.

This module defines abstract interfaces for market data providers.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional


class DataProviderType(Enum):
    """Enumeration of supported data providers."""

    SCHWAB = "schwab"
    FACTSET = "factset"
    BLOOMBERG = "bloomberg"
    REFINITIV = "refinitiv"


@dataclass
class PriceData:
    """Represents price data for a security.

    Attributes:
        symbol: Security symbol.
        timestamp: The timestamp of the price data.
        open_price: Opening price.
        high_price: High price.
        low_price: Low price.
        close_price: Closing price.
        adjusted_close: Dividend and split adjusted close.
        volume: Trading volume.
        source: The data provider source.
    """

    symbol: str
    timestamp: datetime
    open_price: Optional[Decimal] = None
    high_price: Optional[Decimal] = None
    low_price: Optional[Decimal] = None
    close_price: Optional[Decimal] = None
    adjusted_close: Optional[Decimal] = None
    volume: Optional[int] = None
    source: Optional[DataProviderType] = None


@dataclass
class FundamentalData:
    """Represents fundamental data for a company.

    Attributes:
        symbol: Security symbol.
        as_of_date: Date of the fundamental data.
        market_cap: Market capitalization.
        enterprise_value: Enterprise value.
        revenue_ttm: Trailing twelve month revenue.
        net_income_ttm: Trailing twelve month net income.
        ebitda_ttm: Trailing twelve month EBITDA.
        eps_ttm: Trailing twelve month EPS.
        pe_ratio: Price to earnings ratio.
        pb_ratio: Price to book ratio.
        ps_ratio: Price to sales ratio.
        ev_ebitda: Enterprise value to EBITDA ratio.
        dividend_yield: Current dividend yield.
        debt_to_equity: Debt to equity ratio.
        current_ratio: Current ratio.
        roe: Return on equity.
        roa: Return on assets.
        roic: Return on invested capital.
        gross_margin: Gross profit margin.
        operating_margin: Operating margin.
        net_margin: Net profit margin.
        free_cash_flow: Free cash flow.
        beta: Beta coefficient.
        shares_outstanding: Number of shares outstanding.
        source: The data provider source.
    """

    symbol: str
    as_of_date: date
    market_cap: Optional[Decimal] = None
    enterprise_value: Optional[Decimal] = None
    revenue_ttm: Optional[Decimal] = None
    net_income_ttm: Optional[Decimal] = None
    ebitda_ttm: Optional[Decimal] = None
    eps_ttm: Optional[Decimal] = None
    pe_ratio: Optional[Decimal] = None
    pb_ratio: Optional[Decimal] = None
    ps_ratio: Optional[Decimal] = None
    ev_ebitda: Optional[Decimal] = None
    dividend_yield: Optional[Decimal] = None
    debt_to_equity: Optional[Decimal] = None
    current_ratio: Optional[Decimal] = None
    roe: Optional[Decimal] = None
    roa: Optional[Decimal] = None
    roic: Optional[Decimal] = None
    gross_margin: Optional[Decimal] = None
    operating_margin: Optional[Decimal] = None
    net_margin: Optional[Decimal] = None
    free_cash_flow: Optional[Decimal] = None
    beta: Optional[Decimal] = None
    shares_outstanding: Optional[int] = None
    source: Optional[DataProviderType] = None


@dataclass
class BondData:
    """Represents fixed income specific data.

    Attributes:
        symbol: Security identifier (CUSIP, ISIN, etc.).
        as_of_date: Date of the data.
        yield_to_maturity: Yield to maturity.
        yield_to_worst: Yield to worst.
        current_yield: Current yield.
        duration: Modified duration.
        convexity: Convexity measure.
        spread: Credit spread over benchmark.
        price: Clean price.
        accrued_interest: Accrued interest.
        dirty_price: Dirty price (clean + accrued).
        credit_rating: Current credit rating.
        source: The data provider source.
    """

    symbol: str
    as_of_date: date
    yield_to_maturity: Optional[Decimal] = None
    yield_to_worst: Optional[Decimal] = None
    current_yield: Optional[Decimal] = None
    duration: Optional[Decimal] = None
    convexity: Optional[Decimal] = None
    spread: Optional[Decimal] = None
    price: Optional[Decimal] = None
    accrued_interest: Optional[Decimal] = None
    dirty_price: Optional[Decimal] = None
    credit_rating: Optional[str] = None
    source: Optional[DataProviderType] = None


class DataProvider(ABC):
    """Abstract base class for market data providers.

    This defines the interface that all data providers must implement.
    """

    @property
    @abstractmethod
    def provider_type(self) -> DataProviderType:
        """Return the provider type."""
        pass

    @abstractmethod
    def get_current_price(self, symbol: str) -> Optional[PriceData]:
        """Get current price for a security.

        Args:
            symbol: The security symbol.

        Returns:
            Current price data, or None if not available.
        """
        pass

    @abstractmethod
    def get_historical_prices(
        self,
        symbol: str,
        start_date: date,
        end_date: date,
    ) -> list[PriceData]:
        """Get historical price data for a security.

        Args:
            symbol: The security symbol.
            start_date: Start date for the data range.
            end_date: End date for the data range.

        Returns:
            List of price data for the specified period.
        """
        pass

    @abstractmethod
    def get_fundamentals(self, symbol: str) -> Optional[FundamentalData]:
        """Get fundamental data for a company.

        Args:
            symbol: The security symbol.

        Returns:
            Fundamental data, or None if not available.
        """
        pass

    def get_bond_data(self, symbol: str) -> Optional[BondData]:
        """Get fixed income specific data.

        Args:
            symbol: The bond identifier.

        Returns:
            Bond data, or None if not available.
        """
        return None

    def is_available(self) -> bool:
        """Check if the data provider is available and authenticated.

        Returns:
            True if the provider is available, False otherwise.
        """
        return True
