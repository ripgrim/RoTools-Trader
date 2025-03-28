"use client"

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Shield, Lock, Star, RefreshCw, AlertCircle, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRobloxAuth } from "@/app/hooks/use-roblox-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { attemptRobloxLogin } from '@/app/utils/auth-utils';
import { Drawer } from 'vaul';
import { useMediaQuery } from '@/hooks/use-media-query';

interface RobloxAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RobloxAuthDialog({ open, onOpenChange }: RobloxAuthDialogProps) {
  const { login, isAuthenticated } = useRobloxAuth();
  const [cookie, setCookie] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 640px)");
  
  // Debug logging for dialog state
  useEffect(() => {
    console.log("Auth dialog state:", { open, isAuthenticated });
  }, [open, isAuthenticated]);
  
  // Close dialog if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && open) {
      console.log("User is authenticated, closing dialog");
      onOpenChange(false);
    }
  }, [isAuthenticated, open, onOpenChange]);

  const handleCookieChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCookie(e.target.value);
    setError(null); // Clear any previous errors
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!cookie.trim() || isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    // Use the shared login utility
    await attemptRobloxLogin(
      cookie,
      login,
      // Success callback
      () => {
        console.log("Login successful via dialog, will close shortly");
        // Close the dialog after a brief delay
        setTimeout(() => onOpenChange(false), 500);
      },
      // Error callback
      (errorMessage) => {
        console.error("Login failed in dialog:", errorMessage);
        setError(errorMessage);
      }
    );
    
    setIsSubmitting(false);
  }, [cookie, login, onOpenChange, isSubmitting]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!isSubmitting) {
      onOpenChange(open);
      
      // Reset state when dialog closes
      if (!open) {
        setCookie("");
        setError(null);
      }
    }
  }, [isSubmitting, onOpenChange]);

  const buttonContent = isSubmitting ? (
    <div className="flex items-center gap-2">
      <RefreshCw className="w-4 h-4 animate-spin" />
      <span>Authenticating...</span>
    </div>
  ) : (
    <span>Authenticate</span>
  );

  const content = (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="space-y-4">
        <h3 className="font-medium text-zinc-100">How to get your cookie:</h3>
        <ol className="space-y-3 text-sm text-zinc-400">
          <li className="flex gap-2"><span className="text-zinc-500">1.</span>Visit <span className="text-zinc-100">Roblox.com</span> and login if necessary</li>
          <li className="flex gap-2"><span className="text-zinc-500">2.</span>Open Developer Tools (<span className="text-zinc-100">F12</span> or <span className="text-zinc-100">Cmd+Opt+I</span>)</li>
          <li className="flex gap-2"><span className="text-zinc-500">3.</span>Navigate to <span className="text-zinc-100">Application → Cookies → https://www.roblox.com</span></li>
          <li className="flex gap-2"><span className="text-zinc-500">4.</span>Find and copy the value of <span className="text-zinc-100">.ROBLOSECURITY</span></li>
        </ol>
        <div className="flex items-center gap-2">
          <div className="h-[1px] w-full bg-zinc-800" />
          <span className="text-zinc-400 text-sm">or</span>
          <div className="h-[1px] w-full bg-zinc-800" />
        </div>

        <ol className="space-y-3 text-sm text-zinc-400">
          <li className="flex gap-2">
            <span className="text-zinc-500">1.</span>
            Install the <a href="https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm" target="_blank" rel="noopener noreferrer" className="text-zinc-100 flex flex-row items-center gap-1">
              Cookie Editor <span className="text-zinc-400 text-sm bg-zinc-900 px-1 rounded-none flex flex-row items-center gap-1">4.4 <Star className="w-3 h-3 fill-zinc-400 stroke-zinc-400" /></span>
            </a>
            extension
          </li>
          <li className="flex gap-2"><span className="text-zinc-500">2.</span>Click the extension icon on Roblox.com</li>
          <li className="flex gap-2"><span className="text-zinc-500">3.</span>Copy the value of <span className="text-zinc-100">.ROBLOSECURITY</span></li>
        </ol>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-950/20 border-red-900/50 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Textarea
          placeholder="Paste your .ROBLOSECURITY cookie here"
          className="w-full min-h-[80px] bg-zinc-900/50 border-zinc-800 focus:ring-offset-zinc-950"
          value={cookie}
          onChange={handleCookieChange}
          disabled={isSubmitting}
        />
        <Button
          variant="default"
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting || !cookie.trim()}
        >
          {buttonContent}
        </Button>
      </div>

      {/* Security Notice */}
      <div className="p-4 bg-zinc-900/50 rounded-none border border-zinc-800/50">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-zinc-400 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-medium text-zinc-100">Your Security Matters</h4>
            <p className="text-sm text-zinc-400">
              Your cookie is stored locally in your browser and used only to authenticate with Roblox. 
              It is never sent to our servers or stored elsewhere.
            </p>
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-500 text-center">
        <span>Ensure you're using the correct cookie format starting with "_|WARNING:-DO-NOT-SHARE-THIS"</span>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={handleOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="bg-zinc-950 flex flex-col rounded-t-[10px] h-[96vh] mt-24 fixed bottom-0 left-0 right-0">
            <div className="px-4 sm:px-6 py-4 bg-zinc-950 rounded-t-[10px] flex-1 overflow-auto">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-800 mb-8" />
              
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-zinc-400" />
                    <h2 className="text-xl font-bold text-zinc-100">Roblox Authentication</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenChange(false)}
                    className="text-zinc-400 hover:text-zinc-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <p className="text-zinc-400 mb-6">
                  Please add your Roblox .ROBLOSECURITY cookie to authenticate.
                </p>

                {content}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md border border-zinc-800">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-zinc-400" />
            <DialogTitle className="text-xl font-bold">Roblox Authentication</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            Please add your Roblox .ROBLOSECURITY cookie to authenticate.
          </DialogDescription>
        </DialogHeader>

        {content}

        <DialogFooter className="pt-2 border-t border-zinc-800 text-xs text-zinc-500">
          <span>Ensure you're using the correct cookie format starting with "_|WARNING:-DO-NOT-SHARE-THIS"</span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 