"use client"

import { createContext, useContext, ReactNode, useMemo, useRef } from 'react';
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
  const authRef = useRef(auth);
  
  // Prevent unnecessary re-renders by only updating the ref when important values change
  if (auth.isAuthenticated !== authRef.current.isAuthenticated || 
      auth.isLoading !== authRef.current.isLoading || 
      auth.cookie !== authRef.current.cookie) {
    authRef.current = auth;
  }
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => authRef.current, [
    authRef.current.isAuthenticated,
    authRef.current.isLoading,
    authRef.current.cookie,
  ]);
  
  return (
    <RobloxAuthContext.Provider value={value}>
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