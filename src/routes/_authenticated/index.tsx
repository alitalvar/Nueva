import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useProjects, sortByPriorityThenDeadline, type Status, type TeamMember } from "@/lib/projects-data";
import { Card } from "@/components/ui/card";
import { MemberAvatar, PriorityBadge, StatusBadge } from "@/components/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { NewProjectDialog } from "@/components/new-project-dialog";
import { ManageMembersDialog } from "@/components/manage-members-dialog";
import { useAuth } from "@/lib/auth-context";
import { CalendarDays, ChevronDown, Filter, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "NUEVA PROJECT MANAGEMENT — Nueva™" }] }),
  component: Dashboard,
});

const COLUMNS: { key: Status; label: string; tint: string }[] = [
  { key: "Not Started", label: "Not Started", tint: "from-muted/30" },
  { key: "Ongoing", label: "Ongoing", tint: "from-warning/15" },
  { key: "Done", label: "Done", tint: "from-success/15" },
];

function Dashboard() {
  const { projects, members, setStatus } = useProjects();
  const { isAdmin } = useAuth();

  const [assignees, setAssignees] = useState<TeamMember[]>([]);
  const [statusFilter, setStatusFilter] = useState<"__all" | Status>("__all");

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (assignees.length > 0 && !assignees.some((a) => p.assignedTo.includes(a))) return false;
      if (statusFilter !== "__all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [projects, assignees, statusFilter]);

  const counts = {
    notStarted: filtered.filter((p) => p.status === "Not Started").length,
    ongoing: filtered.filter((p) => p.status === "Ongoing").length,
    done: filtered.filter((p) => p.status === "Done").length,
  };

  const hasFilters = assignees.length > 0 || statusFilter !== "__all";
  const visibleColumns = statusFilter === "__all" ? COLUMNS : COLUMNS.filter((c) => c.key === statusFilter);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">NUEVA PROJECT MANAGEMENT</h1>
          <p className="text-sm text-muted-foreground">Do What Matters!</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <ManageMembersDialog />
            <NewProjectDialog />
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filter
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <span className="flex items-center gap-2">
                {assignees.length === 0 ? (
                  <span className="text-muted-foreground">All members</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="flex -space-x-2">
                      {assignees.map((m) => <MemberAvatar key={m} name={m} />)}
                    </span>
                    <span className="text-xs text-muted-foreground">{assignees.length}</span>
                  </span>
                )}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2">
            {members.length === 0 && (
              <div className="p-2 text-xs text-muted-foreground">No members yet.</div>
            )}
            {members.map((m) => {
              const checked = assignees.includes(m);
              return (
                <label key={m} className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-accent">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) =>
                      setAssignees(c ? [...assignees, m] : assignees.filter((x) => x !== m))
                    }
                  />
                  <MemberAvatar name={m} />
                </label>
              );
            })}
          </PopoverContent>
        </Popover>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "__all" | Status)}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All statuses</SelectItem>
            <SelectItem value="Not Started">Not Started</SelectItem>
            <SelectItem value="Ongoing">Ongoing</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>{filtered.length} of {projects.length}</span>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1"
              onClick={() => {
                setAssignees([]);
                setStatusFilter("__all");
              }}
            >
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Not Started" value={counts.notStarted} accent="bg-muted text-foreground" />
        <StatCard label="Ongoing" value={counts.ongoing} accent="bg-warning/15 text-warning-foreground" />
        <StatCard label="Done" value={counts.done} accent="bg-success/15 text-success-foreground" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visibleColumns.map((col) => {
          const items = filtered.filter((p) => p.status === col.key).sort(sortByPriorityThenDeadline);
          return (
            <div key={col.key} className={`rounded-xl border border-border bg-gradient-to-b ${col.tint} to-transparent p-3`}>
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={col.key} />
                  <span className="text-sm text-muted-foreground">{items.length}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Nothing here
                  </div>
                )}
                {items.map((p) => (
                  <Card key={p.id} className="p-3 transition-shadow hover:shadow-[var(--shadow-elegant)]">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-1.5">
                          <PriorityBadge priority={p.priority} />
                          <div className="text-xs font-medium uppercase tracking-wide text-primary truncate">{p.client}</div>
                        </div>
                        <div className="font-semibold leading-tight">{p.project}</div>
                      </div>
                      <Select value={p.status} onValueChange={(v) => setStatus(p.id, v as Status)}>
                        <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="Ongoing">Ongoing</SelectItem>
                          <SelectItem value="Done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {p.assignedTo.map((m) => (
                          <MemberAvatar key={m} name={m} />
                        ))}
                      </div>
                      {p.deadline && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" /> {p.deadline}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card className={`p-4 ${accent} border-0`}>
      <div className="text-xs font-medium opacity-90">{label}</div>
      <div className="text-2xl font-bold sm:text-3xl">{value}</div>
    </Card>
  );
}
