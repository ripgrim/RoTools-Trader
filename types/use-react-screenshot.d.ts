declare module 'use-react-screenshot' {
  export interface UseScreenshotOptions {
    type?: string;
    quality?: number;
  }

  /**
   * Hook for creating screenshots of DOM elements
   * @param options Configuration options
   * @returns [imageUrl, takeScreenshot] - Current screenshot URL and function to take a new screenshot
   */
  export function useScreenshot(
    options?: UseScreenshotOptions
  ): [string | null, (node: HTMLElement) => Promise<string>];
} 