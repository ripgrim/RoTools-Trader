import { useState, useEffect, useCallback, useRef } from 'react';
import { useSecureStorage } from './use-secure-storage';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';

// Key for storing the Roblox cookie in secure storage
const ROBLOX_COOKIE_KEY = 'roblox-cookie';
// Name of the cookie used for session tracking (used by middleware)
const SESSION_COOKIE_NAME = 'roblox-auth-session';
// Cookie check interval in milliseconds (20 minutes instead of 10)
const AUTH_CHECK_INTERVAL = 20 * 60 * 1000;
// Initial check delay (5 seconds)
const INITIAL_CHECK_DELAY = 5000;

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
  
  // Add a ref to track initialization status
  const hasInitialized = useRef(false);

  // Set or remove the session cookie
  const updateSessionCookie = useCallback((isAuthenticated: boolean) => {
    try {
      if (isAuthenticated) {
        // Set a session cookie with 30-day expiry
        // This cookie doesn't contain the actual Roblox cookie, just indicates auth status
        Cookies.set(SESSION_COOKIE_NAME, 'authenticated', { 
          expires: 30, 
          sameSite: 'Strict',
          secure: process.env.NODE_ENV === 'production',
          path: '/' // Ensure cookie is available across all paths
        });
        console.log("Session cookie set");
        
        // Double-check to make sure cookie was set
        const cookieExists = Cookies.get(SESSION_COOKIE_NAME);
        if (!cookieExists) {
          console.warn("Failed to set session cookie - will retry");
          // Try again with a slight delay
          setTimeout(() => {
            Cookies.set(SESSION_COOKIE_NAME, 'authenticated', { 
              expires: 30, 
              sameSite: 'Strict',
              secure: process.env.NODE_ENV === 'production',
              path: '/'
            });
            console.log("Session cookie set (retry)");
          }, 100);
        }
      } else {
        // Remove the session cookie
        Cookies.remove(SESSION_COOKIE_NAME, { path: '/' });
        console.log("Session cookie removed");
        
        // Double-check to make sure cookie was removed
        const cookieExists = Cookies.get(SESSION_COOKIE_NAME);
        if (cookieExists) {
          console.warn("Failed to remove session cookie - will retry");
          // Try again with a slight delay
          setTimeout(() => {
            Cookies.remove(SESSION_COOKIE_NAME, { path: '/' });
            console.log("Session cookie removed (retry)");
          }, 100);
        }
      }
    } catch (error) {
      console.error("Error updating session cookie:", error);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    // Use our ref to ensure we only initialize once
    if (hasInitialized.current) {
      return;
    }
    
    let isMounted = true;
    hasInitialized.current = true;
    
    const initAuth = () => {
      try {
        console.log("Initializing auth state...");
        // Get cookie from secure storage
        const storedCookie = getSecureValue(ROBLOX_COOKIE_KEY);
        console.log("Retrieved cookie from storage:", { cookieExists: !!storedCookie });
        
        // Determine authentication status
        const isAuth = !!storedCookie;
        console.log("Auth state initialized:", { isAuthenticated: isAuth, cookiePresent: !!storedCookie });
        
        // Update the session cookie (important to do before setting state)
        updateSessionCookie(isAuth);
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Set auth state in a single update to prevent inconsistency
          setAuthState({
            isAuthenticated: isAuth,
            isLoading: false,
            cookie: storedCookie,
          });
          
          // Log authentication success for debugging
          if (isAuth) {
            console.log("Authentication successful from stored cookie");
          }
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

    // Initialize auth state
    initAuth();
    
    // Cleanup function
    return () => {
      console.log("Auth initialization cleanup - component unmounting");
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
      setSecureValue(ROBLOX_COOKIE_KEY, refreshedCookie);
      
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
      setSecureValue(ROBLOX_COOKIE_KEY, '');
      
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

  // Function to periodically check if the auth is still valid
  useEffect(() => {
    // Don't try to validate while still loading
    if (authState.isLoading) {
      return;
    }
    
    let isSubscribed = true;
    
    console.log("Setting up auth check with status:", { 
      isAuthenticated: authState.isAuthenticated, 
      hasValidCookie: !!authState.cookie,
      isLoading: authState.isLoading
    });
    
    // Only run timers once authentication is established and not loading
    if (authState.isAuthenticated && authState.cookie) {
      // Add a unique ID for this effect instance to debug
      const instanceId = Math.random().toString(36).substring(2, 10);
      console.log(`Auth check instance ${instanceId} initialized`);
      
      // Store the current cookie value to avoid capturing changes via closure
      const cookieToCheck = authState.cookie;
      
      // Initial check after a delay
      const initialCheckId = setTimeout(() => {
        if (!isSubscribed) {
          console.log(`Auth check instance ${instanceId} initial check canceled`);
          return;
        }
        
        // Only run check if we still have auth context
        try {
          console.log(`Auth check instance ${instanceId} running initial check`);
          validateAndRefreshAuth(cookieToCheck);
        } catch (err) {
          console.error(`Auth check instance ${instanceId} initial check error:`, err);
        }
      }, INITIAL_CHECK_DELAY);
      
      // Set up periodic check
      const intervalId = setInterval(() => {
        if (!isSubscribed) {
          console.log(`Auth check instance ${instanceId} periodic check canceled`);
          return;
        }
        
        // Only run check if we still have auth context
        try {
          console.log(`Auth check instance ${instanceId} running periodic check`);
          validateAndRefreshAuth(cookieToCheck);
        } catch (err) {
          console.error(`Auth check instance ${instanceId} periodic check error:`, err);
        }
      }, AUTH_CHECK_INTERVAL);
      
      console.log(`Auth check instance ${instanceId} timers set up:`, { 
        initialDelay: INITIAL_CHECK_DELAY, 
        interval: AUTH_CHECK_INTERVAL,
        cookieLength: cookieToCheck.length
      });
      
      return () => {
        console.log(`Auth check instance ${instanceId} cleaning up (auth valid: ${authState.isAuthenticated})`);
        isSubscribed = false;
        clearTimeout(initialCheckId);
        clearInterval(intervalId);
      };
    }
    
    return () => {
      console.log("Auth check canceled (not authenticated or loading)");
      isSubscribed = false;
    };
  }, [authState.isAuthenticated, authState.isLoading]);

  // Helper to validate and refresh auth if needed
  const validateAndRefreshAuth = async (currentCookie: string) => {
    // Create a reference to check if the operation was canceled
    let isCanceled = false;
    
    // Set up a timeout to abort long-running operations on navigation
    const timeoutId = setTimeout(() => {
      isCanceled = true;
      console.log("Auth validation timed out after 10 seconds");
    }, 10000);
    
    try {
      console.log("Validating auth status...");
      
      // Try to refresh the cookie which also validates it
      let isValid = false;
      let refreshedCookie: string | null = null;
      
      try {
        refreshedCookie = await refreshCookie(currentCookie);
        isValid = !!refreshedCookie;
      } catch (refreshError) {
        console.error("Error refreshing cookie during validation:", refreshError);
        isValid = false;
      }
      
      // Stop if the operation was canceled (e.g., during navigation)
      if (isCanceled) {
        console.log("Auth validation canceled, aborting");
        return;
      }
      
      if (isValid && refreshedCookie) {
        // Compare important parts of the cookie to avoid unnecessary updates
        const refreshedPrefix = refreshedCookie.substring(0, 50);
        const currentPrefix = currentCookie.substring(0, 50);
        
        if (refreshedPrefix !== currentPrefix) {
          console.log("Auth still valid - updating with new refreshed cookie");
          
          // Store the refreshed cookie
          setSecureValue(ROBLOX_COOKIE_KEY, refreshedCookie);
          
          // Update session cookie
          try {
            Cookies.set(SESSION_COOKIE_NAME, 'authenticated', { 
              expires: 30, 
              sameSite: 'Strict',
              secure: process.env.NODE_ENV === 'production'
            });
            console.log("Session cookie refreshed");
          } catch (cookieError) {
            console.error("Error updating session cookie:", cookieError);
          }
          
          // Stop if the operation was canceled (e.g., during navigation)
          if (isCanceled) {
            console.log("Auth state update canceled, aborting");
            return;
          }
          
          // Update auth state in a single atomic operation
          setAuthState(prevState => ({
            ...prevState,
            isAuthenticated: true,  // Ensure we stay authenticated
            cookie: refreshedCookie,
          }));
        } else {
          console.log("Cookie unchanged after refresh, skipping update");
        }
      } else {
        console.log("Auth validation failed - logging out");
        
        // Clear cookie storage
        setSecureValue(ROBLOX_COOKIE_KEY, '');
        
        // Clear session cookie
        try {
          Cookies.remove(SESSION_COOKIE_NAME);
          console.log("Session cookie removed due to validation failure");
        } catch (cookieError) {
          console.error("Error removing session cookie:", cookieError);
        }
        
        // Stop if the operation was canceled (e.g., during navigation)
        if (isCanceled) {
          console.log("Auth logout canceled, aborting");
          return;
        }
        
        // Update state in a single atomic operation
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          cookie: null,
        });
        
        // Show notification if needed
        toast({
          title: 'Session expired',
          description: 'Your authentication has expired. Please log in again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    } finally {
      // Always clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
    }
  };

  return {
    ...authState,
    login,
    logout,
    refreshCookie,
  };
} 