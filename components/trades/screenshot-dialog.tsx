"use client"

import { Trade, TradeItem } from '@/app/types/trade';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { TradeScreenshot } from './trade-screenshot';
import type { ScreenshotTrade } from './trade-screenshot';
import { useScreenshot } from '@/hooks/use-screenshot';
import { useState, useEffect } from 'react';
import { cn, transformTradeForScreenshot } from "@/lib/utils";

interface ScreenshotDialogProps {
  trade: ScreenshotTrade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScreenshotDialog({ trade, open, onOpenChange }: ScreenshotDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const { generate, isGenerating, progress } = useScreenshot({
    onComplete: setImageUrl,
    onError: (error: string) => console.error('[Screenshot] Error:', error),
  });

  // Effect to start generation when dialog opens
  useEffect(() => {
    if (open && !imageUrl && !isGenerating) {
      generate(trade);
    }
  }, [open, imageUrl, isGenerating, trade, generate]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setImageUrl(null);
      setCopySuccess(false);
    }
  }, [open]);

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
          ) : (
            <>
              <div className="aspect-[3/2] bg-zinc-950 rounded-lg overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Trade Screenshot"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div data-screenshot-target="true">
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

      {/* Hidden element for screenshot capturing - only visible during generation */}
      {isGenerating && !imageUrl && (
        <div className="fixed -left-[9999px] -top-[9999px]" data-screenshot-target="true">
          <TradeScreenshot trade={trade} />
        </div>
      )}
    </>
  );
} 