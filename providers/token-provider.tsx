"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { SIMULATE_NO_TOKEN } from '@/lib/constants';
import { verifyAuthTokenExtended } from '@/api/user';

interface TokenContextType {
  isLoading: boolean;
  token?: string,
  clearToken: () => void;
  user?: {
    avatar: string,
    id: number,
  },
}

const TokenContext = createContext<TokenContextType>({
  isLoading: true,
  clearToken: () => {},
});

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{avatar: string, id: number}>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      if (SIMULATE_NO_TOKEN) {
        setUser(undefined)
        setIsLoading(false);
        return;
      }

      try {
        // In a real app, you would check for the token in cookies/localStorage
        // and validate it with your backend
        const token = localStorage.getItem('rolimons-token');
        if (token) {
          try {
            const user = await verifyAuthTokenExtended(token);
          setUser({avatar: user.user.avatarUrl, id: user.user.id})
          } catch (e) {
            if (String(e).toLowerCase().includes("unauthorized")) {
              localStorage.removeItem('rolimons-token')
              setUser(undefined)
            }
          }
        }
      } catch (error) {
        console.error('Error checking token:', error);
        setUser(undefined)
      } finally {
        setIsLoading(false)
      }
    };

    checkToken();
  }, []);

  const clearToken = () => {
    localStorage.removeItem('rolimons-token');
    setUser(undefined)
  };

  return (
    <TokenContext.Provider value={{ user, isLoading, clearToken, token: typeof window !== "undefined" && "localStorage" in window ? (localStorage.getItem("rolimons-token") || undefined) : undefined }}>
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