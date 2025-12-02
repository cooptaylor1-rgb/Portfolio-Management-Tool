import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterCredentials } from '../types';
import { authService } from '../services/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null
  });

  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = authService.getCurrentUser();
        const token = authService.getToken();

        if (user && token) {
          // Validate token
          const isValid = await authService.validateToken(token);
          if (isValid) {
            setAuthState({
              isAuthenticated: true,
              user,
              token,
              loading: false,
              error: null
            });
          } else {
            // Token is invalid, clear auth
            await authService.logout();
            setAuthState({
              isAuthenticated: false,
              user: null,
              token: null,
              loading: false,
              error: null
            });
          }
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: null
          });
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
          error: error.message
        });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { user, token } = await authService.login(credentials);
      
      setAuthState({
        isAuthenticated: true,
        user,
        token,
        loading: false,
        error: null
      });
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { user, token } = await authService.register(credentials);
      
      setAuthState({
        isAuthenticated: true,
        user,
        token,
        loading: false,
        error: null
      });
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      await authService.logout();
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if logout fails, clear the local state
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: error.message
      });
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      if (!authState.user) {
        throw new Error('No user logged in');
      }

      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const updatedUser = await authService.updateProfile(authState.user.id, updates);
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        loading: false,
        error: null
      }));
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      throw error;
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
