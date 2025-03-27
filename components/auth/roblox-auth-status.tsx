"use client"

import { useState, useCallback } from 'react';
import { Shield, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRobloxAuthContext } from '@/app/providers/roblox-auth-provider';
import { RobloxAuthDialog } from './roblox-auth-dialog';

export function RobloxAuthStatus() {
  const { isAuthenticated, isLoading, logout } = useRobloxAuthContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      console.log("Logging out...");
      await logout();
      console.log("Logout complete");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [logout]);

  const handleAuthClick = useCallback(() => {
    if (isAuthenticated) {
      // Show dropdown or additional options
      console.log("Already authenticated, no action needed");
    } else {
      console.log("Opening auth dialog");
      setIsDialogOpen(true);
    }
  }, [isAuthenticated]);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    console.log("Dialog open state changed:", open);
    setIsDialogOpen(open);
  }, []);

  if (isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-2 border-zinc-800 bg-zinc-900/50"
        disabled
      >
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </Button>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 border-zinc-800 bg-zinc-900/50 text-green-400"
            onClick={handleAuthClick}
          >
            <Shield className="h-4 w-4" />
            <span>Authenticated</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2 border-zinc-800 bg-zinc-900/50 hover:bg-red-950/30 hover:text-red-400"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-zinc-800 bg-zinc-900/50"
          onClick={handleAuthClick}
        >
          <Shield className="h-4 w-4" />
          <span>Authenticate</span>
        </Button>
      )}

      <RobloxAuthDialog 
        open={isDialogOpen} 
        onOpenChange={handleDialogOpenChange} 
      />
    </>
  );
} 