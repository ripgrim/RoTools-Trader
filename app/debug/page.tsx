"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRobloxAuthContext } from '@/app/providers/roblox-auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RobloxAuthDialog } from '@/components/auth/roblox-auth-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  Shield, LogOut, RefreshCw, Key, History, Trash, Database, 
  Copy, ExternalLink, AlertTriangle, User, Info, ShoppingBag, 
  ArrowDown, ArrowUp, CheckSquare, ArrowDownToLine, ArrowUpFromLine 
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type TradeType = 'inbound' | 'outbound' | 'completed';

export default function DebugPage() {
  const { isAuthenticated, isLoading, cookie, login, logout, refreshCookie } = useRobloxAuthContext()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cookieInfo, setCookieInfo] = useState<{[key: string]: any}>({})
  const [directCookie, setDirectCookie] = useState("")
  const [apiResponse, setApiResponse] = useState<string | null>(null)
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [isUserDataLoading, setIsUserDataLoading] = useState(false)
  const [isTradesFetching, setIsTradesFetching] = useState(false)
  const [tradesResponse, setTradesResponse] = useState<any>(null)
  const [activeTradeTab, setActiveTradeTab] = useState<TradeType>('inbound')
  const { toast } = useToast()

  // Parse cookie info when auth state changes
  useEffect(() => {
    console.log("Auth state in debug page changed:", { isAuthenticated, isLoading, cookiePresent: !!cookie });
    
    if (cookie) {
      try {
        // Extract user ID and expiration from cookie if possible
        // This is just for debug purposes
        setCookieInfo({
          length: cookie.length,
          truncated: `${cookie.substring(0, 20)}...${cookie.substring(cookie.length - 20)}`,
        })
        
        // Load user data if authenticated
        loadUserData();
      } catch (error) {
        console.error("Failed to parse cookie info", error);
        setCookieInfo({ error: 'Failed to parse cookie info' })
      }
    } else {
      setCookieInfo({})
      setUserData(null)
    }
  }, [cookie, isAuthenticated, isLoading])

  const loadUserData = useCallback(async () => {
    if (!cookie || !isAuthenticated) return;
    
    setIsUserDataLoading(true);
    try {
      // Use our own API proxy instead of direct Roblox API call
      const response = await fetch("/api/roblox/user", {
        method: 'GET',
        headers: {
          'x-roblox-cookie': cookie
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        console.log("User data loaded:", data);
      } else {
        console.error("Failed to load user data:", response.status);
        setUserData(null);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setUserData(null);
    } finally {
      setIsUserDataLoading(false);
    }
  }, [cookie, isAuthenticated]);

  const handleRefresh = useCallback(async () => {
    if (!cookie) return
    
    console.log("Refreshing cookie...");
    setIsRefreshing(true)
    
    try {
      const refreshed = await refreshCookie(cookie)
      console.log("Refresh result:", !!refreshed);
      
      if (refreshed) {
        // Copy the refreshed token to clipboard
        await navigator.clipboard.writeText(refreshed);
        toast({
          title: 'Cookie refreshed',
          description: 'The refreshed cookie has been copied to your clipboard',
          variant: 'default',
        });
        
        await login(refreshed)
      }
    } catch (error) {
      console.error("Refresh error:", error);
      toast({
        title: 'Refresh failed',
        description: error instanceof Error ? error.message : 'Failed to refresh cookie',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false)
    }
  }, [cookie, login, refreshCookie, toast])

  const handleOpenDialog = useCallback(() => {
    console.log("Opening auth dialog");
    setIsDialogOpen(true)
  }, [])

  const handleDialogOpenChange = useCallback((open: boolean) => {
    console.log("Dialog open state changed:", open);
    setIsDialogOpen(open)
  }, [])

  const handleLogout = useCallback(async () => {
    console.log("Initiating logout from debug page");
    await logout()
  }, [logout])

  // Debug functions
  const handleDirectLogin = useCallback(async () => {
    if (!directCookie.trim()) return
    
    console.log("Attempting direct login...");
    await login(directCookie)
    setDirectCookie("")
  }, [directCookie, login])

  const handleClearStorage = useCallback(() => {
    console.log("Clearing all storage...");
    try {
      localStorage.clear()
      sessionStorage.clear()
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      console.log("Storage cleared")
      alert("Storage cleared. Page will reload.")
      window.location.reload()
    } catch (error) {
      console.error("Error clearing storage:", error)
    }
  }, [])

  const handleTestApi = useCallback(async () => {
    if (!directCookie.trim()) return
    
    setIsApiLoading(true)
    setApiResponse(null)
    
    try {
      console.log("Testing refresh API with provided cookie...")
      const response = await fetch('/api/roblox/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roblosecurityCookie: directCookie,
        }),
      })
      
      const data = await response.json()
      console.log("API response:", data)
      setApiResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error("API test error:", error)
      setApiResponse(JSON.stringify({ error: String(error) }, null, 2))
    } finally {
      setIsApiLoading(false)
    }
  }, [directCookie])

  const handleCopyCookie = useCallback(() => {
    if (!cookie) return
    
    navigator.clipboard.writeText(cookie)
      .then(() => {
        toast({
          title: 'Cookie copied',
          description: 'The cookie has been copied to your clipboard',
          variant: 'default',
        });
      })
      .catch(err => {
        console.error("Failed to copy cookie:", err)
        toast({
          title: 'Failed to copy',
          description: 'Could not copy to clipboard',
          variant: 'destructive',
        });
      })
  }, [cookie, toast])

  const handleFetchTrades = useCallback(async (type: TradeType = 'inbound') => {
    if (!cookie || !isAuthenticated) return
    
    setIsTradesFetching(true)
    setTradesResponse(null)
    
    try {
      console.log(`Fetching ${type} trades...`)
      const response = await fetch(`/api/roblox/trades/${type}?limit=10`, {
        method: 'GET',
        headers: {
          'x-roblox-cookie': cookie,
        },
      })
      
      const data = await response.json()
      console.log(`${type} trades response:`, data)
      setTradesResponse(data)
      setActiveTradeTab(type)
      
      if (!response.ok) {
        toast({
          title: `Failed to fetch ${type} trades`,
          description: data.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Trades fetched',
          description: `Successfully fetched ${data.data?.length || 0} ${type} trades`,
          variant: 'default',
        });
      }
    } catch (error) {
      console.error(`Error fetching ${type} trades:`, error)
      setTradesResponse({ error: String(error) })
      toast({
        title: 'Error fetching trades',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsTradesFetching(false)
    }
  }, [cookie, isAuthenticated, toast])

  const getTradeTypeIcon = (type: TradeType) => {
    switch (type) {
      case 'inbound':
        return <ArrowDown className="h-4 w-4 mr-2" />;
      case 'outbound':
        return <ArrowUp className="h-4 w-4 mr-2" />;
      case 'completed':
        return <CheckSquare className="h-4 w-4 mr-2" />;
      default:
        return <ShoppingBag className="h-4 w-4 mr-2" />;
    }
  };

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
                  
                  {userData && (
                    <>
                      <span className="text-zinc-400">Username:</span>
                      <span>{userData.name}</span>
                      
                      <span className="text-zinc-400">User ID:</span>
                      <span>{userData.id}</span>
                      
                      <span className="text-zinc-400">Display Name:</span>
                      <span>{userData.displayName}</span>
                    </>
                  )}
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
                        <><RefreshCw className="h-4 w-4 mr-2" /> Refresh Cookie & Copy</>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-zinc-800"
                      onClick={loadUserData}
                      disabled={isUserDataLoading}
                    >
                      {isUserDataLoading ? (
                        <><User className="h-4 w-4 mr-2 animate-spin" /> Loading User Data</>
                      ) : (
                        <><User className="h-4 w-4 mr-2" /> Reload User Data</>
                      )}
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-zinc-800"
                        onClick={() => handleFetchTrades('inbound')}
                        disabled={isTradesFetching}
                      >
                        {isTradesFetching && activeTradeTab === 'inbound' ? (
                          <><ArrowDownToLine className="h-4 w-4 mr-2 animate-spin" /> Fetching...</>
                        ) : (
                          <><ArrowDownToLine className="h-4 w-4 mr-2" /> Inbound Trades</>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-zinc-800"
                        onClick={() => handleFetchTrades('outbound')}
                        disabled={isTradesFetching}
                      >
                        {isTradesFetching && activeTradeTab === 'outbound' ? (
                          <><ArrowUpFromLine className="h-4 w-4 mr-2 animate-spin" /> Fetching...</>
                        ) : (
                          <><ArrowUpFromLine className="h-4 w-4 mr-2" /> Outbound Trades</>
                        )}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-zinc-800"
                        onClick={() => handleFetchTrades('completed')}
                        disabled={isTradesFetching}
                      >
                        {isTradesFetching && activeTradeTab === 'completed' ? (
                          <><CheckSquare className="h-4 w-4 mr-2 animate-spin" /> Fetching...</>
                        ) : (
                          <><CheckSquare className="h-4 w-4 mr-2" /> Completed Trades</>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-zinc-800"
                        onClick={handleCopyCookie}
                      >
                        <Copy className="h-4 w-4 mr-2" /> Copy Cookie
                      </Button>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-zinc-800 hover:bg-red-950/30 hover:text-red-400"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-zinc-800"
                    onClick={handleOpenDialog}
                  >
                    <Shield className="h-4 w-4 mr-2" /> Authenticate
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Trades Response Section */}
          {tradesResponse && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-zinc-400" />
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-1">
                  Roblox Trades
                </h3>
              </div>
              
              <Tabs defaultValue={activeTradeTab} value={activeTradeTab} onValueChange={(v) => setActiveTradeTab(v as TradeType)}>
                <TabsList className="bg-zinc-900/50 border border-zinc-800">
                  <TabsTrigger value="inbound" className="data-[state=active]:bg-zinc-800">
                    <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
                    Inbound
                  </TabsTrigger>
                  <TabsTrigger value="outbound" className="data-[state=active]:bg-zinc-800">
                    <ArrowUpFromLine className="h-3.5 w-3.5 mr-1.5" />
                    Outbound
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="data-[state=active]:bg-zinc-800">
                    <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                    Completed
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTradeTab} className="pt-2">
                  <Textarea 
                    readOnly 
                    className="w-full min-h-[250px] bg-zinc-900/50 border-zinc-800 text-xs" 
                    value={JSON.stringify(tradesResponse, null, 2)}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {/* Advanced Debug Section */}
          <div className="space-y-4 p-4 bg-zinc-800/30 border border-zinc-700 rounded-none">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-medium text-amber-400">Advanced Debug Tools</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Direct Auth Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-zinc-400">Direct Authentication</h4>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter .ROBLOSECURITY cookie"
                    value={directCookie}
                    onChange={(e) => setDirectCookie(e.target.value)}
                    className="flex-1 h-8 bg-zinc-900 border-zinc-800 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDirectLogin}
                    disabled={!directCookie.trim()}
                    className="h-8 border-zinc-800"
                  >
                    <Shield className="h-3.5 w-3.5 mr-2" /> Login Directly
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestApi}
                    disabled={isApiLoading || !directCookie.trim()}
                    className="h-8 border-zinc-800"
                  >
                    {isApiLoading ? (
                      <><RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> Testing...</>
                    ) : (
                      <><ExternalLink className="h-3.5 w-3.5 mr-2" /> Test API</>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Storage Management */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-zinc-400">Storage Management</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="h-8 border-zinc-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-2" /> Reload Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearStorage}
                    className="h-8 border-zinc-800 hover:bg-red-950/30 hover:text-red-400"
                  >
                    <Trash className="h-3.5 w-3.5 mr-2" /> Clear All Storage
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { localStorage.removeItem('roblox-cookie'); alert('Cookie removed from local storage'); }}
                    className="h-8 border-zinc-800"
                  >
                    <Database className="h-3.5 w-3.5 mr-2" /> Remove Cookie Only
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { document.cookie = `roblox-auth-session=; expires=${new Date().toUTCString()}; path=/`; alert('Session cookie removed'); }}
                    className="h-8 border-zinc-800"
                  >
                    <History className="h-3.5 w-3.5 mr-2" /> Remove Session Only
                  </Button>
                </div>
              </div>
            </div>
            
            {/* API Response Section */}
            {apiResponse && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-zinc-400">API Response</h4>
                <Textarea
                  readOnly
                  value={apiResponse}
                  className="w-full min-h-[100px] bg-zinc-900/50 border-zinc-800 text-xs"
                />
              </div>
            )}
          </div>
          
          {isAuthenticated && userData && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-1">
                <Info className="h-4 w-4" />
                User Information
              </h3>
              <Textarea 
                readOnly 
                className="w-full min-h-[100px] bg-zinc-900/50 border-zinc-800 text-xs" 
                value={JSON.stringify(userData, null, 2)}
              />
            </div>
          )}
          
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
                      <span className="text-zinc-100">
                        {key.includes('cookie') || key.includes('token') 
                          ? '[SENSITIVE DATA]' 
                          : `${localStorage.getItem(key)?.substring(0, 30)}...`}
                      </span>
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
      
      <RobloxAuthDialog 
        open={isDialogOpen} 
        onOpenChange={handleDialogOpenChange} 
      />
    </div>
  )
} 