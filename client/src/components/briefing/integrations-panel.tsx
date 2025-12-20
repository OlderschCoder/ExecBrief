import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Calendar, Video, CheckCircle2, RotateCw } from "lucide-react";
import cioAvatar from "@assets/generated_images/professional_executive_portrait.png";

export function IntegrationsPanel() {
  return (
    <Card className="p-4 bg-muted/30 border-none">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
          <AvatarImage src={cioAvatar} alt="Dr. Reynolds" />
          <AvatarFallback>DR</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-serif font-semibold text-foreground">Dr. Reynolds</h3>
          <p className="text-xs text-muted-foreground">Chief Information Officer</p>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-background">
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Integrations</h4>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Outlook</div>
              <div className="text-[10px] text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Synced
              </div>
            </div>
          </div>
          <Switch checked={true} />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Gmail</div>
              <div className="text-[10px] text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Synced
              </div>
            </div>
          </div>
          <Switch checked={true} />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Teams</div>
              <div className="text-[10px] text-muted-foreground">Last sync: 2m ago</div>
            </div>
          </div>
          <Switch checked={true} />
        </div>
      </div>
    </Card>
  );
}
