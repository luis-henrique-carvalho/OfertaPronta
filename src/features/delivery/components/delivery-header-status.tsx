import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Sparkles, Store } from "lucide-react";

export interface DeliveryHeaderStatusProps {
  offerTitle: string;
  businessName?: string | null;
  businessSegment?: string | null;
  className?: string;
}

export function DeliveryHeaderStatus({
  offerTitle,
  businessName,
  businessSegment,
  className,
}: DeliveryHeaderStatusProps) {
  return (
    <Card
      className={`w-full overflow-hidden border-primary/20 bg-gradient-to-b from-primary/10 via-background to-card shadow-sm ${className ?? ""}`}
    >
      <CardContent className="flex flex-col items-center gap-3 p-5 text-center sm:p-6">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 ring-4 ring-emerald-500/20">
          <CheckCircle2 className="size-8" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge
            variant="secondary"
            className="gap-1.5 px-3 py-0.5 text-xs font-bold"
          >
            <Sparkles className="size-3 text-primary" />
            <span>Pagamento Confirmado</span>
          </Badge>
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/5 px-2.5 py-0.5 text-[11px] font-semibold text-foreground"
          >
            <span>Artes Liberadas em HD</span>
          </Badge>
        </div>

        <div className="flex flex-col gap-1">
          <Typography
            variant="h2"
            className="text-xl font-black tracking-tight sm:text-2xl"
          >
            {offerTitle}
          </Typography>

          {businessName && (
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <Store className="size-3.5" />
              <Typography variant="muted" className="text-xs font-medium">
                {businessName}
                {businessSegment ? ` • ${businessSegment}` : ""}
              </Typography>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
