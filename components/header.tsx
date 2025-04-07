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
import { useToken } from "@/providers/token-provider";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

export function Header() {
  const {user} = useToken()
  const { theme, setTheme } = useTheme()
  
  return (
    <header className="border-b border-border bg-background/50">
      <div className="w-full">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-row">
           <img src="/luma-logo.png" alt="Luma Logo" width={20} height={20} />
           <img src="/luma-type.png" alt="Luma Logo" width={60} height={60} />
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
            <DropdownMenuContent align="end" className="w-56 bg-background border-border">
              <DropdownMenuLabel className="text-muted-foreground">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-muted" />
              <DropdownMenuItem asChild>
                <Link href={`/profile/me`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-muted" />
              <div className="px-2 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="relative w-4 h-4">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
                    <Moon className="h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
                  </div>
                  <span>Dark Mode</span>
                </div>
                <Switch 
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>}
        </div>
      </div>
    </header>
  );
}