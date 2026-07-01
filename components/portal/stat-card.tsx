import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  /** "+12.5%" → verde | "-3.1%" → vermelho */
  trend?: string;
}) {
  const trendPositive = trend?.startsWith("+");
  const trendNegative = trend?.startsWith("-");

  return (
    <Card className="transition-shadow hover:shadow-card-hover">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: texto */}
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {value}
            </p>
            {(hint || trend) && (
              <p
                className={cn(
                  "text-xs",
                  trendPositive && "text-emerald-600 dark:text-emerald-400",
                  trendNegative && "text-red-500 dark:text-red-400",
                  !trendPositive && !trendNegative && "text-muted-foreground",
                )}
              >
                {trend && <span className="font-semibold">{trend} </span>}
                {hint}
              </p>
            )}
          </div>

          {/* Right: icon container */}
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
