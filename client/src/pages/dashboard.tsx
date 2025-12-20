import { DailySummary } from "@/components/briefing/daily-summary";
import { PriorityInbox } from "@/components/briefing/priority-inbox";
import { ScheduleCard } from "@/components/briefing/schedule-card";
import { IntegrationsPanel } from "@/components/briefing/integrations-panel";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: briefingData, refetch, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['briefing'],
    queryFn: async () => {
      const res = await fetch('/api/briefing');
      if (!res.ok) throw new Error('Failed to fetch briefing');
      return res.json();
    },
    refetchOnMount: true,
    staleTime: 0, // Always refetch on mount
  });

  // Update last synced time when data is fetched
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastSynced(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await refetch();
      setLastSynced(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    // Clear any session data and redirect
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-muted/20 p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        
        {/* Left Sidebar - Profile & Integrations */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="sticky top-6">
            <div className="mb-8 pl-1">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-primary">Briefing<span className="text-amber-600">.ai</span></h1>
              <p className="text-sm text-muted-foreground">Executive Intelligence Agent</p>
              <div className="flex items-center gap-2 mt-2">
                <a href="/admin" className="text-xs text-primary hover:underline" data-testid="link-admin">Admin Panel →</a>
                <span className="text-muted-foreground">|</span>
                <button onClick={handleLogout} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1" data-testid="button-logout">
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              </div>
            </div>
            
            {/* Sync Status Bar */}
            <div className="mb-4 p-3 bg-background rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  {lastSynced ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      Synced: {format(lastSynced, 'MMM d, h:mm a')}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not synced yet</span>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSync} 
                  disabled={isSyncing || isLoading}
                  className="h-7 px-2"
                  data-testid="button-sync-dashboard"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing || isLoading ? 'animate-spin' : ''}`} />
                  {isSyncing || isLoading ? 'Syncing...' : 'Sync'}
                </Button>
              </div>
            </div>
            
            <IntegrationsPanel />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Top Hero - Daily Summary */}
          <div className="col-span-1 md:col-span-2 h-[280px]">
            <DailySummary />
          </div>

          {/* Left Column - Priority Inbox */}
          <div className="col-span-1 h-[500px]">
            <PriorityInbox />
          </div>

          {/* Right Column - Schedule */}
          <div className="col-span-1 h-[500px]">
            <ScheduleCard />
          </div>

        </div>
      </div>
    </div>
  );
}
