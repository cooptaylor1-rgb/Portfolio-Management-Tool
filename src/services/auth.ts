import { User, LoginCredentials, RegisterCredentials } from '../types';

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
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

class AuthService {
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
    await delay(500); // Simulate network delay

    const users = this.getUsersDB();
    console.log('Login attempt for:', credentials.email);
    console.log('Registered users:', users.map(u => ({ email: u.email, id: u.id })));
    
    const userRecord = users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());

    if (!userRecord) {
      console.log('User not found');
      throw new Error('Invalid email or password. If you just registered, try refreshing the page.');
    }
    
    if (userRecord.password !== credentials.password) {
      console.log('Password mismatch');
      throw new Error('Invalid email or password');
    }

    // Update last login
    userRecord.lastLogin = new Date().toISOString();
    this.saveUsersDB(users);

    const token = this.generateToken(userRecord.id);
    const user = this.sanitizeUser(userRecord);

    // Store in localStorage
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);

    return { user, token };
  }

  async register(credentials: RegisterCredentials): Promise<{ user: User; token: string }> {
    await delay(500); // Simulate network delay

    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const users = this.getUsersDB();
    
    // Check if user already exists
    if (users.some(u => u.email.toLowerCase() === credentials.email.toLowerCase())) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const newUserRecord: UserRecord = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: credentials.email,
      password: credentials.password, // In production, hash this!
      name: credentials.name,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    users.push(newUserRecord);
    this.saveUsersDB(users);

    const token = this.generateToken(newUserRecord.id);
    const user = this.sanitizeUser(newUserRecord);

    // Store in localStorage
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);

    return { user, token };
  }

  async logout(): Promise<void> {
    await delay(200);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  getCurrentUser(): User | null {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  async validateToken(token: string): Promise<boolean> {
    await delay(200);
    // In production, validate with server
    return token.startsWith('token_');
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
    await delay(300);

    const users = this.getUsersDB();
    const lowerQuery = query.toLowerCase();

    return users
      .filter(u => 
        u.email.toLowerCase().includes(lowerQuery) || 
        u.name.toLowerCase().includes(lowerQuery)
      )
      .map(u => this.sanitizeUser(u))
      .slice(0, 10); // Limit to 10 results
  }
}

export const authService = new AuthService();
