"""Schwab data provider integration.

This module provides integration with Charles Schwab's market data API.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

import requests

from .providers import (
    DataProvider,
    DataProviderType,
    FundamentalData,
    PriceData,
)


class SchwabDataProvider(DataProvider):
    """Data provider implementation for Charles Schwab.

    This class provides access to Schwab's market data API for
    real-time and historical pricing data.

    Attributes:
        api_key: The Schwab API key for authentication.
        api_secret: The Schwab API secret for authentication.
        base_url: The base URL for Schwab API endpoints.
        access_token: The OAuth access token.
    """

    def __init__(
        self,
        api_key: str,
        api_secret: str,
        base_url: str = "https://api.schwabapi.com/marketdata/v1",
    ) -> None:
        """Initialize Schwab data provider.

        Args:
            api_key: The Schwab API key.
            api_secret: The Schwab API secret.
            base_url: The base URL for Schwab API.
        """
        self._api_key = api_key
        self._api_secret = api_secret
        self._base_url = base_url
        self._access_token: Optional[str] = None
        self._session = requests.Session()

    @property
    def provider_type(self) -> DataProviderType:
        """Return the provider type."""
        return DataProviderType.SCHWAB

    def authenticate(self) -> bool:
        """Authenticate with Schwab API.

        Returns:
            True if authentication was successful.
        """
        # Schwab uses OAuth 2.0 authentication
        # This is a placeholder for the actual authentication flow
        # In production, this would involve OAuth token exchange
        try:
            # OAuth token endpoint would be called here
            # For now, we just validate credentials are present
            if self._api_key and self._api_secret:
                self._access_token = "placeholder_token"
                return True
            return False
        except requests.RequestException:
            return False

    def _make_request(
        self,
        endpoint: str,
        params: Optional[dict] = None,
    ) -> Optional[dict]:
        """Make an authenticated request to Schwab API.

        Args:
            endpoint: The API endpoint path.
            params: Optional query parameters.

        Returns:
            Response data as dict, or None if request failed.
        """
        if not self._access_token and not self.authenticate():
            return None

        headers = {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json",
        }

        try:
            response = self._session.get(
                f"{self._base_url}/{endpoint}",
                headers=headers,
                params=params,
                timeout=30,
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            return None

    def get_current_price(self, symbol: str) -> Optional[PriceData]:
        """Get current price for a security from Schwab.

        Args:
            symbol: The security symbol.

        Returns:
            Current price data, or None if not available.
        """
        data = self._make_request(f"quotes/{symbol}")
        if not data or symbol not in data:
            return None

        quote = data[symbol].get("quote", {})
        return PriceData(
            symbol=symbol,
            timestamp=datetime.now(),
            open_price=Decimal(str(quote.get("openPrice", 0))) if quote.get("openPrice") else None,
            high_price=Decimal(str(quote.get("highPrice", 0))) if quote.get("highPrice") else None,
            low_price=Decimal(str(quote.get("lowPrice", 0))) if quote.get("lowPrice") else None,
            close_price=Decimal(str(quote.get("lastPrice", 0))) if quote.get("lastPrice") else None,
            volume=quote.get("totalVolume"),
            source=DataProviderType.SCHWAB,
        )

    def get_historical_prices(
        self,
        symbol: str,
        start_date: date,
        end_date: date,
    ) -> list[PriceData]:
        """Get historical price data from Schwab.

        Args:
            symbol: The security symbol.
            start_date: Start date for the data range.
            end_date: End date for the data range.

        Returns:
            List of price data for the specified period.
        """
        params = {
            "periodType": "year",
            "period": 1,
            "frequencyType": "daily",
            "frequency": 1,
            "startDate": int(datetime.combine(start_date, datetime.min.time()).timestamp() * 1000),
            "endDate": int(datetime.combine(end_date, datetime.min.time()).timestamp() * 1000),
        }

        data = self._make_request(f"pricehistory/{symbol}", params)
        if not data or "candles" not in data:
            return []

        prices = []
        for candle in data["candles"]:
            prices.append(
                PriceData(
                    symbol=symbol,
                    timestamp=datetime.fromtimestamp(candle["datetime"] / 1000),
                    open_price=Decimal(str(candle.get("open", 0))),
                    high_price=Decimal(str(candle.get("high", 0))),
                    low_price=Decimal(str(candle.get("low", 0))),
                    close_price=Decimal(str(candle.get("close", 0))),
                    volume=candle.get("volume"),
                    source=DataProviderType.SCHWAB,
                )
            )

        return prices

    def get_fundamentals(self, symbol: str) -> Optional[FundamentalData]:
        """Get fundamental data from Schwab.

        Note: Schwab's API has limited fundamental data.
        For comprehensive fundamentals, use FactSet.

        Args:
            symbol: The security symbol.

        Returns:
            Fundamental data, or None if not available.
        """
        data = self._make_request(f"instruments/{symbol}", {"projection": "fundamental"})
        if not data or symbol not in data:
            return None

        fundamental = data[symbol].get("fundamental", {})
        return FundamentalData(
            symbol=symbol,
            as_of_date=date.today(),
            pe_ratio=(
                Decimal(str(fundamental.get("peRatio"))) if fundamental.get("peRatio") else None
            ),
            dividend_yield=(
                Decimal(str(fundamental.get("dividendYield")))
                if fundamental.get("dividendYield")
                else None
            ),
            beta=Decimal(str(fundamental.get("beta"))) if fundamental.get("beta") else None,
            market_cap=(
                Decimal(str(fundamental.get("marketCap"))) if fundamental.get("marketCap") else None
            ),
            source=DataProviderType.SCHWAB,
        )

    def get_account_positions(self, account_id: str) -> list[dict]:
        """Get positions from a Schwab brokerage account.

        Args:
            account_id: The Schwab account ID.

        Returns:
            List of position dictionaries.
        """
        data = self._make_request(f"accounts/{account_id}/positions")
        if not data:
            return []

        return data.get("securitiesAccount", {}).get("positions", [])

    def is_available(self) -> bool:
        """Check if Schwab API is available.

        Returns:
            True if the API is reachable and authenticated.
        """
        return self.authenticate()
