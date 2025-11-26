"""Reporting and dashboard generation module.

This module provides reporting capabilities including tearsheets,
risk dashboards, and attribution reports.
"""

from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Optional

from ..analytics.attribution import AttributionResult
from ..analytics.risk import FactorExposures, RiskMetrics
from ..analytics.stress_testing import ScenarioResult
from ..models.portfolio import Portfolio


class ReportFormat(Enum):
    """Report output formats."""

    JSON = "json"
    HTML = "html"
    MARKDOWN = "markdown"
    CSV = "csv"


class ReportFrequency(Enum):
    """Report frequency."""

    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


@dataclass
class ReportSection:
    """A section within a report.

    Attributes:
        title: Section title.
        content: Section content (can be text, table, chart data).
        section_type: Type of section (text, table, chart).
        order: Display order.
    """

    title: str
    content: Any
    section_type: str = "text"
    order: int = 0


@dataclass
class Report:
    """A complete report.

    Attributes:
        title: Report title.
        as_of_date: Report date.
        generated_at: Timestamp when report was generated.
        sections: List of report sections.
        metadata: Additional metadata.
    """

    title: str
    as_of_date: date
    generated_at: datetime = field(default_factory=datetime.now)
    sections: list[ReportSection] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)

    def add_section(self, section: ReportSection) -> None:
        """Add a section to the report.

        Args:
            section: The section to add.
        """
        self.sections.append(section)
        # Keep sections sorted by order
        self.sections.sort(key=lambda s: s.order)


class ReportGenerator:
    """Generate various types of reports.

    This class provides methods to generate institutional-quality
    reports including tearsheets, risk reports, and attribution reports.
    """

    def __init__(self) -> None:
        """Initialize the report generator."""
        pass

    def generate_daily_tearsheet(
        self,
        portfolio: Portfolio,
        risk_metrics: RiskMetrics,
        pnl_today: Decimal,
        pnl_mtd: Decimal,
        pnl_ytd: Decimal,
        benchmark_return_today: Optional[float] = None,
    ) -> Report:
        """Generate a daily tearsheet.

        Args:
            portfolio: The portfolio to report on.
            risk_metrics: Current risk metrics.
            pnl_today: Today's P&L.
            pnl_mtd: Month-to-date P&L.
            pnl_ytd: Year-to-date P&L.
            benchmark_return_today: Optional benchmark return.

        Returns:
            Daily tearsheet report.
        """
        report = Report(
            title=f"Daily Tearsheet - {portfolio.name}",
            as_of_date=date.today(),
        )

        # Summary section
        summary = {
            "portfolio_name": portfolio.name,
            "total_market_value": float(portfolio.total_market_value),
            "pnl_today": float(pnl_today),
            "pnl_mtd": float(pnl_mtd),
            "pnl_ytd": float(pnl_ytd),
            "total_positions": len(portfolio.positions),
            "equity_allocation_pct": float(portfolio.equity_allocation),
            "fixed_income_allocation_pct": float(portfolio.fixed_income_allocation),
        }

        if benchmark_return_today is not None:
            if portfolio.total_market_value:
                portfolio_return_today = float(pnl_today / portfolio.total_market_value)
            else:
                portfolio_return_today = 0
            summary["benchmark_return_today"] = benchmark_return_today
            summary["excess_return_today"] = portfolio_return_today - benchmark_return_today

        report.add_section(
            ReportSection(
                title="Portfolio Summary",
                content=summary,
                section_type="summary",
                order=1,
            )
        )

        # Risk section
        risk_summary = {
            "volatility_annual": risk_metrics.volatility_annual,
            "var_95_pct": risk_metrics.var_95,
            "var_99_pct": risk_metrics.var_99,
            "beta": risk_metrics.beta,
            "sharpe_ratio": risk_metrics.sharpe_ratio,
            "max_drawdown": risk_metrics.max_drawdown,
        }

        report.add_section(
            ReportSection(
                title="Risk Metrics",
                content=risk_summary,
                section_type="metrics",
                order=2,
            )
        )

        # Allocation section
        allocation = {
            "equity_pct": float(portfolio.equity_allocation),
            "fixed_income_pct": float(portfolio.fixed_income_allocation),
            "sector_allocation": {
                k: float(v) for k, v in portfolio.get_sector_allocation().items()
            },
        }

        report.add_section(
            ReportSection(
                title="Asset Allocation",
                content=allocation,
                section_type="allocation",
                order=3,
            )
        )

        # Top positions
        position_weights = portfolio.get_position_weights()
        sorted_positions = sorted(
            position_weights.items(), key=lambda x: x[1], reverse=True
        )
        top_positions = []
        for symbol, weight in sorted_positions[:10]:
            market_val = next(
                (p.market_value for p in portfolio.positions if p.security.symbol == symbol),
                Decimal(0),
            )
            top_positions.append({
                "symbol": symbol,
                "weight_pct": float(weight),
                "market_value": float(market_val),
            })

        report.add_section(
            ReportSection(
                title="Top 10 Positions",
                content=top_positions,
                section_type="table",
                order=4,
            )
        )

        return report

    def generate_risk_dashboard(
        self,
        portfolio: Portfolio,
        risk_metrics: RiskMetrics,
        factor_exposures: Optional[FactorExposures] = None,
        scenario_results: Optional[list[ScenarioResult]] = None,
    ) -> Report:
        """Generate a comprehensive risk dashboard.

        Args:
            portfolio: The portfolio to report on.
            risk_metrics: Current risk metrics.
            factor_exposures: Optional factor exposures.
            scenario_results: Optional stress test results.

        Returns:
            Risk dashboard report.
        """
        report = Report(
            title=f"Risk Dashboard - {portfolio.name}",
            as_of_date=date.today(),
        )

        # Core risk metrics
        core_risk = {
            "volatility_annual_pct": (
                risk_metrics.volatility_annual * 100 if risk_metrics.volatility_annual else None
            ),
            "var_95_pct": risk_metrics.var_95 * 100 if risk_metrics.var_95 else None,
            "var_99_pct": risk_metrics.var_99 * 100 if risk_metrics.var_99 else None,
            "cvar_95_pct": risk_metrics.cvar_95 * 100 if risk_metrics.cvar_95 else None,
            "cvar_99_pct": risk_metrics.cvar_99 * 100 if risk_metrics.cvar_99 else None,
            "max_drawdown_pct": (
                risk_metrics.max_drawdown * 100 if risk_metrics.max_drawdown else None
            ),
        }

        report.add_section(
            ReportSection(
                title="Value at Risk",
                content=core_risk,
                section_type="metrics",
                order=1,
            )
        )

        # Performance metrics
        performance = {
            "sharpe_ratio": risk_metrics.sharpe_ratio,
            "sortino_ratio": risk_metrics.sortino_ratio,
            "calmar_ratio": risk_metrics.calmar_ratio,
            "information_ratio": risk_metrics.information_ratio,
            "beta": risk_metrics.beta,
            "tracking_error_pct": (
                risk_metrics.tracking_error * 100 if risk_metrics.tracking_error else None
            ),
        }

        report.add_section(
            ReportSection(
                title="Risk-Adjusted Performance",
                content=performance,
                section_type="metrics",
                order=2,
            )
        )

        # Capture ratios
        capture = {
            "upside_capture": risk_metrics.upside_capture,
            "downside_capture": risk_metrics.downside_capture,
            "capture_ratio": (
                risk_metrics.upside_capture / risk_metrics.downside_capture
                if risk_metrics.downside_capture and risk_metrics.downside_capture != 0
                else None
            ),
        }

        report.add_section(
            ReportSection(
                title="Capture Ratios",
                content=capture,
                section_type="metrics",
                order=3,
            )
        )

        # Factor exposures
        if factor_exposures:
            factors = {
                "market_beta": factor_exposures.market,
                "size": factor_exposures.size,
                "value": factor_exposures.value,
                "momentum": factor_exposures.momentum,
                "quality": factor_exposures.quality,
                "low_volatility": factor_exposures.low_volatility,
                "growth": factor_exposures.growth,
                "dividend_yield": factor_exposures.dividend_yield,
            }

            report.add_section(
                ReportSection(
                    title="Factor Exposures",
                    content=factors,
                    section_type="factors",
                    order=4,
                )
            )

        # Stress test results
        if scenario_results:
            stress_summary = [
                {
                    "scenario": result.scenario.name,
                    "portfolio_impact_pct": result.portfolio_impact * 100,
                    "equity_impact_pct": result.equity_impact * 100,
                    "fixed_income_impact_pct": result.fixed_income_impact * 100,
                }
                for result in scenario_results
            ]

            # Sort by impact (worst first)
            stress_summary.sort(key=lambda x: x["portfolio_impact_pct"])

            report.add_section(
                ReportSection(
                    title="Stress Test Results",
                    content=stress_summary,
                    section_type="table",
                    order=5,
                )
            )

        return report

    def generate_attribution_report(
        self,
        portfolio: Portfolio,
        attribution_result: AttributionResult,
    ) -> Report:
        """Generate a performance attribution report.

        Args:
            portfolio: The portfolio.
            attribution_result: Attribution analysis results.

        Returns:
            Attribution report.
        """
        report = Report(
            title=f"Attribution Report - {portfolio.name}",
            as_of_date=attribution_result.period_end,
        )

        # Performance summary
        summary = {
            "period_start": attribution_result.period_start.isoformat(),
            "period_end": attribution_result.period_end.isoformat(),
            "portfolio_return_pct": attribution_result.portfolio_return * 100,
            "benchmark_return_pct": attribution_result.benchmark_return * 100,
            "excess_return_pct": attribution_result.excess_return * 100,
        }

        report.add_section(
            ReportSection(
                title="Performance Summary",
                content=summary,
                section_type="summary",
                order=1,
            )
        )

        # Alpha/Beta decomposition
        decomposition = {
            "alpha_pct": attribution_result.alpha * 100,
            "beta_contribution_pct": attribution_result.beta_contribution * 100,
            "selection_effect_pct": attribution_result.selection_total * 100,
            "allocation_effect_pct": attribution_result.allocation_total * 100,
            "timing_contribution_pct": attribution_result.timing_contribution * 100,
            "transaction_cost_drag_pct": attribution_result.transaction_cost_drag * 100,
        }

        report.add_section(
            ReportSection(
                title="Return Decomposition",
                content=decomposition,
                section_type="metrics",
                order=2,
            )
        )

        # Sector attribution
        if attribution_result.sector_attribution:
            sector_data = [
                {
                    "sector": attr.sector,
                    "portfolio_weight_pct": attr.portfolio_weight * 100,
                    "benchmark_weight_pct": attr.benchmark_weight * 100,
                    "portfolio_return_pct": attr.portfolio_return * 100,
                    "benchmark_return_pct": attr.benchmark_return * 100,
                    "allocation_effect_pct": attr.allocation_effect * 100,
                    "selection_effect_pct": attr.selection_effect * 100,
                    "total_effect_pct": attr.total_effect * 100,
                }
                for attr in attribution_result.sector_attribution
            ]

            # Sort by total effect
            sector_data.sort(key=lambda x: x["total_effect_pct"], reverse=True)

            report.add_section(
                ReportSection(
                    title="Sector Attribution",
                    content=sector_data,
                    section_type="table",
                    order=3,
                )
            )

        # Factor attribution
        if attribution_result.factor_attribution:
            factor_data = [
                {
                    "factor": attr.factor,
                    "exposure": attr.factor_exposure,
                    "factor_return_pct": attr.factor_return * 100,
                    "contribution_pct": attr.contribution * 100,
                }
                for attr in attribution_result.factor_attribution
            ]

            # Sort by contribution
            factor_data.sort(key=lambda x: abs(x["contribution_pct"]), reverse=True)

            report.add_section(
                ReportSection(
                    title="Factor Attribution",
                    content=factor_data,
                    section_type="table",
                    order=4,
                )
            )

        return report

    def generate_exposure_summary(
        self,
        portfolio: Portfolio,
    ) -> Report:
        """Generate an exposure summary report.

        Args:
            portfolio: The portfolio.

        Returns:
            Exposure summary report.
        """
        report = Report(
            title=f"Exposure Summary - {portfolio.name}",
            as_of_date=date.today(),
        )

        # Asset class allocation
        asset_allocation = {
            "equity_pct": float(portfolio.equity_allocation),
            "fixed_income_pct": float(portfolio.fixed_income_allocation),
            "cash_pct": 100 - float(portfolio.equity_allocation) - float(
                portfolio.fixed_income_allocation
            ),
        }

        report.add_section(
            ReportSection(
                title="Asset Class Allocation",
                content=asset_allocation,
                section_type="allocation",
                order=1,
            )
        )

        # Sector allocation
        sector_allocation = {
            k: float(v) for k, v in portfolio.get_sector_allocation().items()
        }

        report.add_section(
            ReportSection(
                title="Sector Allocation",
                content=sector_allocation,
                section_type="allocation",
                order=2,
            )
        )

        # Position concentration
        weights = portfolio.get_position_weights()
        concentration = {
            "top_1_pct": float(sorted(weights.values(), reverse=True)[0]) if weights else 0,
            "top_5_pct": float(sum(sorted(weights.values(), reverse=True)[:5])) if weights else 0,
            "top_10_pct": float(sum(sorted(weights.values(), reverse=True)[:10])) if weights else 0,
            "number_of_positions": len(portfolio.positions),
        }

        report.add_section(
            ReportSection(
                title="Position Concentration",
                content=concentration,
                section_type="metrics",
                order=3,
            )
        )

        return report

    def format_report(
        self,
        report: Report,
        format_type: ReportFormat = ReportFormat.MARKDOWN,
    ) -> str:
        """Format a report for output.

        Args:
            report: The report to format.
            format_type: Desired output format.

        Returns:
            Formatted report as string.
        """
        if format_type == ReportFormat.MARKDOWN:
            return self._format_markdown(report)
        elif format_type == ReportFormat.JSON:
            return self._format_json(report)
        elif format_type == ReportFormat.HTML:
            return self._format_html(report)
        elif format_type == ReportFormat.CSV:
            return self._format_csv(report)
        else:
            raise ValueError(f"Unsupported format: {format_type}")

    def _format_markdown(self, report: Report) -> str:
        """Format report as Markdown.

        Args:
            report: The report to format.

        Returns:
            Markdown formatted string.
        """
        lines = [
            f"# {report.title}",
            f"**As of:** {report.as_of_date}",
            f"**Generated:** {report.generated_at.strftime('%Y-%m-%d %H:%M:%S')}",
            "",
        ]

        for section in report.sections:
            lines.append(f"## {section.title}")
            lines.append("")

            if section.section_type == "table" and isinstance(section.content, list):
                # Format as table
                if section.content:
                    headers = list(section.content[0].keys())
                    lines.append("| " + " | ".join(headers) + " |")
                    lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
                    for row in section.content:
                        values = [self._format_value(row.get(h, "")) for h in headers]
                        lines.append("| " + " | ".join(values) + " |")
            elif isinstance(section.content, dict):
                # Format as key-value pairs
                for key, value in section.content.items():
                    formatted_key = key.replace("_", " ").title()
                    formatted_value = self._format_value(value)
                    lines.append(f"- **{formatted_key}:** {formatted_value}")
            else:
                lines.append(str(section.content))

            lines.append("")

        return "\n".join(lines)

    def _format_json(self, report: Report) -> str:
        """Format report as JSON.

        Args:
            report: The report to format.

        Returns:
            JSON formatted string.
        """
        import json

        data = {
            "title": report.title,
            "as_of_date": report.as_of_date.isoformat(),
            "generated_at": report.generated_at.isoformat(),
            "sections": [
                {
                    "title": s.title,
                    "type": s.section_type,
                    "content": s.content,
                }
                for s in report.sections
            ],
            "metadata": report.metadata,
        }

        return json.dumps(data, indent=2, default=str)

    def _format_html(self, report: Report) -> str:
        """Format report as HTML.

        Args:
            report: The report to format.

        Returns:
            HTML formatted string.
        """
        lines = [
            "<!DOCTYPE html>",
            "<html>",
            "<head>",
            f"<title>{report.title}</title>",
            "<style>",
            "body { font-family: Arial, sans-serif; margin: 20px; }",
            "table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }",
            "th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }",
            "th { background-color: #4CAF50; color: white; }",
            "tr:nth-child(even) { background-color: #f2f2f2; }",
            ".metric { margin: 10px 0; }",
            ".section { margin-bottom: 30px; }",
            "</style>",
            "</head>",
            "<body>",
            f"<h1>{report.title}</h1>",
            f"<p><strong>As of:</strong> {report.as_of_date}</p>",
        ]
        generated_str = report.generated_at.strftime('%Y-%m-%d %H:%M:%S')
        lines.append(f"<p><strong>Generated:</strong> {generated_str}</p>")

        for section in report.sections:
            lines.append('<div class="section">')
            lines.append(f"<h2>{section.title}</h2>")

            if section.section_type == "table" and isinstance(section.content, list):
                if section.content:
                    headers = list(section.content[0].keys())
                    lines.append("<table>")
                    lines.append("<tr>" + "".join(f"<th>{h}</th>" for h in headers) + "</tr>")
                    for row in section.content:
                        values = [self._format_value(row.get(h, "")) for h in headers]
                        lines.append("<tr>" + "".join(f"<td>{v}</td>" for v in values) + "</tr>")
                    lines.append("</table>")
            elif isinstance(section.content, dict):
                for key, value in section.content.items():
                    formatted_key = key.replace("_", " ").title()
                    formatted_value = self._format_value(value)
                    metric_html = '<div class="metric">'
                    metric_html += f"<strong>{formatted_key}:</strong> {formatted_value}</div>"
                    lines.append(metric_html)
            else:
                lines.append(f"<p>{section.content}</p>")

            lines.append("</div>")

        lines.extend(["</body>", "</html>"])

        return "\n".join(lines)

    def _format_csv(self, report: Report) -> str:
        """Format report as CSV.

        Args:
            report: The report to format.

        Returns:
            CSV formatted string.
        """
        import csv
        from io import StringIO

        output = StringIO()

        for section in report.sections:
            if (
                section.section_type == "table"
                and isinstance(section.content, list)
                and section.content
            ):
                writer = csv.DictWriter(output, fieldnames=section.content[0].keys())
                output.write(f"# {section.title}\n")
                writer.writeheader()
                writer.writerows(section.content)
                output.write("\n")

        return output.getvalue()

    def _format_value(self, value: Any) -> str:
        """Format a value for display.

        Args:
            value: The value to format.

        Returns:
            Formatted string.
        """
        if value is None:
            return "N/A"
        elif isinstance(value, float):
            if abs(value) >= 1000000:
                return f"${value / 1000000:.2f}M"
            elif abs(value) >= 1000:
                return f"${value / 1000:.1f}K"
            else:
                # For values between -100 and 100, assume percentage
                return f"{value:.2f}"
        elif isinstance(value, Decimal):
            return f"${float(value):,.2f}"
        elif isinstance(value, bool):
            return "Yes" if value else "No"
        else:
            return str(value)
