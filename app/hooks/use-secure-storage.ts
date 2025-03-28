import Cookies from 'js-cookie';

// Expiration in days for secure cookies
const COOKIE_EXPIRATION_DAYS = 25;

/**
 * Hook for securely storing and retrieving sensitive information using cookies
 * Provides a synchronous API for easy integration
 */
export function useSecureStorage() {
  /**
   * Gets a value from secure cookie storage
   * @param key The key to retrieve
   * @returns The value or null if not found
   */
  const getSecureValue = (key: string): string | null => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return null;
      }
      
      const value = Cookies.get(key);
      return value || null;
    } catch (error) {
      console.error('Error reading from secure cookie:', error);
      return null;
    }
  };

  /**
   * Sets a value in secure cookie storage
   * @param key The key to store under
   * @param value The value to store (empty string removes the cookie)
   */
  const setSecureValue = (key: string, value: string): void => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return;
      }
      
      if (value) {
        // Set the cookie with configured expiration and security options
        Cookies.set(key, value, { 
          expires: COOKIE_EXPIRATION_DAYS,
          sameSite: 'Strict',
          secure: process.env.NODE_ENV === 'production'
        });
      } else {
        // Remove the cookie if value is empty
        Cookies.remove(key);
      }
    } catch (error) {
      console.error('Error writing to secure cookie:', error);
    }
  };

  /**
   * Removes a value from secure cookie storage
   * @param key The key to remove
   */
  const removeSecureValue = (key: string): void => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return;
      }
      
      Cookies.remove(key);
    } catch (error) {
      console.error('Error removing secure cookie:', error);
    }
  };

  return {
    getSecureValue,
    setSecureValue,
    removeSecureValue,
  };
} 