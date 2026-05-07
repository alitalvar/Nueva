import { Badge } from "@/components/ui/badge";
import type { Priority, Status } from "@/lib/projects-data";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const map: Record<Status, string> = {
    Done: "bg-success text-success-foreground hover:bg-success/90",
    Ongoing: "bg-warning text-warning-foreground hover:bg-warning/90",
    "Not Started": "bg-muted text-muted-foreground hover:bg-muted/90",
    Select: "bg-muted text-muted-foreground",
  };
  return <Badge className={cn("rounded-full px-3", map[status], className)}>{status}</Badge>;
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const map: Record<Priority, string> = {
    P0: "bg-[var(--priority-p0)] text-[var(--priority-p0-foreground)] hover:bg-[var(--priority-p0)]/90",
    P1: "bg-[var(--priority-p1)] text-[var(--priority-p1-foreground)] hover:bg-[var(--priority-p1)]/90",
    P2: "bg-[var(--priority-p2)] text-[var(--priority-p2-foreground)] hover:bg-[var(--priority-p2)]/90",
    P3: "bg-[var(--priority-p3)] text-[var(--priority-p3-foreground)] hover:bg-[var(--priority-p3)]/90",
  };
  return (
    <Badge className={cn("rounded-full px-2 py-0 text-[10px] font-bold tracking-wider", map[priority], className)}>
      {priority}
    </Badge>
  );
}

export function MemberAvatar({
  name,
  avatarUrl,
  size = "sm",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
}) {
  if (avatarUrl) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-card pr-3 ring-2 ring-background",
          size === "sm" ? "h-7 text-[11px]" : "h-9 text-xs",
        )}
        title={name}
      >
        <img
          src={avatarUrl}
          alt={name}
          className={cn("aspect-square h-full rounded-full object-cover", size === "sm" ? "w-7" : "w-9")}
        />
        <span className="font-semibold">{name}</span>
      </span>
    );
  }
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[var(--gradient-primary)] px-3 font-bold text-red-950 ring-2 ring-background whitespace-nowrap",
        size === "sm" ? "h-7 text-[11px]" : "h-9 text-xs",
      )}
      title={name}
    >
      {name}
    </div>
  );
}
