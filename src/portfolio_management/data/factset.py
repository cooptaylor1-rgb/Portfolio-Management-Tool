"""FactSet data provider integration.

This module provides integration with FactSet's market data and
fundamental data APIs for institutional-grade company-level data.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

import requests

from .providers import (
    BondData,
    DataProvider,
    DataProviderType,
    FundamentalData,
    PriceData,
)


class FactSetDataProvider(DataProvider):
    """Data provider implementation for FactSet.

    This class provides access to FactSet's comprehensive market data,
    fundamental data, and analytics APIs.

    Attributes:
        username: FactSet API username.
        api_key: FactSet API key.
        base_url: The base URL for FactSet API endpoints.
    """

    def __init__(
        self,
        username: str,
        api_key: str,
        base_url: str = "https://api.factset.com",
    ) -> None:
        """Initialize FactSet data provider.

        Args:
            username: FactSet API username.
            api_key: FactSet API key.
            base_url: The base URL for FactSet API.
        """
        self._username = username
        self._api_key = api_key
        self._base_url = base_url
        self._session = requests.Session()
        self._session.auth = (username, api_key)

    @property
    def provider_type(self) -> DataProviderType:
        """Return the provider type."""
        return DataProviderType.FACTSET

    def _make_request(
        self,
        endpoint: str,
        method: str = "GET",
        data: Optional[dict] = None,
    ) -> Optional[dict]:
        """Make an authenticated request to FactSet API.

        Args:
            endpoint: The API endpoint path.
            method: HTTP method (GET, POST).
            data: Request body data for POST requests.

        Returns:
            Response data as dict, or None if request failed.
        """
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        try:
            if method == "POST":
                response = self._session.post(
                    f"{self._base_url}/{endpoint}",
                    headers=headers,
                    json=data,
                    timeout=60,
                )
            else:
                response = self._session.get(
                    f"{self._base_url}/{endpoint}",
                    headers=headers,
                    timeout=60,
                )
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            return None

    def get_current_price(self, symbol: str) -> Optional[PriceData]:
        """Get current price for a security from FactSet.

        Args:
            symbol: The security symbol.

        Returns:
            Current price data, or None if not available.
        """
        request_data = {
            "ids": [symbol],
            "fields": ["price", "priceOpen", "priceHigh", "priceLow", "volume"],
        }

        data = self._make_request(
            "content/factset-prices/v1/prices",
            method="POST",
            data=request_data,
        )

        if not data or "data" not in data or not data["data"]:
            return None

        quote = data["data"][0]
        return PriceData(
            symbol=symbol,
            timestamp=datetime.now(),
            open_price=Decimal(str(quote.get("priceOpen"))) if quote.get("priceOpen") else None,
            high_price=Decimal(str(quote.get("priceHigh"))) if quote.get("priceHigh") else None,
            low_price=Decimal(str(quote.get("priceLow"))) if quote.get("priceLow") else None,
            close_price=Decimal(str(quote.get("price"))) if quote.get("price") else None,
            volume=quote.get("volume"),
            source=DataProviderType.FACTSET,
        )

    def get_historical_prices(
        self,
        symbol: str,
        start_date: date,
        end_date: date,
    ) -> list[PriceData]:
        """Get historical price data from FactSet.

        Args:
            symbol: The security symbol.
            start_date: Start date for the data range.
            end_date: End date for the data range.

        Returns:
            List of price data for the specified period.
        """
        request_data = {
            "ids": [symbol],
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "frequency": "D",
            "fields": ["price", "priceOpen", "priceHigh", "priceLow", "volume", "date"],
        }

        data = self._make_request(
            "content/factset-prices/v1/time-series",
            method="POST",
            data=request_data,
        )

        if not data or "data" not in data:
            return []

        prices = []
        for record in data["data"]:
            record_date = record.get("date")
            if record_date:
                prices.append(
                    PriceData(
                        symbol=symbol,
                        timestamp=datetime.fromisoformat(record_date),
                        open_price=(
                            Decimal(str(record.get("priceOpen")))
                            if record.get("priceOpen")
                            else None
                        ),
                        high_price=(
                            Decimal(str(record.get("priceHigh")))
                            if record.get("priceHigh")
                            else None
                        ),
                        low_price=(
                            Decimal(str(record.get("priceLow")))
                            if record.get("priceLow")
                            else None
                        ),
                        close_price=(
                            Decimal(str(record.get("price"))) if record.get("price") else None
                        ),
                        volume=record.get("volume"),
                        source=DataProviderType.FACTSET,
                    )
                )

        return prices

    def get_fundamentals(self, symbol: str) -> Optional[FundamentalData]:
        """Get comprehensive fundamental data from FactSet.

        Args:
            symbol: The security symbol.

        Returns:
            Fundamental data, or None if not available.
        """
        request_data = {
            "ids": [symbol],
            "items": [
                "FF_MKT_VAL",  # Market Cap
                "FF_ENTRPR_VAL",  # Enterprise Value
                "FF_SALES",  # Revenue TTM
                "FF_NET_INC",  # Net Income TTM
                "FF_EBITDA",  # EBITDA TTM
                "FF_EPS_DIL",  # Diluted EPS
                "FF_PE",  # P/E Ratio
                "FF_PRICE_BV",  # P/B Ratio
                "FF_PRICE_SALES",  # P/S Ratio
                "FF_EV_EBITDA",  # EV/EBITDA
                "FF_DIV_YLD",  # Dividend Yield
                "FF_DEBT_EQ",  # Debt to Equity
                "FF_CURR_RATIO",  # Current Ratio
                "FF_ROE",  # Return on Equity
                "FF_ROA",  # Return on Assets
                "FF_ROIC",  # Return on Invested Capital
                "FF_GROSS_MGN",  # Gross Margin
                "FF_OPER_MGN",  # Operating Margin
                "FF_NET_MGN",  # Net Margin
                "FF_FREE_CF",  # Free Cash Flow
                "FF_BETA",  # Beta
                "FF_SHS_OUT",  # Shares Outstanding
            ],
        }

        data = self._make_request(
            "content/factset-fundamentals/v1/fundamentals",
            method="POST",
            data=request_data,
        )

        if not data or "data" not in data or not data["data"]:
            return None

        fund = data["data"][0]

        def to_decimal(value):
            """Convert value to Decimal safely."""
            if value is None:
                return None
            try:
                return Decimal(str(value))
            except (ValueError, TypeError):
                return None

        return FundamentalData(
            symbol=symbol,
            as_of_date=date.today(),
            market_cap=to_decimal(fund.get("FF_MKT_VAL")),
            enterprise_value=to_decimal(fund.get("FF_ENTRPR_VAL")),
            revenue_ttm=to_decimal(fund.get("FF_SALES")),
            net_income_ttm=to_decimal(fund.get("FF_NET_INC")),
            ebitda_ttm=to_decimal(fund.get("FF_EBITDA")),
            eps_ttm=to_decimal(fund.get("FF_EPS_DIL")),
            pe_ratio=to_decimal(fund.get("FF_PE")),
            pb_ratio=to_decimal(fund.get("FF_PRICE_BV")),
            ps_ratio=to_decimal(fund.get("FF_PRICE_SALES")),
            ev_ebitda=to_decimal(fund.get("FF_EV_EBITDA")),
            dividend_yield=to_decimal(fund.get("FF_DIV_YLD")),
            debt_to_equity=to_decimal(fund.get("FF_DEBT_EQ")),
            current_ratio=to_decimal(fund.get("FF_CURR_RATIO")),
            roe=to_decimal(fund.get("FF_ROE")),
            roa=to_decimal(fund.get("FF_ROA")),
            roic=to_decimal(fund.get("FF_ROIC")),
            gross_margin=to_decimal(fund.get("FF_GROSS_MGN")),
            operating_margin=to_decimal(fund.get("FF_OPER_MGN")),
            net_margin=to_decimal(fund.get("FF_NET_MGN")),
            free_cash_flow=to_decimal(fund.get("FF_FREE_CF")),
            beta=to_decimal(fund.get("FF_BETA")),
            shares_outstanding=fund.get("FF_SHS_OUT"),
            source=DataProviderType.FACTSET,
        )

    def get_bond_data(self, symbol: str) -> Optional[BondData]:
        """Get fixed income analytics from FactSet.

        Args:
            symbol: The bond identifier (CUSIP, ISIN).

        Returns:
            Bond data, or None if not available.
        """
        request_data = {
            "ids": [symbol],
            "items": [
                "FI_YTM",  # Yield to Maturity
                "FI_YTW",  # Yield to Worst
                "FI_CUR_YLD",  # Current Yield
                "FI_MOD_DUR",  # Modified Duration
                "FI_CONVEX",  # Convexity
                "FI_OAS",  # Option-Adjusted Spread
                "FI_PRICE",  # Clean Price
                "FI_ACCR_INT",  # Accrued Interest
                "FI_DIRTY_PRICE",  # Dirty Price
                "FI_RTG_SP",  # S&P Rating
            ],
        }

        data = self._make_request(
            "content/factset-fixed-income/v1/analytics",
            method="POST",
            data=request_data,
        )

        if not data or "data" not in data or not data["data"]:
            return None

        bond = data["data"][0]

        def to_decimal(value):
            """Convert value to Decimal safely."""
            if value is None:
                return None
            try:
                return Decimal(str(value))
            except (ValueError, TypeError):
                return None

        return BondData(
            symbol=symbol,
            as_of_date=date.today(),
            yield_to_maturity=to_decimal(bond.get("FI_YTM")),
            yield_to_worst=to_decimal(bond.get("FI_YTW")),
            current_yield=to_decimal(bond.get("FI_CUR_YLD")),
            duration=to_decimal(bond.get("FI_MOD_DUR")),
            convexity=to_decimal(bond.get("FI_CONVEX")),
            spread=to_decimal(bond.get("FI_OAS")),
            price=to_decimal(bond.get("FI_PRICE")),
            accrued_interest=to_decimal(bond.get("FI_ACCR_INT")),
            dirty_price=to_decimal(bond.get("FI_DIRTY_PRICE")),
            credit_rating=bond.get("FI_RTG_SP"),
            source=DataProviderType.FACTSET,
        )

    def get_factor_exposures(self, symbols: list[str]) -> Optional[dict]:
        """Get factor exposures for securities (Barra-style).

        Args:
            symbols: List of security symbols.

        Returns:
            Dictionary of factor exposures by symbol, or None if not available.
        """
        request_data = {
            "ids": symbols,
            "factors": [
                "MARKET",
                "SIZE",
                "VALUE",
                "MOMENTUM",
                "QUALITY",
                "LOW_VOLATILITY",
                "GROWTH",
                "DIVIDEND_YIELD",
                "LIQUIDITY",
            ],
        }

        data = self._make_request(
            "analytics/factset-risk-models/v1/factor-exposures",
            method="POST",
            data=request_data,
        )

        if not data or "data" not in data:
            return None

        return {record["id"]: record for record in data["data"]}

    def is_available(self) -> bool:
        """Check if FactSet API is available.

        Returns:
            True if the API is reachable and authenticated.
        """
        try:
            response = self._session.get(
                f"{self._base_url}/analytics/engines/v2/configurations",
                timeout=10,
            )
            return response.status_code == 200
        except requests.RequestException:
            return False
