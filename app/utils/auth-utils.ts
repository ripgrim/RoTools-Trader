/**
 * Extracts the .ROBLOSECURITY cookie value from different formats
 * Works with direct value or cookie string format (.ROBLOSECURITY=value)
 */
export function extractCookieValue(cookieString: string): string {
  const cleanValue = cookieString.trim().replace(/^['"]|['"]$/g, '');
  
  // If it's a cookie string with .ROBLOSECURITY=value format, extract the value
  if (cleanValue.includes(".ROBLOSECURITY=")) {
    const match = cleanValue.match(/\.ROBLOSECURITY=([^;]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Otherwise return the original value (assuming it's already the cookie value)
  return cleanValue;
}

/**
 * Validates a Roblox cookie format
 * Checks for the warning prefix and minimum length
 */
export function validateRobloxCookie(value: string): boolean {
  // Check if it's a direct .ROBLOSECURITY cookie value
  const warningPrefix = "_|WARNING:-DO-NOT-SHARE-THIS";
  
  // Clean up the input in case it has extra whitespace or quotes
  const cleanValue = value.trim().replace(/^['"]|['"]$/g, '');
  
  if (cleanValue.includes(warningPrefix) && cleanValue.length > 100) {
    return true;
  }
  
  // If it doesn't match the direct format, check if it might be a cookie string
  // from the dev tools (which would have .ROBLOSECURITY=value format)
  if (cleanValue.includes(".ROBLOSECURITY=") && cleanValue.includes(warningPrefix)) {
    return true;
  }
  
  return false;
}

/**
 * Attempts to log in with a Roblox cookie
 * Handles validation, extraction, and error display
 */
export async function attemptRobloxLogin(
  cookie: string,
  loginFn: (cookie: string) => Promise<boolean>,
  onSuccess?: () => void,
  onError?: (message: string) => void
): Promise<boolean> {
  if (!cookie.trim()) {
    return false;
  }

  // Validate cookie format first
  if (!validateRobloxCookie(cookie)) {
    const errorMsg = "The cookie format appears to be invalid. Please make sure you're copying the entire .ROBLOSECURITY cookie value.";
    console.error(errorMsg);
    if (onError) onError(errorMsg);
    return false;
  }

  try {
    console.log("Attempting direct login with extracted cookie...");
    
    // Extract the actual cookie value if needed
    const cookieValue = extractCookieValue(cookie);
    
    // Attempt the login
    const success = await loginFn(cookieValue);
    console.log("Login result:", success);
    
    if (success) {
      if (onSuccess) onSuccess();
      return true;
    } else {
      const errorMsg = "Authentication failed. Please check your cookie and try again.";
      console.error(errorMsg);
      if (onError) onError(errorMsg);
      return false;
    }
  } catch (error) {
    console.error("Login error:", error);
    const errorMsg = error instanceof Error ? error.message : "Authentication failed";
    if (onError) onError(errorMsg);
    return false;
  }
} 