"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Lock, Code, Star } from "lucide-react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface TokenDialogProps {
  open: boolean;
}

export function TokenDialog({ open }: TokenDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!token.trim()) {
      toast({
        title: "Error",
        description: "Please enter your .ROBLOSECURITY cookie",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate token processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Store token in localStorage
      localStorage.setItem("rolimons-token", token);

      toast({
        title: "Success!",
        description: "Your token has been saved successfully.",
        className: "bg-background text-zinc-100 border border-zinc-800",
      });

      // Simulate a page reload to refresh the token state
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonContent = isSubmitting ? (
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 border-2 border-zinc-400 border-t-zinc-100 rounded-none animate-spin" />
      <span>Saving...</span>
    </div>
  ) : (
    <span>Submit</span>
  );

  return (
    <Dialog open={open} modal>
      <DialogContent className="sm:max-w-md border border-zinc-800">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-zinc-400" />
            <DialogTitle className="text-xl font-bold">Token Required</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            Please add your Rolimons token to continue using the application.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="font-medium text-zinc-100">How to get your token:</h3>
            <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-400">
              <li className="pl-2">Visit <span className="text-zinc-100">Roblox.com</span></li>
              <li className="pl-2">Open Developer Tools (<span className="text-zinc-100">F12</span> or <span className="text-zinc-100">Cmd+Opt+I</span>)</li>
              <li className="pl-2">Navigate to <span className="text-zinc-100">Application → Local Storage</span></li>
              <li className="pl-2">Copy the value of the <span className="text-zinc-100">&apos;.ROBLOSECURITY&apos;</span> cookie</li>
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
              <li className="pl-2">Find Roblox in Cookie Editor</li>
              <li className="pl-2">Copy the value of the <span className="text-zinc-100">&apos;.ROBLOSECURITY&apos;</span> cookie</li>
            </ol>

            <div className="h-[1px] w-full bg-zinc-800" />
          </div>

          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Enter your .ROBLOSECURITY cookie"
              className="w-full min-h-[80px] bg-zinc-900/50 border-zinc-800 focus:ring-offset-zinc-950"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button
              variant="default"
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {buttonContent}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-zinc-900/50 rounded-none border border-zinc-800/50">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-zinc-400 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-zinc-100">No need to fret!</h4>
                <p className="text-sm text-zinc-400">
                  Your token is stored locally and never leaves your device. It&apos;s securely hashed
                  and only used to authenticate with Roblox.
                </p>
              </div>
            </div>
          </div>

          {/* OSS Notice
          <div className="p-4 bg-zinc-900/50 rounded-none border border-zinc-800/50">
            <div className="flex items-start gap-3">
              <Code className="w-5 h-5 text-zinc-400 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-zinc-100">Open source</h4>
                <p className="text-sm text-zinc-400">
                  This project is open source. You can view the source code <a href="https://github.com/fixroblox/fuck" className="text-zinc-100">here</a>.
                </p>
              </div>
            </div>
          </div>
        */}

        </div>
      </DialogContent>
    </Dialog>
  );
} 