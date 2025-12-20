import { DailySummary } from "@/components/briefing/daily-summary";
import { PriorityInbox } from "@/components/briefing/priority-inbox";
import { ScheduleCard } from "@/components/briefing/schedule-card";
import { IntegrationsPanel } from "@/components/briefing/integrations-panel";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-muted/20 p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        
        {/* Left Sidebar - Profile & Integrations */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="sticky top-6">
            <div className="mb-8 pl-1">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-primary">Briefing<span className="text-amber-600">.ai</span></h1>
              <p className="text-sm text-muted-foreground">Executive Intelligence Agent</p>
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
