import { Portfolio, SharedUser, PortfolioActivity, Investment } from '../types';

// LocalStorage keys
const STORAGE_KEYS = {
  PORTFOLIOS: 'portfolio_portfolios',
  ACTIVITIES: 'portfolio_activities',
  INVITES: 'portfolio_invites'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class CollaborationService {
  // Portfolio Management
  private getPortfolios(): Portfolio[] {
    const stored = localStorage.getItem(STORAGE_KEYS.PORTFOLIOS);
    return stored ? JSON.parse(stored) : [];
  }

  private savePortfolios(portfolios: Portfolio[]): void {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify(portfolios));
  }

  private getActivities(): PortfolioActivity[] {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return stored ? JSON.parse(stored) : [];
  }

  private saveActivities(activities: PortfolioActivity[]): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }

  private addActivity(activity: Omit<PortfolioActivity, 'id' | 'timestamp'>): void {
    const activities = this.getActivities();
    const newActivity: PortfolioActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    activities.unshift(newActivity);
    // Keep only last 500 activities
    if (activities.length > 500) {
      activities.splice(500);
    }
    this.saveActivities(activities);
  }

  async createPortfolio(
    name: string, 
    description: string, 
    userId: string, 
    userName: string,
    investments: Investment[] = []
  ): Promise<Portfolio> {
    await delay(300);

    const portfolio: Portfolio = {
      id: `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      ownerId: userId,
      investments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      sharedWith: []
    };

    const portfolios = this.getPortfolios();
    portfolios.push(portfolio);
    this.savePortfolios(portfolios);

    this.addActivity({
      portfolioId: portfolio.id,
      userId,
      userName,
      action: 'created',
      description: `Created portfolio "${name}"`
    });

    return portfolio;
  }

  async getPortfolio(portfolioId: string, userId: string): Promise<Portfolio | null> {
    await delay(200);

    const portfolios = this.getPortfolios();
    const portfolio = portfolios.find(p => p.id === portfolioId);

    if (!portfolio) return null;

    // Check permissions
    const hasAccess = 
      portfolio.ownerId === userId ||
      portfolio.isPublic ||
      portfolio.sharedWith.some(u => u.userId === userId);

    return hasAccess ? portfolio : null;
  }

  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    await delay(200);

    const portfolios = this.getPortfolios();
    return portfolios.filter(p => 
      p.ownerId === userId || 
      p.sharedWith.some(u => u.userId === userId)
    );
  }

  async updatePortfolio(
    portfolioId: string, 
    userId: string, 
    userName: string,
    updates: Partial<Portfolio>
  ): Promise<Portfolio> {
    await delay(300);

    const portfolios = this.getPortfolios();
    const index = portfolios.findIndex(p => p.id === portfolioId);

    if (index === -1) {
      throw new Error('Portfolio not found');
    }

    const portfolio = portfolios[index];

    // Check permissions
    const hasEditPermission = 
      portfolio.ownerId === userId ||
      portfolio.sharedWith.some(u => u.userId === userId && (u.permission === 'edit' || u.permission === 'admin'));

    if (!hasEditPermission) {
      throw new Error('You do not have permission to edit this portfolio');
    }

    portfolios[index] = {
      ...portfolio,
      ...updates,
      id: portfolio.id, // Prevent ID change
      ownerId: portfolio.ownerId, // Prevent owner change
      updatedAt: new Date().toISOString()
    };

    this.savePortfolios(portfolios);

    this.addActivity({
      portfolioId,
      userId,
      userName,
      action: 'updated',
      description: `Updated portfolio "${portfolio.name}"`,
      changes: updates
    });

    return portfolios[index];
  }

  async deletePortfolio(portfolioId: string, userId: string): Promise<void> {
    await delay(300);

    const portfolios = this.getPortfolios();
    const portfolio = portfolios.find(p => p.id === portfolioId);

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    if (portfolio.ownerId !== userId) {
      throw new Error('Only the owner can delete this portfolio');
    }

    const filtered = portfolios.filter(p => p.id !== portfolioId);
    this.savePortfolios(filtered);

    this.addActivity({
      portfolioId,
      userId,
      userName: 'User',
      action: 'deleted',
      description: `Deleted portfolio "${portfolio.name}"`
    });
  }

  // Sharing & Collaboration
  async sharePortfolio(
    portfolioId: string, 
    userId: string, 
    userName: string,
    sharedUser: SharedUser
  ): Promise<Portfolio> {
    await delay(300);

    const portfolios = this.getPortfolios();
    const index = portfolios.findIndex(p => p.id === portfolioId);

    if (index === -1) {
      throw new Error('Portfolio not found');
    }

    const portfolio = portfolios[index];

    if (portfolio.ownerId !== userId) {
      throw new Error('Only the owner can share this portfolio');
    }

    // Check if already shared
    const existingIndex = portfolio.sharedWith.findIndex(u => u.userId === sharedUser.userId);
    if (existingIndex !== -1) {
      // Update permission
      portfolio.sharedWith[existingIndex] = sharedUser;
    } else {
      portfolio.sharedWith.push(sharedUser);
    }

    portfolio.updatedAt = new Date().toISOString();
    this.savePortfolios(portfolios);

    this.addActivity({
      portfolioId,
      userId,
      userName,
      action: 'shared',
      description: `Shared portfolio with ${sharedUser.name} (${sharedUser.permission})`
    });

    return portfolio;
  }

  async removeSharedUser(
    portfolioId: string, 
    userId: string, 
    userName: string,
    removeUserId: string
  ): Promise<Portfolio> {
    await delay(300);

    const portfolios = this.getPortfolios();
    const index = portfolios.findIndex(p => p.id === portfolioId);

    if (index === -1) {
      throw new Error('Portfolio not found');
    }

    const portfolio = portfolios[index];

    if (portfolio.ownerId !== userId) {
      throw new Error('Only the owner can remove shared users');
    }

    portfolio.sharedWith = portfolio.sharedWith.filter(u => u.userId !== removeUserId);
    portfolio.updatedAt = new Date().toISOString();
    this.savePortfolios(portfolios);

    this.addActivity({
      portfolioId,
      userId,
      userName,
      action: 'updated',
      description: `Removed shared access for a user`
    });

    return portfolio;
  }

  // Investment Management within Portfolio
  async addInvestmentToPortfolio(
    portfolioId: string, 
    userId: string, 
    userName: string,
    investment: Investment
  ): Promise<Portfolio> {
    await delay(300);

    const portfolios = this.getPortfolios();
    const index = portfolios.findIndex(p => p.id === portfolioId);

    if (index === -1) {
      throw new Error('Portfolio not found');
    }

    const portfolio = portfolios[index];

    // Check permissions
    const hasEditPermission = 
      portfolio.ownerId === userId ||
      portfolio.sharedWith.some(u => u.userId === userId && (u.permission === 'edit' || u.permission === 'admin'));

    if (!hasEditPermission) {
      throw new Error('You do not have permission to edit this portfolio');
    }

    portfolio.investments.push(investment);
    portfolio.updatedAt = new Date().toISOString();
    this.savePortfolios(portfolios);

    this.addActivity({
      portfolioId,
      userId,
      userName,
      action: 'investment_added',
      description: `Added ${investment.symbol} to portfolio`
    });

    return portfolio;
  }

  async updateInvestmentInPortfolio(
    portfolioId: string, 
    userId: string, 
    userName: string,
    investmentId: string,
    updates: Partial<Investment>
  ): Promise<Portfolio> {
    await delay(300);

    const portfolios = this.getPortfolios();
    const index = portfolios.findIndex(p => p.id === portfolioId);

    if (index === -1) {
      throw new Error('Portfolio not found');
    }

    const portfolio = portfolios[index];

    const hasEditPermission = 
      portfolio.ownerId === userId ||
      portfolio.sharedWith.some(u => u.userId === userId && (u.permission === 'edit' || u.permission === 'admin'));

    if (!hasEditPermission) {
      throw new Error('You do not have permission to edit this portfolio');
    }

    const invIndex = portfolio.investments.findIndex(inv => inv.id === investmentId);
    if (invIndex === -1) {
      throw new Error('Investment not found in portfolio');
    }

    portfolio.investments[invIndex] = {
      ...portfolio.investments[invIndex],
      ...updates
    };
    portfolio.updatedAt = new Date().toISOString();
    this.savePortfolios(portfolios);

    this.addActivity({
      portfolioId,
      userId,
      userName,
      action: 'investment_updated',
      description: `Updated ${portfolio.investments[invIndex].symbol} in portfolio`
    });

    return portfolio;
  }

  async removeInvestmentFromPortfolio(
    portfolioId: string, 
    userId: string, 
    userName: string,
    investmentId: string
  ): Promise<Portfolio> {
    await delay(300);

    const portfolios = this.getPortfolios();
    const index = portfolios.findIndex(p => p.id === portfolioId);

    if (index === -1) {
      throw new Error('Portfolio not found');
    }

    const portfolio = portfolios[index];

    const hasEditPermission = 
      portfolio.ownerId === userId ||
      portfolio.sharedWith.some(u => u.userId === userId && (u.permission === 'edit' || u.permission === 'admin'));

    if (!hasEditPermission) {
      throw new Error('You do not have permission to edit this portfolio');
    }

    const investment = portfolio.investments.find(inv => inv.id === investmentId);
    portfolio.investments = portfolio.investments.filter(inv => inv.id !== investmentId);
    portfolio.updatedAt = new Date().toISOString();
    this.savePortfolios(portfolios);

    this.addActivity({
      portfolioId,
      userId,
      userName,
      action: 'investment_removed',
      description: `Removed ${investment?.symbol || 'investment'} from portfolio`
    });

    return portfolio;
  }

  // Activity Feed
  async getPortfolioActivities(portfolioId: string, limit: number = 50): Promise<PortfolioActivity[]> {
    await delay(200);

    const activities = this.getActivities();
    return activities
      .filter(a => a.portfolioId === portfolioId)
      .slice(0, limit);
  }

  async getUserActivities(userId: string, limit: number = 50): Promise<PortfolioActivity[]> {
    await delay(200);

    const activities = this.getActivities();
    const userPortfolios = await this.getUserPortfolios(userId);
    const portfolioIds = new Set(userPortfolios.map(p => p.id));

    return activities
      .filter(a => portfolioIds.has(a.portfolioId))
      .slice(0, limit);
  }

  // Public Portfolios Discovery
  async getPublicPortfolios(limit: number = 20): Promise<Portfolio[]> {
    await delay(300);

    const portfolios = this.getPortfolios();
    return portfolios
      .filter(p => p.isPublic)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }
}

export const collaborationService = new CollaborationService();
