"use client"

import { useState, useEffect } from 'react'
import { useRobloxAuthContext } from '@/app/providers/roblox-auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RobloxAuthDialog } from '@/components/auth/roblox-auth-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Shield, LogOut, RefreshCw } from 'lucide-react'

export default function DebugPage() {
  const { isAuthenticated, isLoading, cookie, login, logout, refreshCookie } = useRobloxAuthContext()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cookieInfo, setCookieInfo] = useState<{[key: string]: any}>({})

  // Parse cookie info when auth state changes
  useEffect(() => {
    if (cookie) {
      try {
        // Extract user ID and expiration from cookie if possible
        // This is just for debug purposes
        setCookieInfo({
          length: cookie.length,
          truncated: `${cookie.substring(0, 20)}...${cookie.substring(cookie.length - 20)}`,
        })
      } catch (error) {
        setCookieInfo({ error: 'Failed to parse cookie info' })
      }
    } else {
      setCookieInfo({})
    }
  }, [cookie])

  const handleRefresh = async () => {
    if (!cookie) return
    
    setIsRefreshing(true)
    try {
      const refreshed = await refreshCookie(cookie)
      if (refreshed) {
        await login(refreshed)
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card className="border-zinc-800 bg-zinc-900/30">
        <CardHeader>
          <CardTitle className="text-xl">Roblox Auth Debug</CardTitle>
          <CardDescription>Test and debug the Roblox authentication functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400">Auth State</h3>
              <div className="p-4 bg-zinc-900 rounded-none border border-zinc-800 text-sm">
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-zinc-400">Status:</span>
                  <span className={isAuthenticated ? "text-green-400" : "text-red-400"}>
                    {isLoading ? "Loading..." : isAuthenticated ? "Authenticated" : "Not Authenticated"}
                  </span>
                  
                  <span className="text-zinc-400">Loading:</span>
                  <span>{isLoading ? "True" : "False"}</span>
                  
                  <span className="text-zinc-400">Cookie Present:</span>
                  <span>{cookie ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400">Actions</h3>
              <div className="p-4 bg-zinc-900 rounded-none border border-zinc-800 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-zinc-800"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Refreshing Cookie</>
                      ) : (
                        <><RefreshCw className="h-4 w-4 mr-2" /> Refresh Cookie</>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-zinc-800 hover:bg-red-950/30 hover:text-red-400"
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-zinc-800"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Shield className="h-4 w-4 mr-2" /> Authenticate
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {isAuthenticated && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400">Cookie Info (Debug Only)</h3>
              <Textarea 
                readOnly 
                className="w-full min-h-[100px] bg-zinc-900/50 border-zinc-800 text-xs" 
                value={JSON.stringify(cookieInfo, null, 2)}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-400">Local Storage</h3>
            <div className="p-4 bg-zinc-900 rounded-none border border-zinc-800 text-xs font-mono">
              {typeof window !== 'undefined' && (
                <ul className="space-y-1">
                  {Object.keys(localStorage).map(key => (
                    <li key={key} className="truncate">
                      <span className="text-zinc-400">{key}: </span>
                      <span className="text-zinc-100">{`${localStorage.getItem(key)?.substring(0, 30)}...`}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-zinc-800 text-xs text-zinc-500 p-4">
          This page is for testing purposes only. Do not expose cookie information in production.
        </CardFooter>
      </Card>
      
      <RobloxAuthDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  )
} 