"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { SIMULATE_NO_TOKEN } from '@/lib/constants';

interface TokenContextType {
  hasToken: boolean;
  isLoading: boolean;
  clearToken: () => void;
}

const TokenContext = createContext<TokenContextType>({
  hasToken: false,
  isLoading: true,
  clearToken: () => {},
});

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      if (SIMULATE_NO_TOKEN) {
        setHasToken(false);
        setIsLoading(false);
        return;
      }

      try {
        // In a real app, you would check for the token in cookies/localStorage
        // and validate it with your backend
        const token = localStorage.getItem('rolimons-token');
        setHasToken(!!token);
      } catch (error) {
        console.error('Error checking token:', error);
        setHasToken(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  const clearToken = () => {
    localStorage.removeItem('rolimons-token');
    setHasToken(false);
  };

  return (
    <TokenContext.Provider value={{ hasToken, isLoading, clearToken }}>
      {children}
    </TokenContext.Provider>
  );
}

export function useToken() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
}; 