// AI-powered search service using OpenAI API
import { Investment, PortfolioStats } from '../types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_BASE = 'https://api.openai.com/v1';

interface SearchContext {
  investments: Investment[];
  stats: PortfolioStats;
  query: string;
}

interface AISearchResult {
  answer: string;
  relevantInvestments: Investment[];
  suggestions: string[];
  confidence: number;
}

/**
 * Performs AI-powered search across the portfolio using OpenAI
 */
export async function searchWithAI(context: SearchContext): Promise<AISearchResult> {
  if (!OPENAI_API_KEY) {
    return getFallbackSearch(context);
  }

  try {
    // Prepare context for AI
    const portfolioContext = preparePortfolioContext(context);
    
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful financial assistant analyzing a user's investment portfolio. 
            Provide clear, concise answers about their investments, performance, and recommendations.
            Always cite specific investments by name when relevant.
            Keep responses under 150 words and actionable.`
          },
          {
            role: 'user',
            content: `Portfolio Context:\n${portfolioContext}\n\nUser Question: ${context.query}`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content || 'No answer generated';

    // Extract relevant investments mentioned in the answer
    const relevantInvestments = findRelevantInvestments(answer, context.investments);

    // Generate follow-up suggestions
    const suggestions = generateSuggestions(context.query, context.investments);

    return {
      answer,
      relevantInvestments,
      suggestions,
      confidence: 0.9
    };

  } catch (error) {
    console.error('AI search error:', error);
    return getFallbackSearch(context);
  }
}

/**
 * Prepares portfolio data as context for the AI
 */
function preparePortfolioContext(context: SearchContext): string {
  const { investments, stats } = context;
  
  let contextStr = `Portfolio Summary:
- Total Value: $${stats.totalValue.toFixed(2)}
- Total Gain/Loss: $${stats.totalGainLoss.toFixed(2)} (${stats.gainLossPercentage.toFixed(2)}%)
- Number of Holdings: ${investments.length}
- Diversity Score: ${stats.diversificationScore}/100

Holdings:\n`;

  investments.forEach(inv => {
    const gainLoss = (inv.currentPrice - inv.purchasePrice) * inv.quantity;
    const gainLossPercent = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
    contextStr += `- ${inv.name} (${inv.symbol}): ${inv.type}, ${inv.quantity} shares, `;
    contextStr += `Current: $${inv.currentPrice}, Gain/Loss: $${gainLoss.toFixed(2)} (${gainLossPercent.toFixed(2)}%)\n`;
  });

  return contextStr;
}

/**
 * Finds investments mentioned in the AI response
 */
function findRelevantInvestments(answer: string, investments: Investment[]): Investment[] {
  const relevant: Investment[] = [];
  const answerLower = answer.toLowerCase();

  investments.forEach(inv => {
    if (
      answerLower.includes(inv.name.toLowerCase()) ||
      answerLower.includes(inv.symbol.toLowerCase()) ||
      answerLower.includes(inv.type.toLowerCase())
    ) {
      relevant.push(inv);
    }
  });

  return relevant;
}

/**
 * Generates contextual follow-up suggestions
 */
function generateSuggestions(query: string, _investments: Investment[]): string[] {
  const queryLower = query.toLowerCase();
  const suggestions: string[] = [];

  if (queryLower.includes('best') || queryLower.includes('top') || queryLower.includes('perform')) {
    suggestions.push('What are my worst performing investments?');
    suggestions.push('How can I improve my portfolio balance?');
  }

  if (queryLower.includes('risk') || queryLower.includes('safe') || queryLower.includes('volatile')) {
    suggestions.push('What is my portfolio volatility?');
    suggestions.push('Should I diversify more?');
  }

  if (queryLower.includes('sell') || queryLower.includes('buy') || queryLower.includes('trade')) {
    suggestions.push('What are the tax implications?');
    suggestions.push('Show me rebalancing recommendations');
  }

  if (queryLower.includes('sector') || queryLower.includes('industry')) {
    suggestions.push('How is my portfolio diversified by sector?');
    suggestions.push('Which sectors should I add?');
  }

  // Default suggestions if none matched
  if (suggestions.length === 0) {
    suggestions.push('What are my best performing investments?');
    suggestions.push('How risky is my portfolio?');
    suggestions.push('Show me diversification recommendations');
  }

  return suggestions.slice(0, 3);
}

/**
 * Fallback search when OpenAI API is not available
 */
function getFallbackSearch(context: SearchContext): AISearchResult {
  const { query, investments, stats } = context;
  const queryLower = query.toLowerCase();

  // Simple keyword matching
  let answer = '';
  let relevantInvestments: Investment[] = [];

  if (queryLower.includes('best') || queryLower.includes('top') || queryLower.includes('winner')) {
    const sorted = [...investments].sort((a, b) => {
      const aGain = ((a.currentPrice - a.purchasePrice) / a.purchasePrice) * 100;
      const bGain = ((b.currentPrice - b.purchasePrice) / b.purchasePrice) * 100;
      return bGain - aGain;
    });
    relevantInvestments = sorted.slice(0, 3);
    answer = `Your top performing investments are ${relevantInvestments.map(inv => {
      const gain = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
      return `${inv.name} (+${gain.toFixed(2)}%)`;
    }).join(', ')}.`;
  } else if (queryLower.includes('worst') || queryLower.includes('losing') || queryLower.includes('loser')) {
    const sorted = [...investments].sort((a, b) => {
      const aGain = ((a.currentPrice - a.purchasePrice) / a.purchasePrice) * 100;
      const bGain = ((b.currentPrice - b.purchasePrice) / b.purchasePrice) * 100;
      return aGain - bGain;
    });
    relevantInvestments = sorted.slice(0, 3);
    answer = `Your lowest performing investments are ${relevantInvestments.map(inv => {
      const gain = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
      return `${inv.name} (${gain.toFixed(2)}%)`;
    }).join(', ')}.`;
  } else if (queryLower.includes('total') || queryLower.includes('value') || queryLower.includes('worth')) {
    answer = `Your portfolio is worth $${stats.totalValue.toFixed(2)} with a total ${stats.totalGainLoss >= 0 ? 'gain' : 'loss'} of $${Math.abs(stats.totalGainLoss).toFixed(2)} (${stats.gainLossPercentage.toFixed(2)}%).`;
  } else if (queryLower.includes('diversif') || queryLower.includes('balance')) {
    answer = `Your portfolio has a diversity score of ${stats.diversificationScore}/100. ${stats.diversificationScore < 50 ? 'Consider adding more variety to improve diversification.' : 'Your portfolio is reasonably diversified.'}`;
  } else {
    // Search by symbol or name
    relevantInvestments = investments.filter(inv =>
      inv.name.toLowerCase().includes(queryLower) ||
      inv.symbol.toLowerCase().includes(queryLower) ||
      inv.type.toLowerCase().includes(queryLower)
    );

    if (relevantInvestments.length > 0) {
      const inv = relevantInvestments[0];
      const gain = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
      answer = `${inv.name} (${inv.symbol}): ${inv.type} with ${inv.quantity} shares at $${inv.currentPrice}. ${gain >= 0 ? 'Up' : 'Down'} ${Math.abs(gain).toFixed(2)}% since purchase.`;
    } else {
      answer = "I couldn't find specific information about that. Try asking about your best investments, portfolio value, or diversification.";
    }
  }

  return {
    answer,
    relevantInvestments: relevantInvestments.slice(0, 5),
    suggestions: generateSuggestions(query, investments),
    confidence: 0.7
  };
}

/**
 * Checks if OpenAI API is configured
 */
export function isAISearchAvailable(): boolean {
  return !!OPENAI_API_KEY && OPENAI_API_KEY !== '';
}
