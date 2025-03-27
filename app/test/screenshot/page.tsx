"use client"

import { useState, useRef } from 'react';
import { TradeScreenshot, ScreenshotTrade } from '@/components/trades/trade-screenshot';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';

// Sample data for a trade
const defaultTrade: ScreenshotTrade = {
  id: "2713330819954542",
  created: "2025-03-27T12:00:00.000Z",
  sender: {
    displayName: "Vare Collects",
    avatar: "https://tr.rbxcdn.com/30e25c659d3db7a7c96b898c30b4b1fc/150/150/AvatarHeadshot/Png"
  },
  receiver: {
    displayName: "You",
    avatar: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
  },
  sending: [
    {
      id: "1",
      name: "Snowflake Eyes",
      thumbnail: "https://tr.rbxcdn.com/4c292f18fa40a0bfaa84b4e992984edc/110/110/Hat/Png",
      value: 42000,
      rap: 42326
    },
    {
      id: "2",
      name: "Catching Snowflakes",
      thumbnail: "https://tr.rbxcdn.com/dfe05d7db192ad5d85a63b49c160312b/110/110/Hat/Png",
      value: 32000,
      rap: 29638,
      serial: "18262"
    },
    {
      id: "3",
      name: "Radioactive Beast Mode",
      thumbnail: "https://tr.rbxcdn.com/c4909ab75d6f90869c1d9308be9f7e96/110/110/Hat/Png",
      value: 75000,
      rap: 74290
    }
  ],
  receiving: [
    {
      id: "4",
      name: "Blizzard Beast Mode",
      thumbnail: "https://tr.rbxcdn.com/50bba317dc13ec555349bd0ab1050fd1/110/110/Hat/Png",
      value: 130000,
      rap: 126848,
      serial: "4961"
    }
  ],
  sendingValue: 149000,
  receivingValue: 130000,
  valueDiff: -19000,
  valueDiffPercentage: -13,
  type: 'Trade'
};

export default function TestScreenshotPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(3); // Default screenshot scale
  const [rawScale, setRawScale] = useState(1);
  
  const rawPreviewRef = useRef<HTMLDivElement>(null);

  // Handle scale change for raw preview
  const incrementRawScale = () => setRawScale(prev => Math.min(prev + 0.25, 3));
  const decrementRawScale = () => setRawScale(prev => Math.max(prev - 0.25, 0.5));

  // Generate screenshot
  const handleGenerateScreenshot = async () => {
    const screenshotElement = document.querySelector('[data-screenshot-target="true"]');
    
    if (!screenshotElement) {
      console.error('Could not find screenshot element');
      return;
    }
    
    try {
      const canvas = await html2canvas(screenshotElement as HTMLElement, {
        backgroundColor: '#09090B', // zinc-950
        scale: scale,
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          // Find the cloned element to add additional styling before capture
          const clonedElement = clonedDoc.querySelector('[data-screenshot-target="true"]');
          if (clonedElement) {
            // Add extra padding to ensure enough space
            clonedElement.querySelectorAll('.item-container').forEach(item => {
              (item as HTMLElement).style.margin = '8px 0';
            });
            // Fix serial number container spacing
            clonedElement.querySelectorAll('.serial-container').forEach(serial => {
              (serial as HTMLElement).style.padding = '2px 6px';
              (serial as HTMLElement).style.display = 'inline-flex';
              (serial as HTMLElement).style.alignItems = 'center';
            });
            // Fix value diff spacing
            const valueDiff = clonedElement.querySelector('.value-diff');
            if (valueDiff) {
              (valueDiff as HTMLElement).style.marginLeft = '8px';
            }
          }
        }
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate screenshot:', err);
    }
  };

  // Download screenshot
  const handleDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `trade-${defaultTrade.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">HTML2Canvas Screenshot Test</h1>
      
      {/* Raw component preview with scaling controls */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Component Preview ({rawScale}x)</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={decrementRawScale}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={incrementRawScale}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="overflow-auto border border-zinc-800 rounded-lg mb-4" style={{ maxHeight: '500px', background: '#09090B' }}>
          <div 
            ref={rawPreviewRef} 
            className="inline-block p-4"
            style={{ transform: `scale(${rawScale})`, transformOrigin: 'top left' }}
          >
            <TradeScreenshot trade={defaultTrade} />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Screenshot target */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Screenshot Target</h2>
          <div className="bg-zinc-950 p-4 rounded-lg mb-4">
            <div data-screenshot-target="true">
              <TradeScreenshot trade={defaultTrade} />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleGenerateScreenshot}>
              Generate Screenshot
            </Button>
            {imageUrl && (
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
        
        {/* Screenshot result */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Generated Screenshot</h2>
          {imageUrl ? (
            <div className="bg-zinc-950 p-4 rounded-lg">
              <img 
                src={imageUrl} 
                alt="Screenshot" 
                className="w-full border border-zinc-800 rounded-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 border border-dashed border-zinc-700 rounded-lg p-8 bg-zinc-900/50">
              <p className="text-zinc-400 text-center">
                Screenshot will appear here after you click "Generate Screenshot"
              </p>
            </div>
          )}
          
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-zinc-400">Scale:</span>
            <select 
              className="px-2 py-1 border border-zinc-800 rounded-md bg-zinc-950 text-sm"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
            >
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={3}>3x (Recommended)</option>
              <option value={4}>4x</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
        <h3 className="font-medium mb-2">How it works:</h3>
        <p className="text-sm text-zinc-400">
          This test uses <code className="bg-zinc-800 px-1 py-0.5 rounded">html2canvas</code> directly to capture screenshots. The styling adjustments are applied during capture via the <code className="bg-zinc-800 px-1 py-0.5 rounded">onclone</code> callback to fix layout issues.
        </p>
      </div>
    </div>
  );
} 