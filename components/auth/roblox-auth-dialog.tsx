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
import { Shield, Lock, Star, RefreshCw, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRobloxAuth } from "@/app/hooks/use-roblox-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { attemptRobloxLogin } from '@/app/utils/auth-utils';

interface RobloxAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RobloxAuthDialog({ open, onOpenChange }: RobloxAuthDialogProps) {
  const { login, isAuthenticated } = useRobloxAuth();
  const [cookie, setCookie] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

        <div className="mt-6 space-y-4">
          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="font-medium text-zinc-100">How to get your cookie:</h3>
            <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-400">
              <li className="pl-2">Visit <span className="text-zinc-100">Roblox.com</span> and login if necessary</li>
              <li className="pl-2">Open Developer Tools (<span className="text-zinc-100">F12</span> or <span className="text-zinc-100">Cmd+Opt+I</span>)</li>
              <li className="pl-2">Navigate to <span className="text-zinc-100">Application → Cookies → https://www.roblox.com</span></li>
              <li className="pl-2">Find and copy the value of <span className="text-zinc-100">.ROBLOSECURITY</span></li>
            </ol>
            <div className="flex items-center gap-2">
              <div className="h-[1px] w-full bg-zinc-800" />
              <span className="text-zinc-400 text-sm">or</span>
              <div className="h-[1px] w-full bg-zinc-800" />
            </div>

            <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-400">
              <li className="pl-2 flex flex-row gap-2">
                Install the <a href="https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm" target="_blank" rel="noopener noreferrer" className="text-zinc-100 flex flex-row items-center gap-1">
                  Cookie Editor <span className="text-zinc-400 text-sm bg-zinc-900 px-1 rounded-none flex flex-row items-center gap-1">4.4 <Star className="w-3 h-3 fill-zinc-400 stroke-zinc-400" /></span>
                </a>
                extension
              </li>
              <li className="pl-2">Click the extension icon on Roblox.com</li>
              <li className="pl-2">Copy the value of <span className="text-zinc-100">.ROBLOSECURITY</span></li>
            </ol>

            <div className="h-[1px] w-full bg-zinc-800" />
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
        </div>

        <DialogFooter className="pt-2 border-t border-zinc-800 text-xs text-zinc-500">
          <span>Ensure you're using the correct cookie format starting with "_|WARNING:-DO-NOT-SHARE-THIS"</span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 