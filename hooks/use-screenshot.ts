import { useState } from 'react';
import { ScreenshotTrade } from '@/components/trades/trade-screenshot';
import html2canvas from 'html2canvas';

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

export function useScreenshot({ onComplete, onError }: UseScreenshotOptions): UseScreenshotReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generate = async (trade: ScreenshotTrade): Promise<void> => {
    try {
      setIsGenerating(true);
      setProgress(10);
      setError(null);

      // Wait for the DOM to be ready for capture
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgress(30);

      // Find the element with the TradeScreenshot component
      const screenshotElement = document.querySelector('[data-screenshot-target="true"]');
      
      if (!screenshotElement) {
        throw new Error('Could not find screenshot element');
      }

      setProgress(50);

      // Use html2canvas to capture the element
      const canvas = await html2canvas(screenshotElement as HTMLElement, {
        backgroundColor: '#09090B', // zinc-950
        scale: 2, // Higher quality
        logging: false,
        useCORS: true, // Allow cross-origin images
      });

      setProgress(80);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');
      
      setProgress(100);
      setIsGenerating(false);
      onComplete(dataUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsGenerating(false);
      onError?.(errorMessage);
    }
  };

  return {
    generate,
    isGenerating,
    progress,
    error,
  };
} 