import { useState, useEffect, useCallback } from 'react';
import { useSecureStorage } from './use-secure-storage';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';

// Key for storing the Roblox cookie in secure storage
const ROBLOX_COOKIE_KEY = 'roblox-cookie';
// Name of the cookie used for session tracking (used by middleware)
const SESSION_COOKIE_NAME = 'roblox-auth-session';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  cookie: string | null;
}

export function useRobloxAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    cookie: null,
  });
  const { getSecureValue, setSecureValue } = useSecureStorage();
  const { toast } = useToast();

  // Set or remove the session cookie
  const updateSessionCookie = useCallback((isAuthenticated: boolean) => {
    try {
      if (isAuthenticated) {
        // Set a session cookie with 30-day expiry
        // This cookie doesn't contain the actual Roblox cookie, just indicates auth status
        Cookies.set(SESSION_COOKIE_NAME, 'authenticated', { 
          expires: 30, 
          sameSite: 'Strict',
          secure: process.env.NODE_ENV === 'production'
        });
        console.log("Session cookie set");
      } else {
        // Remove the session cookie
        Cookies.remove(SESSION_COOKIE_NAME);
        console.log("Session cookie removed");
      }
    } catch (error) {
      console.error("Error updating session cookie:", error);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        console.log("Initializing auth state...");
        const storedCookie = await getSecureValue(ROBLOX_COOKIE_KEY);
        const isAuth = !!storedCookie;
        
        console.log("Auth state initialized:", { isAuthenticated: isAuth, cookiePresent: !!storedCookie });
        
        // Update the session cookie
        updateSessionCookie(isAuth);
        
        if (isMounted) {
          setAuthState({
            isAuthenticated: isAuth,
            isLoading: false,
            cookie: storedCookie,
          });
        }
      } catch (error) {
        console.error('Failed to initialize auth state:', error);
        
        if (isMounted) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            cookie: null,
          });
        }
        
        // Ensure cookie is removed if auth fails
        updateSessionCookie(false);
      }
    };

    initAuth();
    
    return () => {
      isMounted = false;
    };
  }, [getSecureValue, updateSessionCookie]);

  // Function to validate and refresh Roblox cookie
  const refreshCookie = useCallback(async (cookieToRefresh: string): Promise<string | null> => {
    try {
      console.log("Starting cookie refresh process");
      const response = await fetch('/api/roblox/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roblosecurityCookie: cookieToRefresh,
        }),
      });

      const data = await response.json();
      console.log("Cookie refresh response received");

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh cookie');
      }

      return data.refreshedCookie;
    } catch (error) {
      console.error('Cookie refresh failed:', error);
      return null;
    }
  }, []);

  // Login function
  const login = useCallback(async (cookie: string) => {
    try {
      console.log("Login process started");
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Attempt to refresh the cookie to validate it
      console.log("Validating cookie...");
      const refreshedCookie = await refreshCookie(cookie);
      
      if (!refreshedCookie) {
        console.log("Cookie validation failed");
        throw new Error('Invalid Roblox cookie');
      }
      
      console.log("Cookie validated, storing...");
      // Store the refreshed cookie
      await setSecureValue(ROBLOX_COOKIE_KEY, refreshedCookie);
      
      // Update session cookie
      console.log("Updating session cookie...");
      updateSessionCookie(true);
      
      console.log("Updating auth state...");
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        cookie: refreshedCookie,
      });
      
      console.log("Showing success toast...");
      toast({
        title: 'Authentication successful',
        description: 'You are now logged in to Roblox',
        variant: 'default',
      });
      
      console.log("Login process completed successfully");
      return true;
    } catch (error) {
      console.error("Login process error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      
      toast({
        title: 'Authentication failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        cookie: null,
      });
      
      // Ensure session cookie is removed
      updateSessionCookie(false);
      
      return false;
    }
  }, [refreshCookie, setSecureValue, toast, updateSessionCookie]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      console.log("Logout process started");
      await setSecureValue(ROBLOX_COOKIE_KEY, '');
      
      // Remove session cookie
      console.log("Removing session cookie...");
      updateSessionCookie(false);
      
      console.log("Updating auth state...");
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        cookie: null,
      });
      
      console.log("Showing logout toast...");
      toast({
        title: 'Logged out',
        description: 'You have been logged out from Roblox',
        variant: 'default',
      });
      
      console.log("Logout process completed");
    } catch (error) {
      console.error('Logout failed:', error);
      
      toast({
        title: 'Logout failed',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  }, [setSecureValue, toast, updateSessionCookie]);

  return {
    ...authState,
    login,
    logout,
    refreshCookie,
  };
} 