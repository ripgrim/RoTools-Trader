"use client"

import { Trade } from '@/app/types/trade';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { TradeScreenshot } from './trade-screenshot';
import { useScreenshot } from '@/hooks/use-screenshot';
import { useState, useEffect } from 'react';

interface ScreenshotDialogProps {
  trade: Trade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScreenshotDialog({ trade, open, onOpenChange }: ScreenshotDialogProps) {
  const { ref, isCapturing, capture } = useScreenshot();
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    
    const images = ref.current.getElementsByTagName('img');
    let loadedCount = 0;
    const totalImages = images.length;

    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setImagesLoaded(true);
      }
    };

    Array.from(images).forEach(img => {
      if (img.complete) {
        handleImageLoad();
      } else {
        img.addEventListener('load', handleImageLoad);
      }
    });

    return () => {
      Array.from(images).forEach(img => {
        img.removeEventListener('load', handleImageLoad);
      });
    };
  }, [ref, open]);

  // Reset success states when dialog opens/closes
  useEffect(() => {
    setCopySuccess(false);
    setDownloadSuccess(false);
    setShareSuccess(false);
  }, [open]);

  const captureWithCheck = async () => {
    if (!imagesLoaded) {
      await new Promise(resolve => {
        const checkLoaded = () => {
          if (imagesLoaded) {
            resolve(true);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }
    return capture();
  };

  const handleDownload = async () => {
    try {
      const dataUrl = await captureWithCheck();
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `trade-${trade.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to download:', error);
    }
  };

  const handleCopy = async () => {
    try {
      setIsCopying(true);
      const dataUrl = await captureWithCheck();
      const blob = await fetch(dataUrl).then(r => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    } finally {
      setIsCopying(false);
    }
  };

  const handleShare = async () => {
    try {
      const dataUrl = await captureWithCheck();
      const blob = await fetch(dataUrl).then(r => r.blob());
      const file = new File([blob], `trade-${trade.id}.png`, { type: 'image/png' });
      
      if ('share' in navigator && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Trade Screenshot',
          text: 'Check out this trade from RoTools Trader!'
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle>Trade Screenshot</DialogTitle>
        </DialogHeader>
        
        <div ref={ref} className="relative">
          <TradeScreenshot trade={trade} />
          {!imagesLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleCopy}
            disabled={isCapturing || isCopying || !imagesLoaded}
          >
            {isCopying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : copySuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {isCopying ? 'Copying...' : copySuccess ? 'Copied!' : 'Copy'}
          </Button>
          {'share' in navigator && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleShare}
              disabled={isCapturing || !imagesLoaded}
            >
              {shareSuccess ? (
                <Check className="w-4 h-4" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              {shareSuccess ? 'Shared!' : 'Share'}
            </Button>
          )}
          <Button
            variant="default"
            className="gap-2"
            onClick={handleDownload}
            disabled={isCapturing || !imagesLoaded}
          >
            {isCapturing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : downloadSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isCapturing ? 'Generating...' : downloadSuccess ? 'Downloaded!' : 'Download'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 