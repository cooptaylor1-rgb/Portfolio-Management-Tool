import { User, LoginCredentials, RegisterCredentials } from '../types';
import { api } from './api';

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// LocalStorage keys
const STORAGE_KEYS = {
  USER: 'portfolio_user',
  TOKEN: 'portfolio_token',
  USERS_DB: 'portfolio_users_db'
};

// Mock user database (in a real app, this would be server-side)
interface UserRecord {
  id: string;
  email: string;
  password: string; // In production, this would be hashed
  name: string;
  avatar?: string | null;
  createdAt: string;
  lastLogin?: string;
}

class AuthService {
  private isDemoToken(token: string): boolean {
    return token.startsWith('token_');
  }

  private getBackendTokenFromStorage(): string | null {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  private getUsersDB(): UserRecord[] {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS_DB);
    return stored ? JSON.parse(stored) : [];
  }

  private saveUsersDB(users: UserRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
  }

  private generateToken(userId: string): string {
    // In production, use proper JWT tokens
    return `token_${userId}_${Date.now()}`;
  }

  private sanitizeUser(userRecord: UserRecord): User {
    const { password, ...user } = userRecord;
    return user as User;
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    // Prefer backend auth. Only fall back to demo/local auth on network failures.
    const backend = await api.login(credentials.email, credentials.password);
    if (backend.success && backend.data) {
      const { user, accessToken } = backend.data;
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);
      } catch {
        // ignore
      }
      return { user, token: accessToken };
    }

    if (backend.error?.code !== 'NETWORK_ERROR') {
      throw new Error(backend.error?.message || 'Login failed');
    }

    // Demo fallback
    await delay(500);
    const users = this.getUsersDB();
    const userRecord = users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());

    if (!userRecord) {
      throw new Error('Invalid email or password. If you just registered, try refreshing the page.');
    }
    if (userRecord.password !== credentials.password) {
      throw new Error('Invalid email or password');
    }

    userRecord.lastLogin = new Date().toISOString();
    this.saveUsersDB(users);

    const token = this.generateToken(userRecord.id);
    const user = this.sanitizeUser(userRecord);

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);

    return { user, token };
  }

  async register(credentials: RegisterCredentials): Promise<{ user: User; token: string }> {
    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    if (credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Prefer backend registration. Only fall back to demo/local auth on network failures.
    const backend = await api.register(credentials.name, credentials.email, credentials.password);
    if (backend.success && backend.data) {
      const { user, accessToken } = backend.data;
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);
      } catch {
        // ignore
      }
      return { user, token: accessToken };
    }

    if (backend.error?.code !== 'NETWORK_ERROR') {
      throw new Error(backend.error?.message || 'Registration failed');
    }

    // Demo fallback
    await delay(500);
    const users = this.getUsersDB();
    if (users.some(u => u.email.toLowerCase() === credentials.email.toLowerCase())) {
      throw new Error('User with this email already exists');
    }

    const newUserRecord: UserRecord = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: credentials.email,
      password: credentials.password,
      name: credentials.name,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    users.push(newUserRecord);
    this.saveUsersDB(users);

    const token = this.generateToken(newUserRecord.id);
    const user = this.sanitizeUser(newUserRecord);

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);

    return { user, token };
  }

  async logout(): Promise<void> {
    try {
      await api.logout();
    } catch {
      // Ignore network errors; still clear local state.
    }

    await delay(50);
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch {
      // ignore
    }
  }

  getCurrentUser(): User | null {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  }

  getToken(): string | null {
    return this.getBackendTokenFromStorage() || localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  async validateToken(token: string): Promise<boolean> {
    if (!token) return false;

    // Demo tokens are local-only.
    if (this.isDemoToken(token)) {
      await delay(50);
      return true;
    }

    // Backend tokens: validate by calling /auth/me.
    const me = await api.me();
    if (me.success && me.data?.user) {
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(me.data.user));
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      } catch {
        // ignore
      }
      return true;
    }

    return false;
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    await delay(300);

    const users = this.getUsersDB();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updates
    };

    this.saveUsersDB(users);

    const updatedUser = this.sanitizeUser(users[userIndex]);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

    return updatedUser;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    await delay(300);

    const users = this.getUsersDB();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    if (users[userIndex].password !== oldPassword) {
      throw new Error('Current password is incorrect');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    users[userIndex].password = newPassword;
    this.saveUsersDB(users);
  }

  // Search for users (for sharing portfolios)
  async searchUsers(query: string): Promise<User[]> {
    // Prefer backend user search. Fall back to demo DB only on network errors.
    const backend = await api.searchUsers(query, 10);
    if (backend.success && backend.data?.users) {
      return backend.data.users as User[];
    }

    if (backend.error?.code !== 'NETWORK_ERROR') {
      throw new Error(backend.error?.message || 'User search failed');
    }

    await delay(300);
    const users = this.getUsersDB();
    const lowerQuery = query.toLowerCase();
    return users
      .filter(
        (u) => u.email.toLowerCase().includes(lowerQuery) || u.name.toLowerCase().includes(lowerQuery)
      )
      .map((u) => this.sanitizeUser(u))
      .slice(0, 10);
  }
}

export const authService = new AuthService();
