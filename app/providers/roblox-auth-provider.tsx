"use client"

import { createContext, useContext, ReactNode, useMemo, useRef, useState, useEffect } from 'react';
import { useRobloxAuth } from '@/app/hooks/use-roblox-auth';
import { RobloxAuthDialog } from '@/components/auth/roblox-auth-dialog';

// Define the shape of the auth context
interface RobloxAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  cookie: string | null;
  login: (cookie: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshCookie: (cookieToRefresh: string) => Promise<string | null>;
  showAuthDialog: () => void;
  hideAuthDialog: () => void;
}

// Create the context with a default value
const RobloxAuthContext = createContext<RobloxAuthContextType | undefined>(undefined);

// Provider component that wraps parts of the app that need auth
export function RobloxAuthProvider({ children }: { children: ReactNode }) {
  const auth = useRobloxAuth();
  const authRef = useRef(auth);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  
  // Prevent unnecessary re-renders by only updating the ref when important values change
  if (auth.isAuthenticated !== authRef.current.isAuthenticated || 
      auth.isLoading !== authRef.current.isLoading || 
      auth.cookie !== authRef.current.cookie) {
    authRef.current = auth;
  }

  // Show auth dialog when not authenticated and not loading
  useEffect(() => {
    // Add debug logging
    console.log("Auth state in provider updated:", { 
      isAuthenticated: auth.isAuthenticated, 
      isLoading: auth.isLoading,
      hasDialog: isAuthDialogOpen
    });
    
    // Wait until auth state is fully loaded
    if (!auth.isLoading) {
      // If not authenticated, show dialog without delay
      if (!auth.isAuthenticated) {
        console.log("User not authenticated, showing auth dialog");
        setIsAuthDialogOpen(true);
      } else {
        // Hide dialog if user is authenticated
        console.log("User authenticated, hiding auth dialog");
        setIsAuthDialogOpen(false);
      }
    }
  }, [auth.isAuthenticated, auth.isLoading]);
  
  // Functions to control the auth dialog
  const showAuthDialog = () => setIsAuthDialogOpen(true);
  const hideAuthDialog = () => setIsAuthDialogOpen(false);
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    ...authRef.current,
    showAuthDialog,
    hideAuthDialog
  }), [
    authRef.current.isAuthenticated,
    authRef.current.isLoading,
    authRef.current.cookie,
  ]);
  
  return (
    <RobloxAuthContext.Provider value={value}>
      {children}
      <RobloxAuthDialog 
        open={isAuthDialogOpen} 
        onOpenChange={setIsAuthDialogOpen} 
      />
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