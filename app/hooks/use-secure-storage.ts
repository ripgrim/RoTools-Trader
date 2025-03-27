import { useState, useEffect } from 'react';

export function useSecureStorage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getSecureValue = async (key: string): Promise<string | null> => {
    if (!mounted) return null;
    try {
      const value = localStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('Error reading from secure storage:', error);
      return null;
    }
  };

  const setSecureValue = async (key: string, value: string): Promise<void> => {
    if (!mounted) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to secure storage:', error);
    }
  };

  return {
    getSecureValue,
    setSecureValue,
  };
} 