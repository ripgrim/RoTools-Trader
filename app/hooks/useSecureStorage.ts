import { useState, useEffect } from 'react';
import { createHash } from 'crypto';

// Constants for encryption
const CHUNK_SIZE = 4; // Number of chunks to split the token into
const SALT = 'rotools-trader-v1'; // Salt for additional security

interface SecureStorageOptions {
  key: string;
  expirationDays?: number;
}

export function useSecureStorage({ key, expirationDays = 25 }: SecureStorageOptions) {
  const [value, setValue] = useState<string | null>(null);

  // Initialize value from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const decrypted = decryptValue(stored);
        setValue(decrypted);
      } catch (error) {
        console.error('Failed to decrypt stored value:', error);
        localStorage.removeItem(key);
      }
    }
  }, [key]);

  // Encryption functions
  const encryptValue = (value: string): string => {
    // Split the value into chunks
    const chunkSize = Math.ceil(value.length / CHUNK_SIZE);
    const chunks = Array.from({ length: CHUNK_SIZE }, (_, i) => {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, value.length);
      return value.slice(start, end);
    });

    // Base64 encode each chunk
    const encodedChunks = chunks.map(chunk => 
      Buffer.from(chunk).toString('base64')
    );

    // Randomize chunk order
    const shuffledChunks = [...encodedChunks].sort(() => Math.random() - 0.5);

    // Combine chunks with a delimiter
    const combined = shuffledChunks.join('|');

    // Add salt and create hash
    const salted = combined + SALT;
    const hash = createHash('sha256').update(salted).digest('hex');

    // Store both the combined chunks and the hash
    return `${combined}:${hash}`;
  };

  const decryptValue = (encrypted: string): string => {
    const [combined, storedHash] = encrypted.split(':');
    
    // Verify hash
    const salted = combined + SALT;
    const computedHash = createHash('sha256').update(salted).digest('hex');
    
    if (computedHash !== storedHash) {
      throw new Error('Invalid hash');
    }

    // Split chunks and decode
    const chunks = combined.split('|');
    const decodedChunks = chunks.map(chunk => 
      Buffer.from(chunk, 'base64').toString('utf-8')
    );

    // Reconstruct original value
    return decodedChunks.join('');
  };

  // Storage functions
  const setSecureValue = (newValue: string) => {
    try {
      const encrypted = encryptValue(newValue);
      localStorage.setItem(key, encrypted);
      setValue(newValue);

      // Set expiration if specified
      if (expirationDays) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + expirationDays);
        localStorage.setItem(`${key}_expiration`, expirationDate.toISOString());
      }
    } catch (error) {
      console.error('Failed to encrypt value:', error);
      throw error;
    }
  };

  const getSecureValue = (): string | null => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      // Check expiration
      if (expirationDays) {
        const expiration = localStorage.getItem(`${key}_expiration`);
        if (expiration) {
          const expirationDate = new Date(expiration);
          if (expirationDate < new Date()) {
            localStorage.removeItem(key);
            localStorage.removeItem(`${key}_expiration`);
            return null;
          }
        }
      }

      return decryptValue(stored);
    } catch (error) {
      console.error('Failed to decrypt value:', error);
      return null;
    }
  };

  const removeSecureValue = () => {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_expiration`);
    setValue(null);
  };

  return {
    value,
    setSecureValue,
    getSecureValue,
    removeSecureValue,
  };
} 