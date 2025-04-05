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
import { Settings, User } from "lucide-react";
import Image from "next/image";
import { useToken } from "@/providers/token-provider";
export function Header() {
  const {user} = useToken()
  return (
    <header className="border-b border-zinc-800 bg-zinc-900/50">
      <div className="w-full">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-row">
           <Image src="/luma-logo.png" alt="Luma Logo" width={20} height={20} />
           <Image src="/luma-type.png" alt="Luma Logo" width={60} height={60} />
          </Link>

          {/* Profile Menu */}
          {user && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                <Image
                  src={user?.avatar || ""}
                  alt="Avatar"
                  height={40}
                  width={40}
                  className="rounded-full border border-zinc-700"
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
          </DropdownMenu>}
        </div>
      </div>
    </header>
  );
}