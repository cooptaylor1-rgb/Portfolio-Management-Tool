/**
 * Real-time Market Data Service
 * 
 * Manages WebSocket connections for live price updates
 * and provides real-time quote streaming.
 */

type QuoteHandler = (quote: Quote) => void;
type ConnectionHandler = (status: 'connected' | 'disconnected' | 'error') => void;

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: string;
  mock?: boolean;
}

class RealTimeMarketService {
  private ws: WebSocket | null = null;
  private subscriptions = new Set<string>();
  private quoteHandlers = new Map<string, Set<QuoteHandler>>();
  private connectionHandlers = new Set<ConnectionHandler>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private latestQuotes = new Map<string, Quote>();

  private wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/api/v2/market/stream';

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Wait for existing connection attempt
        const checkConnection = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log('[RealTimeMarket] WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers('connected');
          
          // Resubscribe to existing subscriptions
          if (this.subscriptions.size > 0) {
            this.sendSubscribe(Array.from(this.subscriptions));
          }
          
          resolve();
        };

        this.ws.onclose = () => {
          console.log('[RealTimeMarket] WebSocket disconnected');
          this.isConnecting = false;
          this.notifyConnectionHandlers('disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[RealTimeMarket] WebSocket error:', error);
          this.isConnecting = false;
          this.notifyConnectionHandlers('error');
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[RealTimeMarket] Failed to parse message:', error);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.quoteHandlers.clear();
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[RealTimeMarket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[RealTimeMarket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(() => {
        // Error already logged
      });
    }, delay);
  }

  private handleMessage(message: { type: string; data?: any; symbols?: string[] }) {
    switch (message.type) {
      case 'quote':
        if (message.data) {
          this.handleQuote(message.data);
        }
        break;
      case 'subscribed':
        console.log('[RealTimeMarket] Subscribed to:', message.symbols);
        break;
      case 'unsubscribed':
        console.log('[RealTimeMarket] Unsubscribed from:', message.symbols);
        break;
      case 'error':
        console.error('[RealTimeMarket] Server error:', message);
        break;
    }
  }

  private handleQuote(quote: Quote) {
    this.latestQuotes.set(quote.symbol, quote);
    
    const handlers = this.quoteHandlers.get(quote.symbol);
    if (handlers) {
      handlers.forEach((handler) => handler(quote));
    }

    // Also notify global handlers
    const globalHandlers = this.quoteHandlers.get('*');
    if (globalHandlers) {
      globalHandlers.forEach((handler) => handler(quote));
    }
  }

  private sendSubscribe(symbols: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'subscribe', symbols }));
    }
  }

  private sendUnsubscribe(symbols: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'unsubscribe', symbols }));
    }
  }

  private notifyConnectionHandlers(status: 'connected' | 'disconnected' | 'error') {
    this.connectionHandlers.forEach((handler) => handler(status));
  }

  // Public API

  async subscribe(symbols: string | string[], handler: QuoteHandler): Promise<() => void> {
    const symbolList = Array.isArray(symbols) ? symbols : [symbols];
    
    // Connect if not connected
    await this.connect();

    // Add subscriptions and handlers
    symbolList.forEach((symbol) => {
      this.subscriptions.add(symbol.toUpperCase());
      
      if (!this.quoteHandlers.has(symbol.toUpperCase())) {
        this.quoteHandlers.set(symbol.toUpperCase(), new Set());
      }
      this.quoteHandlers.get(symbol.toUpperCase())!.add(handler);
    });

    // Send subscribe message
    this.sendSubscribe(symbolList.map((s) => s.toUpperCase()));

    // Return unsubscribe function
    return () => {
      symbolList.forEach((symbol) => {
        const handlers = this.quoteHandlers.get(symbol.toUpperCase());
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            this.quoteHandlers.delete(symbol.toUpperCase());
            this.subscriptions.delete(symbol.toUpperCase());
            this.sendUnsubscribe([symbol.toUpperCase()]);
          }
        }
      });
    };
  }

  subscribeAll(handler: QuoteHandler): () => void {
    if (!this.quoteHandlers.has('*')) {
      this.quoteHandlers.set('*', new Set());
    }
    this.quoteHandlers.get('*')!.add(handler);

    return () => {
      this.quoteHandlers.get('*')?.delete(handler);
    };
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  getLatestQuote(symbol: string): Quote | undefined {
    return this.latestQuotes.get(symbol.toUpperCase());
  }

  getAllLatestQuotes(): Map<string, Quote> {
    return new Map(this.latestQuotes);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const realTimeMarket = new RealTimeMarketService();

// React hook for real-time quotes
import { useState, useEffect, useCallback } from 'react';

export function useRealTimeQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (symbols.length === 0) return;

    const handleQuote = (quote: Quote) => {
      setQuotes((prev) => new Map(prev).set(quote.symbol, quote));
    };

    const handleConnection = (status: 'connected' | 'disconnected' | 'error') => {
      setIsConnected(status === 'connected');
    };

    const unsubConnection = realTimeMarket.onConnectionChange(handleConnection);
    
    let unsubQuotes: (() => void) | undefined;
    
    realTimeMarket.subscribe(symbols, handleQuote).then((unsub) => {
      unsubQuotes = unsub;
    });

    // Initialize with latest quotes
    symbols.forEach((symbol) => {
      const latest = realTimeMarket.getLatestQuote(symbol);
      if (latest) {
        setQuotes((prev) => new Map(prev).set(symbol, latest));
      }
    });

    return () => {
      unsubConnection();
      unsubQuotes?.();
    };
  }, [symbols.join(',')]);

  const getQuote = useCallback((symbol: string) => quotes.get(symbol.toUpperCase()), [quotes]);

  return { quotes, isConnected, getQuote };
}

export function useRealTimeQuote(symbol: string) {
  const [quote, setQuote] = useState<Quote | undefined>(
    realTimeMarket.getLatestQuote(symbol)
  );
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!symbol) return;

    const handleQuote = (q: Quote) => {
      setQuote(q);
    };

    const handleConnection = (status: 'connected' | 'disconnected' | 'error') => {
      setIsConnected(status === 'connected');
    };

    const unsubConnection = realTimeMarket.onConnectionChange(handleConnection);
    
    let unsubQuote: (() => void) | undefined;
    
    realTimeMarket.subscribe(symbol, handleQuote).then((unsub) => {
      unsubQuote = unsub;
    });

    return () => {
      unsubConnection();
      unsubQuote?.();
    };
  }, [symbol]);

  return { quote, isConnected };
}
