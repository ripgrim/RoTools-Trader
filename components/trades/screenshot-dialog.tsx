"use client"

import { Trade, TradeItem } from '@/app/types/trade';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { TradeScreenshot } from './trade-screenshot';
import type { ScreenshotTrade } from './trade-screenshot';
import { useRef, useState, useEffect } from 'react';
import { cn, transformTradeForScreenshot } from "@/lib/utils";
import html2canvas from 'html2canvas';

interface ScreenshotDialogProps {
  trade: ScreenshotTrade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScreenshotDialog({ trade, open, onOpenChange }: ScreenshotDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Create a container ref as a fallback
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to start generation when dialog opens
  useEffect(() => {
    if (open && !imageUrl && !isGenerating && !error) {
      // Wait for the next render cycle - longer delay to ensure DOM is ready
      setTimeout(() => {
        generateScreenshot();
      }, 500);
    }
  }, [open, imageUrl, isGenerating, error]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setImageUrl(null);
      setCopySuccess(false);
      setProgress(0);
      setError(null);
    }
  }, [open]);

  // Function to preload all images in the trade
  const preloadImages = async () => {
    // Create an array of all image URLs in the trade
    const imageUrls: string[] = [
      trade.sender.avatar,
      trade.receiver.avatar,
      ...trade.sending.map(item => item.thumbnail),
      ...trade.receiving.map(item => item.thumbnail),
      '/icons/rolimons_logo_icon_blue.png'
    ];

    // Create a promise for each image load
    const imagePromises = imageUrls.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Failed to preload image: ${url}`);
          resolve(); // Resolve anyway to continue with the process
        };
        img.src = url;
      });
    });

    // Wait for all images to load
    await Promise.all(imagePromises);
  };

  // Function to take the screenshot
  const generateScreenshot = async () => {
    setIsGenerating(true);
    setProgress(10);
    setError(null);
    
    // Set up a timeout to detect if the process hangs
    const timeoutId = setTimeout(() => {
      setError('Screenshot generation timed out. Please try again.');
      setIsGenerating(false);
    }, 15000); // 15 second timeout
    
    try {
      // Preload images first
      setProgress(20);
      await preloadImages();
      setProgress(30);
      
      // Create a container div for the screenshot
      const captureDiv = document.createElement('div');
      captureDiv.style.position = 'fixed';
      captureDiv.style.left = '-9999px';
      captureDiv.style.top = '-9999px';
      captureDiv.style.width = '600px';
      captureDiv.style.backgroundColor = '#09090B';
      captureDiv.style.padding = '20px';
      captureDiv.style.zIndex = '-1';
      captureDiv.style.visibility = 'hidden';
      document.body.appendChild(captureDiv);
      
      setProgress(40);
      
      // Create a new TradeScreenshot directly rather than trying to clone an existing one
      const renderTradeScreenshot = () => {
        // Create the container structure
        captureDiv.innerHTML = `
          <div class="screenshot-container bg-zinc-950 text-zinc-100 p-5 space-y-4 w-[600px]">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-zinc-400 text-sm">Trade #${trade.id}</span>
                <span class="text-zinc-400 text-sm">•</span>
                <span class="text-zinc-400 text-sm">${new Date(trade.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-6">
              <!-- Sender -->
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full overflow-hidden">
                    <img src="${trade.sender.avatar}" alt="${trade.sender.displayName}" class="w-full h-full object-cover" />
                  </div>
                  <span class="text-sm font-medium truncate">${trade.sender.displayName}</span>
                </div>
                <div class="sending-items space-y-2">
                  <!-- Sending items go here -->
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-zinc-400">Total Value:</span>
                  <span>${trade.sendingValue.toLocaleString()}</span>
                </div>
              </div>
              
              <!-- Receiver -->
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full overflow-hidden">
                    <img src="${trade.receiver.avatar}" alt="${trade.receiver.displayName}" class="w-full h-full object-cover" />
                  </div>
                  <span class="text-sm font-medium truncate">${trade.receiver.displayName}</span>
                </div>
                <div class="receiving-items space-y-2">
                  <!-- Receiving items go here -->
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-zinc-400">Total Value:</span>
                  <span>${trade.receivingValue.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center justify-between text-sm pt-3 border-t border-zinc-800">
              <div class="flex items-center gap-2">
                <img src="/icons/rolimons_logo_icon_blue.png" alt="RoTools" width="16" height="16" />
                <span class="font-medium">RoTools Trader</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-zinc-400">Value Diff:</span>
                <span class="${trade.valueDiff > 0 ? 'text-green-400' : 'text-red-400'} value-diff ml-2 shrink-0">
                  ${trade.valueDiff > 0 ? "+" : ""}${trade.valueDiff.toLocaleString()}
                  <span class="text-sm ml-1.5">
                    (${trade.valueDiffPercentage > 0 ? "+" : ""}${trade.valueDiffPercentage}%)
                  </span>
                </span>
              </div>
            </div>
          </div>
        `;
        
        // Add sending items
        const sendingItemsContainer = captureDiv.querySelector('.sending-items');
        if (sendingItemsContainer) {
          trade.sending.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-container flex items-center gap-3 bg-background/90 p-2.5 border border-zinc-800/50 rounded-none';
            itemElement.innerHTML = `
              <div class="relative w-10 h-10 bg-background/90 rounded-none overflow-hidden shrink-0">
                <img src="${item.thumbnail}" alt="${item.name}" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-zinc-100 truncate flex-shrink">${item.name}</span>
                  ${item.serial ? `
                    <div class="serial-container flex items-center gap-0.5 px-1.5 rounded bg-zinc-800/80 text-zinc-300 shrink-0">
                      <span class="text-xs">${item.serial}</span>
                    </div>
                  ` : ''}
                </div>
                <div class="flex items-center gap-3 text-xs text-zinc-300">
                  ${item.rap ? `
                    <div class="flex items-center gap-1 shrink-0">
                      <span>${item.rap.toLocaleString()}</span>
                    </div>
                  ` : ''}
                  ${item.value ? `
                    <div class="flex items-center gap-1 shrink-0">
                      <span>${item.value.toLocaleString()}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
            sendingItemsContainer.appendChild(itemElement);
          });
        }
        
        // Add receiving items
        const receivingItemsContainer = captureDiv.querySelector('.receiving-items');
        if (receivingItemsContainer) {
          trade.receiving.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-container flex items-center gap-3 bg-background/90 p-2.5 border border-zinc-800/50 rounded-none';
            itemElement.innerHTML = `
              <div class="relative w-10 h-10 bg-background/90 rounded-none overflow-hidden shrink-0">
                <img src="${item.thumbnail}" alt="${item.name}" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-zinc-100 truncate flex-shrink">${item.name}</span>
                  ${item.serial ? `
                    <div class="serial-container flex items-center gap-0.5 px-1.5 rounded bg-zinc-800/80 text-zinc-300 shrink-0">
                      <span class="text-xs">${item.serial}</span>
                    </div>
                  ` : ''}
                </div>
                <div class="flex items-center gap-3 text-xs text-zinc-300">
                  ${item.rap ? `
                    <div class="flex items-center gap-1 shrink-0">
                      <span>${item.rap.toLocaleString()}</span>
                    </div>
                  ` : ''}
                  ${item.value ? `
                    <div class="flex items-center gap-1 shrink-0">
                      <span>${item.value.toLocaleString()}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
            receivingItemsContainer.appendChild(itemElement);
          });
        }
      };
      
      // Render the content
      renderTradeScreenshot();
      
      // Apply additional styling
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .item-container {
          margin: 8px 0 !important;
          background-color: rgba(24, 24, 27, 0.9) !important;
        }
        .serial-container {
          padding: 2px 6px !important;
          display: inline-flex !important;
          align-items: center !important;
          background-color: rgba(39, 39, 42, 0.8) !important;
        }
        .value-diff {
          margin-left: 8px !important;
        }
        .screenshot-container {
          color: #fff !important;
          background-color: #09090b !important;
        }
      `;
      document.head.appendChild(styleElement);
      
      setProgress(50);
      
      // Wait for images to load in the new content
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Make visible for capture
      captureDiv.style.visibility = 'visible';
      setProgress(70);
      
      try {
        // Use html2canvas to capture the element
        const canvas = await html2canvas(captureDiv, {
          scale: 2,
          logging: true,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#09090B',
        });
        
        setProgress(90);
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png');
        setImageUrl(dataUrl);
        setProgress(100);
        
        // Clean up
        document.body.removeChild(captureDiv);
        document.head.removeChild(styleElement);
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('Canvas capture failed:', err);
        document.body.removeChild(captureDiv);
        document.head.removeChild(styleElement);
        throw new Error('Failed to capture screenshot: Canvas error');
      }
    } catch (err) {
      console.error('Screenshot generation error:', err);
      clearTimeout(timeoutId);
      setError(err instanceof Error ? err.message : 'Failed to generate screenshot');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle image download
  const handleDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `trade-${trade.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle image copy
  const handleCopy = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy image:', err);
    }
  };

  // Handle image share
  const handleShare = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `trade-${trade.id}.png`, { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Trade #${trade.id}`,
          files: [file]
        });
      } else {
        console.warn('Sharing not supported on this platform');
      }
    } catch (err) {
      console.error('Failed to share image:', err);
    }
  };

  return (
    <>      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[650px] p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <svg
                  className="w-16 h-16 rotate-[-90deg]"
                  viewBox="0 0 100 100"
                >
                  <circle
                    className="stroke-zinc-800"
                    strokeWidth="8"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="stroke-blue-500 transition-all duration-300"
                    strokeWidth="8"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * progress) / 100}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
              </div>
              <p className="text-sm text-zinc-400">Generating screenshot...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <p className="text-red-500">{error}</p>
              <Button onClick={generateScreenshot}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="aspect-[3/2] bg-zinc-950 rounded-none overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Trade Screenshot"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="styled-component-display" ref={containerRef}>
                    <TradeScreenshot trade={trade} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button
                  className="flex-1"
                  onClick={handleDownload}
                  disabled={!imageUrl}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCopy}
                  disabled={!imageUrl}
                >
                  {copySuccess ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copySuccess ? 'Copied' : 'Copy'}
                </Button>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <Button
                    className="flex-1"
                    onClick={handleShare}
                    disabled={!imageUrl}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 