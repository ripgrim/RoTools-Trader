"use client"

export function TradesSkeleton() {
  return (
    <div className="flex h-full animate-pulse">
      {/* Left Panel */}
      <div className="w-full md:w-[400px] md:border-r border-zinc-800 h-full overflow-auto">
        <div className="h-full flex flex-col">
          {/* Tabs */}
          <div className="px-6 pt-6 pb-4 bg-transparent border-b border-zinc-800">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 w-24 bg-zinc-800 rounded-none" />
              ))}
            </div>
          </div>
          
          {/* Trade List */}
          <div className="flex-1 px-6 py-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-zinc-800/50 rounded-none" />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden md:block flex-1 h-full">
        <div className="h-full bg-background">
          {/* Header */}
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-zinc-800 rounded-none" />
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-zinc-800 rounded" />
                  <div className="h-4 w-24 bg-zinc-800 rounded" />
                </div>
              </div>
              <div className="h-4 w-32 bg-zinc-800 rounded" />
            </div>
          </div>

          {/* Trade Content */}
          <div className="p-6">
            {/* Items Grid */}
            <div className="grid grid-cols-2 gap-8">
              {/* Offering */}
              <div>
                <div className="h-6 w-24 bg-zinc-800 rounded mb-4" />
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border border-zinc-800 rounded-none">
                      <div className="h-20 w-20 bg-zinc-800 rounded" />
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-zinc-800 rounded" />
                        <div className="h-4 w-24 bg-zinc-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requesting */}
              <div>
                <div className="h-6 w-24 bg-zinc-800 rounded mb-4" />
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border border-zinc-800 rounded-none">
                      <div className="h-20 w-20 bg-zinc-800 rounded" />
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-zinc-800 rounded" />
                        <div className="h-4 w-24 bg-zinc-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trade Summary */}
            <div className="mt-6 p-4 bg-zinc-900/50 rounded-none">
              <div className="h-6 w-32 bg-zinc-800 rounded mb-4" />
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-zinc-800 rounded" />
                  <div className="h-4 w-32 bg-zinc-800 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-zinc-800 rounded" />
                  <div className="h-4 w-32 bg-zinc-800 rounded" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col md:flex-row gap-4 md:justify-end">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-11 w-full md:w-32 bg-zinc-800 rounded-none" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 