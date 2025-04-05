"use client"

import React, { useRef, useState } from 'react';
import { useScreenshot } from 'use-react-screenshot';
import { TradeScreenshot, ScreenshotTrade } from '@/components/trades/trade-screenshot';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

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

export default function ReactScreenshotTest() {
  const componentRef = useRef<HTMLDivElement>(null);
  const [image, takeScreenshot] = useScreenshot({
    type: 'image/png',
    quality: 1.0
  });
  
  // Function to take the screenshot
  const takeScreenshotHandler = () => {
    if (componentRef.current) {
      takeScreenshot(componentRef.current);
    }
  };
  
  // Function to download the image
  const downloadImage = () => {
    if (!image) return;
    
    const link = document.createElement('a');
    link.href = image;
    link.download = `trade-${defaultTrade.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Screenshot Test</h1>
      
      {/* Component to capture - keep it hidden but properly sized */}
      <div className="">
        <div ref={componentRef} className="styled-component w-[600px]">
          <style jsx>{`
            .styled-component :global(.item-container) {
              margin: 8px 0;
            }
            .styled-component :global(.serial-container) {
              padding: 2px 6px;
              display: inline-flex;
              align-items: center;
            }
            .styled-component :global(.value-diff) {
              margin-left: 8px;
            }
          `}</style>
          <TradeScreenshot trade={defaultTrade} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Component display (not the actual ref) */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Component Preview</h2>
          <div className="bg-zinc-950 p-4 mb-4 rounded-none">
            <div className="styled-component-display">
              <style jsx>{`
                .styled-component-display :global(.item-container) {
                  margin: 8px 0;
                }
                .styled-component-display :global(.serial-container) {
                  padding: 2px 6px;
                  display: inline-flex;
                  align-items: center;
                }
                .styled-component-display :global(.value-diff) {
                  margin-left: 8px;
                }
              `}</style>
              <TradeScreenshot trade={defaultTrade} />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={takeScreenshotHandler}>
              Take Screenshot
            </Button>
            {image && (
              <Button variant="outline" onClick={downloadImage}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
        
        {/* Screenshot result */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Screenshot Result</h2>
          {image ? (
            <div className="bg-zinc-950 p-4 rounded-none">
              <img 
                src={image} 
                alt="Screenshot" 
                className="w-full border border-zinc-800 rounded-none"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] border border-dashed border-zinc-700 rounded-none p-8 bg-zinc-900/50">
              <p className="text-zinc-400 text-center">
                Screenshot will appear here after you click "Take Screenshot"
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-none">
        <h3 className="font-medium mb-2">How it works:</h3>
        <p className="text-sm text-zinc-400">
          This test uses the <code className="bg-zinc-800 px-1 py-0.5 rounded">use-react-screenshot</code> library, which captures the hidden DOM element using the <code className="bg-zinc-800 px-1 py-0.5 rounded">ref</code> and converts it to an image. The component has a fixed width of 600px to match the TradeScreenshot's designed width.
        </p>
      </div>
    </div>
  );
}