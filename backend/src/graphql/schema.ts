/**
 * GraphQL Schema Definition
 * 
 * Complete GraphQL schema for the Portfolio Management Tool.
 * Uses SDL (Schema Definition Language) for type definitions.
 */

export const typeDefs = `
  # ============================================================================
  # SCALAR TYPES
  # ============================================================================
  
  scalar DateTime
  scalar JSON
  scalar Decimal

  # ============================================================================
  # ENUMS
  # ============================================================================

  enum InvestmentType {
    STOCK
    ETF
    MUTUAL_FUND
    BOND
    CRYPTO
    OPTIONS
    FUTURES
    FOREX
    OTHER
  }

  enum TransactionType {
    BUY
    SELL
    DIVIDEND
    SPLIT
    TRANSFER_IN
    TRANSFER_OUT
  }

  enum SharePermission {
    VIEW
    EDIT
    ADMIN
  }

  enum AlertType {
    PRICE_ABOVE
    PRICE_BELOW
    PERCENT_CHANGE
    VOLUME_SPIKE
    EARNINGS
    DIVIDEND
    NEWS
  }

  enum SortDirection {
    ASC
    DESC
  }

  # ============================================================================
  # INPUT TYPES
  # ============================================================================

  input PaginationInput {
    limit: Int = 20
    offset: Int = 0
  }

  input PortfolioFilterInput {
    search: String
    includeShared: Boolean = true
  }

  input PortfolioSortInput {
    field: String = "updatedAt"
    direction: SortDirection = DESC
  }

  input CreatePortfolioInput {
    name: String!
    description: String
    currency: String = "USD"
    isPublic: Boolean = false
  }

  input UpdatePortfolioInput {
    name: String
    description: String
    currency: String
    isPublic: Boolean
  }

  input CreateInvestmentInput {
    portfolioId: ID!
    symbol: String!
    name: String!
    type: InvestmentType!
    shares: Decimal!
    avgCost: Decimal!
    currency: String = "USD"
    sector: String
    notes: String
  }

  input UpdateInvestmentInput {
    shares: Decimal
    avgCost: Decimal
    sector: String
    notes: String
  }

  input CreateTransactionInput {
    investmentId: ID!
    type: TransactionType!
    shares: Decimal!
    price: Decimal!
    fees: Decimal = "0"
    notes: String
    date: DateTime
  }

  input CreateAlertInput {
    symbol: String!
    type: AlertType!
    threshold: Decimal!
    message: String
  }

  input CreateWatchlistInput {
    symbol: String!
    name: String!
    notes: String
  }

  input SharePortfolioInput {
    portfolioId: ID!
    email: String!
    permission: SharePermission!
  }

  input MonteCarloInput {
    portfolioId: ID!
    years: Int = 10
    simulations: Int = 1000
    inflationRate: Decimal = "0.02"
  }

  input RebalanceInput {
    portfolioId: ID!
    targetAllocations: [TargetAllocationInput!]!
  }

  input TargetAllocationInput {
    symbol: String!
    targetPercent: Decimal!
  }

  # ============================================================================
  # TYPES
  # ============================================================================

  type User {
    id: ID!
    email: String!
    name: String!
    tier: String!
    mfaEnabled: Boolean!
    emailVerified: Boolean!
    createdAt: DateTime!
    portfolios: [Portfolio!]!
    watchlist: [WatchlistItem!]!
    alerts: [Alert!]!
  }

  type Portfolio {
    id: ID!
    name: String!
    description: String
    currency: String!
    isPublic: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    owner: User!
    investments: [Investment!]!
    shares: [PortfolioShare!]!
    activities: [PortfolioActivity!]!
    snapshots(limit: Int = 30): [PortfolioSnapshot!]!
    
    # Computed fields
    totalValue: Decimal!
    totalGain: Decimal!
    totalGainPercent: Decimal!
    dayChange: Decimal!
    dayChangePercent: Decimal!
    metrics: PortfolioMetrics!
  }

  type Investment {
    id: ID!
    symbol: String!
    name: String!
    type: InvestmentType!
    shares: Decimal!
    avgCost: Decimal!
    currency: String!
    sector: String
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
    transactions: [Transaction!]!
    
    # Computed fields (with market data)
    currentPrice: Decimal
    currentValue: Decimal
    gain: Decimal
    gainPercent: Decimal
    dayChange: Decimal
    dayChangePercent: Decimal
    weight: Decimal
  }

  type Transaction {
    id: ID!
    type: TransactionType!
    shares: Decimal!
    price: Decimal!
    fees: Decimal!
    notes: String
    date: DateTime!
    createdAt: DateTime!
    investment: Investment!
    
    # Computed
    totalCost: Decimal!
  }

  type PortfolioShare {
    id: ID!
    permission: SharePermission!
    createdAt: DateTime!
    portfolio: Portfolio!
    user: User!
  }

  type PortfolioActivity {
    id: ID!
    action: String!
    details: JSON
    createdAt: DateTime!
    user: User!
  }

  type PortfolioSnapshot {
    id: ID!
    totalValue: Decimal!
    totalCost: Decimal!
    dayChange: Decimal!
    holdings: JSON!
    date: DateTime!
  }

  type WatchlistItem {
    id: ID!
    symbol: String!
    name: String!
    notes: String
    addedAt: DateTime!
    
    # Market data
    price: Decimal
    change: Decimal
    changePercent: Decimal
  }

  type Alert {
    id: ID!
    symbol: String!
    type: AlertType!
    threshold: Decimal!
    message: String
    triggered: Boolean!
    triggeredAt: DateTime
    createdAt: DateTime!
    
    # Current status
    currentPrice: Decimal
    distanceToTrigger: Decimal
  }

  type Quote {
    symbol: String!
    price: Decimal!
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    previousClose: Decimal
    change: Decimal!
    changePercent: Decimal!
    volume: Int
    marketCap: Decimal
    pe: Decimal
    dividend: Decimal
    dividendYield: Decimal
    week52High: Decimal
    week52Low: Decimal
    updatedAt: DateTime!
  }

  type HistoricalData {
    date: DateTime!
    open: Decimal!
    high: Decimal!
    low: Decimal!
    close: Decimal!
    volume: Int!
    adjustedClose: Decimal
  }

  type NewsItem {
    id: String!
    title: String!
    summary: String
    source: String!
    url: String!
    imageUrl: String
    publishedAt: DateTime!
    symbols: [String!]
    sentiment: String
  }

  type PortfolioMetrics {
    totalValue: Decimal!
    totalCost: Decimal!
    totalGain: Decimal!
    totalGainPercent: Decimal!
    dayChange: Decimal!
    dayChangePercent: Decimal!
    beta: Decimal
    sharpeRatio: Decimal
    volatility: Decimal
    maxDrawdown: Decimal
    diversificationScore: Decimal
  }

  type RiskAnalysis {
    portfolioId: ID!
    var95: Decimal!
    var99: Decimal!
    cvar: Decimal!
    beta: Decimal!
    sharpeRatio: Decimal!
    sortinoRatio: Decimal!
    maxDrawdown: Decimal!
    volatility: Decimal!
    correlationWithMarket: Decimal!
    sectorExposure: JSON!
    geographicExposure: JSON!
  }

  type RebalanceSuggestion {
    symbol: String!
    name: String!
    currentShares: Decimal!
    currentValue: Decimal!
    currentPercent: Decimal!
    targetPercent: Decimal!
    suggestedShares: Decimal!
    sharesChange: Decimal!
    action: String!
  }

  type MonteCarloResult {
    percentiles: MonteCarloPercentiles!
    successRate: Decimal!
    medianFinalValue: Decimal!
    distribution: [MonteCarloDistributionPoint!]!
  }

  type MonteCarloPercentiles {
    p10: [Decimal!]!
    p25: [Decimal!]!
    p50: [Decimal!]!
    p75: [Decimal!]!
    p90: [Decimal!]!
  }

  type MonteCarloDistributionPoint {
    value: Decimal!
    frequency: Int!
  }

  type TaxAnalysis {
    portfolioId: ID!
    shortTermGains: Decimal!
    longTermGains: Decimal!
    shortTermLosses: Decimal!
    longTermLosses: Decimal!
    washSaleRisk: [WashSaleRisk!]!
    taxLossHarvestingOpportunities: [TaxLossOpportunity!]!
  }

  type WashSaleRisk {
    symbol: String!
    soldDate: DateTime!
    boughtDate: DateTime!
    disallowedLoss: Decimal!
  }

  type TaxLossOpportunity {
    symbol: String!
    currentLoss: Decimal!
    taxSavings: Decimal!
    alternatives: [String!]!
  }

  type CorrelationMatrix {
    symbols: [String!]!
    matrix: [[Decimal!]!]!
  }

  type SearchResult {
    symbol: String!
    name: String!
    type: String!
    exchange: String
    currency: String
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
    user: User!
  }

  type MfaSetup {
    secret: String!
    qrCode: String!
    backupCodes: [String!]!
  }

  type PaginatedPortfolios {
    items: [Portfolio!]!
    total: Int!
    hasMore: Boolean!
  }

  # ============================================================================
  # QUERIES
  # ============================================================================

  type Query {
    # User
    me: User!
    
    # Portfolios
    portfolios(
      filter: PortfolioFilterInput
      sort: PortfolioSortInput
      pagination: PaginationInput
    ): PaginatedPortfolios!
    
    portfolio(id: ID!): Portfolio
    
    # Investments
    investment(id: ID!): Investment
    
    # Watchlist
    watchlist: [WatchlistItem!]!
    
    # Alerts
    alerts(triggered: Boolean): [Alert!]!
    
    # Market Data
    quote(symbol: String!): Quote
    quotes(symbols: [String!]!): [Quote!]!
    historicalData(
      symbol: String!
      period: String = "1Y"
      interval: String = "1d"
    ): [HistoricalData!]!
    search(query: String!, limit: Int = 10): [SearchResult!]!
    news(symbols: [String!], limit: Int = 20): [NewsItem!]!
    
    # Analytics
    riskAnalysis(portfolioId: ID!): RiskAnalysis!
    correlationMatrix(portfolioId: ID!): CorrelationMatrix!
    taxAnalysis(portfolioId: ID!, taxRate: Decimal = "0.25"): TaxAnalysis!
    monteCarlo(input: MonteCarloInput!): MonteCarloResult!
    rebalanceSuggestions(input: RebalanceInput!): [RebalanceSuggestion!]!
  }

  # ============================================================================
  # MUTATIONS
  # ============================================================================

  type Mutation {
    # Auth
    register(email: String!, password: String!, name: String!): AuthPayload!
    login(email: String!, password: String!, mfaCode: String): AuthPayload!
    refreshToken(refreshToken: String!): AuthPayload!
    logout: Boolean!
    
    # MFA
    setupMfa: MfaSetup!
    enableMfa(code: String!): Boolean!
    disableMfa(code: String!): Boolean!
    
    # Email verification
    verifyEmail(token: String!): Boolean!
    resendVerificationEmail: Boolean!
    
    # Password
    requestPasswordReset(email: String!): Boolean!
    resetPassword(token: String!, newPassword: String!): Boolean!
    changePassword(currentPassword: String!, newPassword: String!): Boolean!
    
    # Portfolios
    createPortfolio(input: CreatePortfolioInput!): Portfolio!
    updatePortfolio(id: ID!, input: UpdatePortfolioInput!): Portfolio!
    deletePortfolio(id: ID!): Boolean!
    sharePortfolio(input: SharePortfolioInput!): PortfolioShare!
    removePortfolioShare(id: ID!): Boolean!
    
    # Investments
    addInvestment(input: CreateInvestmentInput!): Investment!
    updateInvestment(id: ID!, input: UpdateInvestmentInput!): Investment!
    deleteInvestment(id: ID!): Boolean!
    
    # Transactions
    addTransaction(input: CreateTransactionInput!): Transaction!
    deleteTransaction(id: ID!): Boolean!
    
    # Watchlist
    addToWatchlist(input: CreateWatchlistInput!): WatchlistItem!
    removeFromWatchlist(id: ID!): Boolean!
    updateWatchlistItem(id: ID!, notes: String): WatchlistItem!
    
    # Alerts
    createAlert(input: CreateAlertInput!): Alert!
    deleteAlert(id: ID!): Boolean!
    markAlertAsRead(id: ID!): Alert!
  }

  # ============================================================================
  # SUBSCRIPTIONS
  # ============================================================================

  type Subscription {
    # Real-time price updates
    priceUpdate(symbols: [String!]!): Quote!
    
    # Portfolio updates
    portfolioUpdate(portfolioId: ID!): Portfolio!
    
    # Alert triggers
    alertTriggered: Alert!
    
    # News
    newsUpdate(symbols: [String!]): NewsItem!
  }
`;
