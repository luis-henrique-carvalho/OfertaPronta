import { useState, useEffect } from "react";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export interface RegenerationCountdownTimerProps {
  windowEndsAt: string;
  onExpire?: () => void;
  className?: string;
}

function formatRemainingTime(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RegenerationCountdownTimer({
  windowEndsAt,
  onExpire,
  className,
}: RegenerationCountdownTimerProps) {
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const end = new Date(windowEndsAt).getTime();
    return Math.max(0, end - Date.now());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const end = new Date(windowEndsAt).getTime();
      const diff = Math.max(0, end - Date.now());
      setRemainingMs(diff);
      if (diff <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [windowEndsAt, onExpire]);

  const isExpired = remainingMs <= 0;

  if (isExpired) {
    return (
      <Badge
        variant="outline"
        className={`gap-1.5 border-muted-foreground/30 px-2.5 py-1 text-xs text-muted-foreground ${className ?? ""}`}
      >
        <Clock className="size-3.5" />
        <span>Janela de 30 min encerrada</span>
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
      <Badge
        variant="secondary"
        className="gap-1.5 px-2.5 py-1 text-xs font-semibold"
      >
        <Clock className="size-3.5 text-primary" />
        <Typography
          variant="muted"
          className="text-xs font-bold text-foreground"
        >
          {formatRemainingTime(remainingMs)} restantes
        </Typography>
      </Badge>
    </div>
  );
}
