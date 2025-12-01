import { Investment, Alert, RebalanceRecommendation } from '../types';

export function generateAlerts(investments: Investment[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  // Check for significant price movements
  investments.forEach(inv => {
    const priceChange = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
    
    if (priceChange < -15) {
      alerts.push({
        id: `alert_${inv.id}_loss`,
        type: 'performance',
        severity: 'warning',
        title: `${inv.symbol} down significantly`,
        message: `${inv.name} has declined ${Math.abs(priceChange).toFixed(1)}% from your purchase price. Consider reviewing this position.`,
        date: now,
        read: false,
        actionable: true,
      });
    } else if (priceChange > 30) {
      alerts.push({
        id: `alert_${inv.id}_gain`,
        type: 'performance',
        severity: 'info',
        title: `${inv.symbol} strong performance`,
        message: `${inv.name} is up ${priceChange.toFixed(1)}%! Consider taking profits or rebalancing.`,
        date: now,
        read: false,
        actionable: true,
      });
    }
  });

  // Check diversification
  const typeCount = new Set(investments.map(inv => inv.type)).size;
  if (investments.length > 3 && typeCount < 3) {
    alerts.push({
      id: 'alert_diversification',
      type: 'risk',
      severity: 'warning',
      title: 'Low diversification',
      message: 'Your portfolio is concentrated in few asset types. Consider diversifying across stocks, bonds, and other assets.',
      date: now,
      read: false,
      actionable: true,
    });
  }

  // Check for concentration risk
  const totalValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);
  investments.forEach(inv => {
    const positionValue = inv.quantity * inv.currentPrice;
    const percentage = (positionValue / totalValue) * 100;
    
    if (percentage > 30) {
      alerts.push({
        id: `alert_${inv.id}_concentration`,
        type: 'risk',
        severity: 'critical',
        title: 'Concentration risk detected',
        message: `${inv.symbol} represents ${percentage.toFixed(1)}% of your portfolio. Consider reducing exposure to limit risk.`,
        date: now,
        read: false,
        actionable: true,
      });
    }
  });

  // Tax-loss harvesting opportunity
  const endOfYear = new Date().getMonth() >= 10; // November or December
  if (endOfYear) {
    const losers = investments.filter(inv => inv.currentPrice < inv.purchasePrice);
    if (losers.length > 0) {
      alerts.push({
        id: 'alert_tax_loss',
        type: 'tax',
        severity: 'info',
        title: 'Tax-loss harvesting opportunity',
        message: `End of year approaching. ${losers.length} position(s) with losses could be sold to offset capital gains.`,
        date: now,
        read: false,
        actionable: true,
      });
    }
  }

  return alerts;
}

export function generateRebalanceRecommendation(
  investments: Investment[],
  targetAllocations?: Record<string, number>
): RebalanceRecommendation {
  // Calculate current allocation by type
  const totalValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);
  const currentAllocation: Record<string, number> = {};

  investments.forEach(inv => {
    const value = inv.quantity * inv.currentPrice;
    const percentage = (value / totalValue) * 100;
    currentAllocation[inv.type] = (currentAllocation[inv.type] || 0) + percentage;
  });

  // Default target allocation if not provided (balanced portfolio)
  const defaultTargets = {
    stock: 50,
    etf: 20,
    bond: 20,
    crypto: 5,
    'mutual-fund': 5,
    other: 0,
  };

  const target = targetAllocations || defaultTargets;
  const actions: RebalanceRecommendation['actions'] = [];

  // Generate rebalancing actions
  Object.entries(currentAllocation).forEach(([type, current]) => {
    const targetPct = target[type as keyof typeof target] || 0;
    const diff = current - targetPct;

    if (Math.abs(diff) > 5) { // Only recommend if difference > 5%
      const investmentsOfType = investments.filter(inv => inv.type === type);
      if (investmentsOfType.length > 0) {
        const inv = investmentsOfType[0]; // Use first investment of this type
        const targetValue = (targetPct / 100) * totalValue;
        const currentValue = (current / 100) * totalValue;
        const valueDiff = targetValue - currentValue;
        const quantity = Math.abs(valueDiff / inv.currentPrice);

        actions.push({
          symbol: inv.symbol,
          action: diff > 0 ? 'sell' : 'buy',
          quantity: parseFloat(quantity.toFixed(2)),
          reason: diff > 0
            ? `Overweight by ${diff.toFixed(1)}% - reduce ${type} exposure`
            : `Underweight by ${Math.abs(diff).toFixed(1)}% - increase ${type} exposure`,
        });
      }
    }
  });

  return {
    currentAllocation,
    targetAllocation: target,
    actions,
  };
}

export function calculateTaxImpact(investments: Investment[]) {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  return investments.map(inv => {
    const purchaseDate = new Date(inv.purchaseDate);
    const gainLoss = (inv.currentPrice - inv.purchasePrice) * inv.quantity;
    const isLongTerm = purchaseDate < oneYearAgo;
    
    // Simplified tax calculation (US rates)
    const taxRate = isLongTerm ? 0.15 : 0.22; // Long-term vs short-term capital gains
    const taxImpact = gainLoss > 0 ? gainLoss * taxRate : 0;

    return {
      symbol: inv.symbol,
      gainLoss,
      isLongTerm,
      taxRate: taxRate * 100,
      taxImpact,
      daysHeld: Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)),
    };
  });
}

export function findTaxLossHarvestingOpportunities(investments: Investment[]) {
  const opportunities = investments
    .filter(inv => inv.currentPrice < inv.purchasePrice)
    .map(inv => {
      const loss = (inv.purchasePrice - inv.currentPrice) * inv.quantity;
      const taxSavings = loss * 0.22; // Assuming 22% tax rate

      return {
        symbol: inv.symbol,
        name: inv.name,
        currentLoss: loss,
        potentialTaxSavings: taxSavings,
        recommendation: `Sell ${inv.symbol} to realize $${loss.toFixed(2)} loss and save ~$${taxSavings.toFixed(2)} in taxes.`,
      };
    })
    .sort((a, b) => b.potentialTaxSavings - a.potentialTaxSavings);

  return opportunities;
}

export function generateInvestmentInsights(investment: Investment, _marketData?: any) {
  const insights: string[] = [];
  const priceChange = ((investment.currentPrice - investment.purchasePrice) / investment.purchasePrice) * 100;

  // Performance insights
  if (priceChange > 20) {
    insights.push(`🎉 Excellent performance! Up ${priceChange.toFixed(1)}% from purchase price.`);
  } else if (priceChange > 10) {
    insights.push(`📈 Strong gains of ${priceChange.toFixed(1)}%. Consider taking some profits.`);
  } else if (priceChange > 0) {
    insights.push(`✅ Positive return of ${priceChange.toFixed(1)}%.`);
  } else if (priceChange > -10) {
    insights.push(`⚠️ Slight decline of ${Math.abs(priceChange).toFixed(1)}%. Monitor closely.`);
  } else {
    insights.push(`📉 Down ${Math.abs(priceChange).toFixed(1)}%. Consider averaging down or cutting losses.`);
  }

  // Position size insights
  // (Would need total portfolio value to calculate - placeholder)
  insights.push(`💡 Hold ${investment.quantity} shares valued at $${(investment.quantity * investment.currentPrice).toFixed(2)}.`);

  return insights;
}
