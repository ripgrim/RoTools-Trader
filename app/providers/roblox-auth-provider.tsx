"use client"

import { createContext, useContext, ReactNode } from 'react';
import { useRobloxAuth } from '@/app/hooks/use-roblox-auth';

// Define the shape of the auth context
interface RobloxAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  cookie: string | null;
  login: (cookie: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshCookie: (cookieToRefresh: string) => Promise<string | null>;
}

// Create the context with a default value
const RobloxAuthContext = createContext<RobloxAuthContextType | undefined>(undefined);

// Provider component that wraps parts of the app that need auth
export function RobloxAuthProvider({ children }: { children: ReactNode }) {
  const auth = useRobloxAuth();
  
  return (
    <RobloxAuthContext.Provider value={auth}>
      {children}
    </RobloxAuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useRobloxAuthContext() {
  const context = useContext(RobloxAuthContext);
  
  if (context === undefined) {
    throw new Error('useRobloxAuthContext must be used within a RobloxAuthProvider');
  }
  
  return context;
} 