"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Settings, Sun, User } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    // Add view transitions API for a smooth theme change with clip path
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setTheme(theme === "dark" ? "light" : "dark");
      }).ready.then(() => {
        document.documentElement.style.setProperty(
          "--view-transition-name", 
          theme === "dark" ? "circle-out" : "circle-in"
        );
      });
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  return (
    <header className="border-b border-border bg-background/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">RoTools</span>
            <span className="text-sm text-muted-foreground">Trader</span>
          </Link>

          {/* Profile Menu */}
          {user && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                <img
                  src={user?.avatar || ""}
                  alt="Avatar"
                  height={40}
                  width={40}
                  className="rounded-full border border-border"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
              <DropdownMenuLabel className="text-muted-foreground">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2 text-foreground/80 hover:text-foreground">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 text-foreground/80 hover:text-foreground">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              {mounted && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleTheme();
                  }}
                  className="flex items-center justify-between text-foreground/80 hover:text-foreground cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                    Theme Mode
                  </div>
                  <Switch checked={theme === "light"} />
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>}
        </div>
      </div>
    </header>
  );
}