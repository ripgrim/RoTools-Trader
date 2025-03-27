export const TOKEN_EXPIRY_DAYS = 25;

export interface TokenStatus {
  isValid: boolean;
  isExpired: boolean;
  daysUntilExpiry: number;
}

// This function should only be called on the client side
export function getTokenStatus(): TokenStatus {
  if (typeof window === 'undefined') {
    return {
      isValid: false,
      isExpired: true,
      daysUntilExpiry: 0,
    };
  }

  const token = localStorage.getItem('robloxToken');
  const expirationDate = localStorage.getItem('robloxTokenExpiration');

  if (!token || !expirationDate) {
    return {
      isValid: false,
      isExpired: true,
      daysUntilExpiry: 0,
    };
  }

  const expiryDate = new Date(expirationDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    isValid: true,
    isExpired: daysUntilExpiry <= 0,
    daysUntilExpiry: Math.max(0, daysUntilExpiry),
  };
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('robloxToken');
  localStorage.removeItem('robloxTokenExpiration');
} 