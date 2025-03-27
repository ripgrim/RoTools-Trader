// This file is kept for backward compatibility
// The app now uses the use-react-screenshot library directly

import { ScreenshotTrade } from '@/components/trades/trade-screenshot';

// Export the type for backward compatibility with existing imports
export interface UseScreenshotOptions {
  onComplete: (imageUrl: string) => void;
  onError?: (error: string) => void;
}

export interface UseScreenshotReturn {
  generate: (trade: ScreenshotTrade) => Promise<void>;
  isGenerating: boolean;
  progress: number;
  error: string | null;
}

// No-op implementation that returns an empty object
export function useScreenshot(): UseScreenshotReturn {
  return {
    generate: async () => {},
    isGenerating: false,
    progress: 0,
    error: null
  };
} 