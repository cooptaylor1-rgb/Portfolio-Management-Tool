import { Portfolio, SharedUser, PortfolioActivity, Investment } from '../types';
import { api } from './api';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const permissionToBackend = (p: SharedUser['permission']): 'VIEW' | 'EDIT' | 'ADMIN' => {
  switch (p) {
    case 'admin':
      return 'ADMIN';
    case 'edit':
      return 'EDIT';
    default:
      return 'VIEW';
  }
};

const permissionFromBackend = (p: string | undefined): SharedUser['permission'] => {
  switch ((p || '').toUpperCase()) {
    case 'ADMIN':
      return 'admin';
    case 'EDIT':
      return 'edit';
    default:
      return 'view';
  }
};

const mapActivity = (a: any): PortfolioActivity => {
  const action = String(a?.action || '').toUpperCase();
  const userName = a?.user?.name || 'User';
  const portfolioName = a?.portfolio?.name;
  const createdAt = a?.createdAt || a?.timestamp || new Date().toISOString();
  const details = a?.details || {};

  const toFrontendAction = (): PortfolioActivity['action'] => {
    switch (action) {
      case 'CREATED':
        return 'created';
      case 'UPDATED':
        return 'updated';
      case 'DELETED':
        return 'deleted';
      case 'SHARED':
        return 'shared';
      case 'UNSHARED':
        return 'updated';
      case 'INVESTMENT_ADDED':
        return 'investment_added';
      case 'INVESTMENT_REMOVED':
        return 'investment_removed';
      case 'INVESTMENT_UPDATED':
        return 'investment_updated';
      default:
        return 'updated';
    }
  };

  const description = (() => {
    if (action === 'CREATED') return `Created portfolio "${details?.name || portfolioName || ''}"`.trim();
    if (action === 'UPDATED') return `Updated portfolio "${portfolioName || ''}"`.trim();
    if (action === 'DELETED') return `Deleted portfolio "${portfolioName || ''}"`.trim();
    if (action === 'SHARED') return `Shared portfolio with ${details?.sharedWith || 'a user'} (${details?.permission || ''})`.trim();
    if (action === 'UNSHARED') return `Removed shared access for ${details?.removedUser || 'a user'}`.trim();
    if (action === 'INVESTMENT_ADDED') return `Added ${details?.symbol || 'investment'} to portfolio`;
    if (action === 'INVESTMENT_REMOVED') return `Removed ${details?.symbol || 'investment'} from portfolio`;
    if (action === 'INVESTMENT_UPDATED') return `Updated ${details?.symbol || 'investment'} in portfolio`;
    return 'Updated portfolio';
  })();

  return {
    id: a?.id || `activity_${Date.now()}`,
    portfolioId: a?.portfolioId || a?.portfolio?.id,
    userId: a?.userId || a?.user?.id,
    userName,
    action: toFrontendAction(),
    description,
    timestamp: createdAt,
    changes: details,
  };
};

class CollaborationService {
  async createPortfolio(
    name: string, 
    description: string, 
    userId: string,
    investments: Investment[] = []
  ): Promise<Portfolio> {
    // Prefer backend
    const res = await api.createPortfolio({ name, description: description || undefined });
    if (res.success && res.data?.portfolio) {
      // Return a minimal shape compatible with existing UI
      return {
        id: res.data.portfolio.id,
        name: res.data.portfolio.name,
        description: res.data.portfolio.description,
        ownerId: (res.data.portfolio as any).ownerId || userId,
        investments,
        createdAt: res.data.portfolio.createdAt,
        updatedAt: res.data.portfolio.updatedAt,
        isPublic: res.data.portfolio.isPublic,
        sharedWith: [],
      };
    }

    if (res.error?.code && res.error.code !== 'NETWORK_ERROR') {
      throw new Error(res.error.message || 'Failed to create portfolio');
    }

    // Demo fallback
    await delay(300);
    return {
      id: `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      ownerId: userId,
      investments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      sharedWith: [],
    };
  }

  async getPortfolio(portfolioId: string): Promise<Portfolio | null> {
    const res = await api.getPortfolio(portfolioId);
    if (!res.success || !res.data?.portfolio) {
      if (res.error?.code !== 'NETWORK_ERROR') return null;
      await delay(200);
      return null;
    }

    const p = res.data.portfolio;
    const sharedWith: SharedUser[] = Array.isArray(p?.shares)
      ? p.shares.map((s: any) => ({
          userId: s.user?.id || s.userId,
          email: s.user?.email,
          name: s.user?.name,
          permission: permissionFromBackend(s.permission),
          addedAt: s.createdAt || new Date().toISOString(),
        }))
      : [];

    // This view only needs sharing metadata; backend investment rows use a different enum/value shape.
    const investmentsList: Investment[] = [];

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      ownerId: p.ownerId,
      investments: investmentsList,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      isPublic: !!p.isPublic,
      sharedWith,
      permission: p.permission,
      isOwner: !!p.isOwner,
    };
  }

  async getUserPortfolios(): Promise<Portfolio[]> {
    const res = await api.getPortfolios();
    if (res.success && res.data?.portfolios) {
      return (res.data.portfolios as any[]).map((p) => {
        const investmentCount = typeof p.investmentCount === 'number' ? p.investmentCount : 0;
        const shareCount = typeof p.shareCount === 'number' ? p.shareCount : undefined;
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          ownerId: p.ownerId,
          investments: [],
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          isPublic: !!p.isPublic,
          sharedWith: [],
          investmentCount,
          shareCount,
          permission: p.permission,
          isOwner: !!p.isOwner,
        } as Portfolio;
      });
    }

    if (res.error?.code && res.error.code !== 'NETWORK_ERROR') {
      throw new Error(res.error.message || 'Failed to load portfolios');
    }

    // Demo fallback
    await delay(200);
    return [];
  }

  async updatePortfolio(
    portfolioId: string, 
    userId: string,
    updates: Partial<Portfolio>
  ): Promise<Portfolio> {
    const res = await api.updatePortfolio(portfolioId, updates as any);
    if (res.success && res.data?.portfolio) {
      const p = res.data.portfolio as any;
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        ownerId: p.ownerId || userId,
        investments: [],
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        isPublic: !!p.isPublic,
        sharedWith: [],
      };
    }

    // Demo fallback
    await delay(300);
    throw new Error(res.error?.message || 'Failed to update portfolio');
  }

  async deletePortfolio(portfolioId: string): Promise<void> {
    const res = await api.deletePortfolio(portfolioId);
    if (res.success) return;

    await delay(200);
    throw new Error(res.error?.message || 'Failed to delete portfolio');
  }

  // Sharing & Collaboration
  async sharePortfolio(
    portfolioId: string, 
    sharedUser: SharedUser
  ): Promise<Portfolio> {
    const res = await api.sharePortfolio(portfolioId, sharedUser.email, permissionToBackend(sharedUser.permission));
    if (!res.success) {
      await delay(200);
      throw new Error(res.error?.message || 'Failed to share portfolio');
    }

    const updated = await this.getPortfolio(portfolioId);
    if (!updated) throw new Error('Portfolio not found');
    return updated;
  }

  async removeSharedUser(
    portfolioId: string, 
    removeUserId: string
  ): Promise<Portfolio> {
    const res = await api.unsharePortfolio(portfolioId, removeUserId);
    if (!res.success) {
      await delay(200);
      throw new Error(res.error?.message || 'Failed to remove shared user');
    }

    const updated = await this.getPortfolio(portfolioId);
    if (!updated) throw new Error('Portfolio not found');
    return updated;
  }

  // Activity Feed
  async getPortfolioActivities(portfolioId: string, limit: number = 50): Promise<PortfolioActivity[]> {
    const res = await api.getPortfolioActivity(portfolioId, limit);
    if (res.success && res.data?.activities) {
      return res.data.activities.map(mapActivity);
    }

    await delay(200);
    return [];
  }

  async getUserActivities(limit: number = 50): Promise<PortfolioActivity[]> {
    const res = await api.getUserActivity(limit);
    if (res.success && res.data?.activities) {
      return res.data.activities.map(mapActivity);
    }

    await delay(200);
    return [];
  }

  // Public Portfolios Discovery
  async getPublicPortfolios(limit: number = 20): Promise<Portfolio[]> {
    void limit;
    await delay(300);

    // Not implemented server-side yet; keep demo behavior as empty list.
    return [];
  }
}

export const collaborationService = new CollaborationService();
