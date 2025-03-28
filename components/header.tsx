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
import { Settings, User, Bug } from "lucide-react";
import Image from "next/image";
import { RobloxAuthStatus } from "./auth/roblox-auth-status";

export function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-900/50 w-full flex justify-center">
      <div className="container w-full px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-zinc-100">RoTools</span>
            <span className="text-sm text-zinc-500">Trader</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Debug Page Link */}
            <Link href="/debug" className="text-sm text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
              <Bug className="h-3.5 w-3.5" />
              <span>Debug</span>
            </Link>

            {/* Roblox Auth Status */}
            <RobloxAuthStatus />

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-none p-0">
                  <Image
                    src="https://tr.rbxcdn.com/30DAY-AvatarHeadshot-7181BD1227746006A9A38A4464AA8EF0-Png/150/150/AvatarHeadshot/Webp/noFilter"
                    alt="Avatar"
                    height={40}
                    width={40}
                    className="rounded-none border border-zinc-700"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                <DropdownMenuLabel className="text-zinc-400">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}