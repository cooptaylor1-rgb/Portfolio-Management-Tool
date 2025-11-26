"""Portfolio model for managing collections of securities.

This module provides the Portfolio class for managing positions in equities
and fixed income securities, including allocation analysis and performance tracking.
"""

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional

from .securities import Equity, Position, SecurityType


@dataclass
class Portfolio:
    """Represents a collection of investment positions.

    Attributes:
        name: The name of the portfolio.
        positions: List of positions in the portfolio.
        base_currency: The base currency for the portfolio.
        benchmark_symbol: Optional benchmark symbol for performance comparison.
    """

    name: str
    positions: list[Position] = field(default_factory=list)
    base_currency: str = "USD"
    benchmark_symbol: Optional[str] = None

    def add_position(self, position: Position) -> None:
        """Add a position to the portfolio.

        Args:
            position: The position to add.
        """
        # Check if position for this security already exists
        for existing in self.positions:
            if existing.security.symbol == position.security.symbol:
                # Combine positions
                new_quantity = existing.quantity + position.quantity
                new_cost_basis = existing.cost_basis + position.cost_basis
                existing.quantity = new_quantity
                existing.cost_basis = new_cost_basis
                if position.current_price is not None:
                    existing.current_price = position.current_price
                return

        self.positions.append(position)

    def remove_position(self, symbol: str) -> Optional[Position]:
        """Remove a position from the portfolio.

        Args:
            symbol: The symbol of the security to remove.

        Returns:
            The removed position, or None if not found.
        """
        for i, position in enumerate(self.positions):
            if position.security.symbol == symbol:
                return self.positions.pop(i)
        return None

    def get_position(self, symbol: str) -> Optional[Position]:
        """Get a position by symbol.

        Args:
            symbol: The symbol of the security to find.

        Returns:
            The position, or None if not found.
        """
        for position in self.positions:
            if position.security.symbol == symbol:
                return position
        return None

    @property
    def total_market_value(self) -> Decimal:
        """Calculate total market value of all positions.

        Returns:
            Total market value. Positions without current price are excluded.
        """
        total = Decimal("0")
        for position in self.positions:
            market_value = position.market_value
            if market_value is not None:
                total += market_value
        return total

    @property
    def total_cost_basis(self) -> Decimal:
        """Calculate total cost basis of all positions.

        Returns:
            Total cost basis.
        """
        return sum(
            (position.cost_basis for position in self.positions),
            start=Decimal("0"),
        )

    @property
    def total_unrealized_gain_loss(self) -> Optional[Decimal]:
        """Calculate total unrealized gain or loss.

        Returns:
            Total unrealized gain or loss, or None if any position lacks pricing.
        """
        total = Decimal("0")
        for position in self.positions:
            gain_loss = position.unrealized_gain_loss
            if gain_loss is not None:
                total += gain_loss
        return total

    @property
    def equity_positions(self) -> list[Position]:
        """Get all equity positions.

        Returns:
            List of equity positions.
        """
        return [
            p for p in self.positions if p.security.security_type == SecurityType.EQUITY
        ]

    @property
    def fixed_income_positions(self) -> list[Position]:
        """Get all fixed income positions.

        Returns:
            List of fixed income positions.
        """
        return [
            p for p in self.positions if p.security.security_type == SecurityType.FIXED_INCOME
        ]

    @property
    def equity_allocation(self) -> Decimal:
        """Calculate equity allocation as a percentage.

        Returns:
            Percentage of portfolio in equities.
        """
        total = self.total_market_value
        if total == 0:
            return Decimal("0")

        equity_value = Decimal("0")
        for position in self.equity_positions:
            market_value = position.market_value
            if market_value is not None:
                equity_value += market_value

        return (equity_value / total) * 100

    @property
    def fixed_income_allocation(self) -> Decimal:
        """Calculate fixed income allocation as a percentage.

        Returns:
            Percentage of portfolio in fixed income.
        """
        total = self.total_market_value
        if total == 0:
            return Decimal("0")

        fi_value = Decimal("0")
        for position in self.fixed_income_positions:
            market_value = position.market_value
            if market_value is not None:
                fi_value += market_value

        return (fi_value / total) * 100

    def get_sector_allocation(self) -> dict[str, Decimal]:
        """Calculate allocation by sector for equity positions.

        Returns:
            Dictionary mapping sector names to allocation percentages.
        """
        total = self.total_market_value
        if total == 0:
            return {}

        sector_values: dict[str, Decimal] = {}
        for position in self.equity_positions:
            if isinstance(position.security, Equity):
                sector = position.security.sector or "Unknown"
                market_value = position.market_value
                if market_value is not None:
                    sector_values[sector] = sector_values.get(sector, Decimal("0")) + market_value

        return {
            sector: (value / total) * 100 for sector, value in sector_values.items()
        }

    def get_position_weights(self) -> dict[str, Decimal]:
        """Calculate weight of each position in the portfolio.

        Returns:
            Dictionary mapping symbols to their portfolio weight percentage.
        """
        total = self.total_market_value
        if total == 0:
            return {}

        weights: dict[str, Decimal] = {}
        for position in self.positions:
            market_value = position.market_value
            if market_value is not None:
                weights[position.security.symbol] = (market_value / total) * 100

        return weights

    def summary(self) -> dict:
        """Generate a summary of the portfolio.

        Returns:
            Dictionary with portfolio summary statistics.
        """
        return {
            "name": self.name,
            "total_positions": len(self.positions),
            "equity_positions": len(self.equity_positions),
            "fixed_income_positions": len(self.fixed_income_positions),
            "total_market_value": self.total_market_value,
            "total_cost_basis": self.total_cost_basis,
            "total_unrealized_gain_loss": self.total_unrealized_gain_loss,
            "equity_allocation_pct": self.equity_allocation,
            "fixed_income_allocation_pct": self.fixed_income_allocation,
            "base_currency": self.base_currency,
        }
