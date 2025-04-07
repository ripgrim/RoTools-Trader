"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Unlock } from "lucide-react";

export default function SettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [cookie, setCookie] = useState("••••••••••••••••••••••••••••••••");

  const handleEdit = () => {
    if (isEditing) {
      // Save changes
      localStorage.setItem("rolimons-token", cookie);
    }
    setIsEditing(!isEditing);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-8">Settings</h1>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Security</h2>
            <div className="p-4 bg-background rounded-none border border-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    .ROBLOSECURITY Cookie
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="text-foreground hover:text-foreground"
                  >
                    {isEditing ? (
                      <Lock className="w-4 h-4 mr-2" />
                    ) : (
                      <Unlock className="w-4 h-4 mr-2" />
                    )}
                    {isEditing ? "Save" : "Edit"}
                  </Button>
                </div>
                <Input
                  type="password"
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  disabled={!isEditing}
                  className="bg-background border-border"
                />
                <p className="text-sm text-foreground">
                  This cookie is stored locally and used to authenticate with Roblox.
                  It&apos;s securely hashed and never shared with any third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 