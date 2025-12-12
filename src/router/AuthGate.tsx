import { ReactNode } from 'react';
import Login from '../components/Login';
import { useAuth } from '../contexts/AuthContext';
import { LoadingOverlay } from '../components/ui';

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, login, register } = useAuth();

  if (loading) {
    return <LoadingOverlay message="Loading..." />;
  }

  if (!isAuthenticated) {
    return (
      <Login
        onLogin={async (email, password) => {
          await login({ email, password });
        }}
        onRegister={async (name, email, password, confirmPassword) => {
          await register({ name, email, password, confirmPassword });
        }}
      />
    );
  }

  return <>{children}</>;
}
