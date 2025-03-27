import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

interface UseScreenshotOptions {
  scale?: number;
  backgroundColor?: string;
}

interface UseScreenshotReturn {
  ref: React.RefObject<HTMLDivElement>;
  isCapturing: boolean;
  captureError: string | null;
  capture: () => Promise<string>;
}

export function useScreenshot(options: UseScreenshotOptions = {}): UseScreenshotReturn {
  const ref = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const capture = async () => {
    if (!ref.current) {
      throw new Error('No element to capture');
    }

    setIsCapturing(true);
    setCaptureError(null);

    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: options.backgroundColor || '#18181B',
        scale: options.scale || 2,
      });

      const dataUrl = canvas.toDataURL('image/png');
      setIsCapturing(false);
      return dataUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture screenshot';
      setCaptureError(errorMessage);
      setIsCapturing(false);
      throw error;
    }
  };

  return {
    ref,
    isCapturing,
    captureError,
    capture
  };
} 