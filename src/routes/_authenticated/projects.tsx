import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  PRIORITIES,
  sortByPriorityThenDeadline,
  useProjects,
  type Priority,
  type Status,
  type TeamMember,
} from "@/lib/projects-data";
import { ManageMembersDialog } from "@/components/manage-members-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MemberAvatar, PriorityBadge, StatusBadge } from "@/components/status-badge";
import { NewProjectDialog } from "@/components/new-project-dialog";
import { Trash2, ChevronDown, Filter, X, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

type SortMode = "default" | "priority";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projects — Nueva™" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { projects, update, remove, members } = useProjects();
  const { isAdmin } = useAuth();
  const [clientFilter, setClientFilter] = useState<string>("__all");
  const [assignees, setAssignees] = useState<TeamMember[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<"__all" | Priority>("__all");
  const [statusFilter, setStatusFilter] = useState<"__all" | Status>("__all");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const clients = useMemo(() => {
    const set = new Map<string, string>();
    projects.forEach((p) => {
      const key = p.client.trim().toLowerCase();
      if (key && !set.has(key)) set.set(key, p.client.trim());
    });
    return Array.from(set.values()).sort();
  }, [projects]);

  const filtered = useMemo(() => {
    const result = projects.filter((p) => {
      if (clientFilter !== "__all" && p.client.trim().toLowerCase() !== clientFilter) return false;
      if (assignees.length > 0 && !assignees.some((a) => p.assignedTo.includes(a))) return false;
      if (priorityFilter !== "__all" && p.priority !== priorityFilter) return false;
      if (statusFilter !== "__all" && p.status !== statusFilter) return false;
      return true;
    });
    if (sortMode === "priority") {
      return [...result].sort(sortByPriorityThenDeadline);
    }
    return result;
  }, [projects, clientFilter, assignees, priorityFilter, statusFilter, sortMode]);

  const hasFilters =
    clientFilter !== "__all" || assignees.length > 0 || priorityFilter !== "__all" || statusFilter !== "__all" || sortMode !== "default";
  const clearFilters = () => {
    setClientFilter("__all");
    setAssignees([]);
    setPriorityFilter("__all");
    setStatusFilter("__all");
    setSortMode("default");
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Projects</h1>
          <p className="text-sm text-muted-foreground">All work, your spreadsheet — reimagined.</p>
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

        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              {assignees.length === 0 ? (
                <span className="text-muted-foreground">All members</span>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {assignees.map((m) => <MemberAvatar key={m} name={m} />)}
                  </div>
                  <span className="text-xs text-muted-foreground">{assignees.length}</span>
                </div>
              )}
              <ChevronDown className="h-3 w-3 opacity-60" />
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

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as "__all" | Priority)}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                <span className="flex items-center gap-2"><PriorityBadge priority={p} /></span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        <Button
          variant={statusFilter === "Not Started" ? "default" : "outline"}
          size="sm"
          className="h-9"
          onClick={() => setStatusFilter(statusFilter === "Not Started" ? "__all" : "Not Started")}
        >
          Not Started only
        </Button>

        <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
          <SelectTrigger className="h-9 w-[180px]">
            <span className="flex items-center gap-1.5"><ArrowUpDown className="h-3.5 w-3.5" /><SelectValue /></span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default order</SelectItem>
            <SelectItem value="priority">Priority + Deadline</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>{filtered.length} of {projects.length}</span>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No projects match your filters.
          </div>
        )}
        {filtered.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-1.5">
                  <PriorityBadge priority={p.priority} />
                  <div className="text-xs font-medium uppercase tracking-wide text-primary">{p.client}</div>
                </div>
                <div className="font-semibold">{p.project}</div>
                {p.assignedTo.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {p.assignedTo.map((m) => (
                      <MemberAvatar key={m} name={m} />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Select value={p.status} onValueChange={(v) => update(p.id, { status: v as Status })}>
                  <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={p.priority} onValueChange={(v) => update(p.id, { priority: v as Priority })}>
                  <SelectTrigger className="h-7 w-[80px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((pr) => (
                      <SelectItem key={pr} value={pr}><PriorityBadge priority={pr} /></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Start: <span className="text-foreground">{p.startDate || "—"}</span></div>
              <div>Deadline: <span className="text-foreground">{p.deadline || "—"}</span></div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              {isAdmin ? (
                <AssigneePicker value={p.assignedTo} onChange={(v) => update(p.id, { assignedTo: v })} />
              ) : (
                <div className="flex flex-wrap gap-1">
                  {p.assignedTo.map((m) => (
                    <MemberAvatar key={m} name={m} />
                  ))}
                </div>
              )}
              {isAdmin && (
                <Button variant="ghost" size="icon" onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                {["Date", "Client", "Project", "Start", "Deadline", "Priority", "Status", "Assigned", ""].map((h) => (
                  <th key={h} className="px-3 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No projects match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-accent/30">
                  <td className="px-3 py-2">
                    <Input type="date" value={p.date} onChange={(e) => update(p.id, { date: e.target.value })} className="h-8 w-[140px]" disabled={!isAdmin} />
                  </td>
                  <td className="px-3 py-2">
                    <Input value={p.client} onChange={(e) => update(p.id, { client: e.target.value })} className="h-8 min-w-[160px]" disabled={!isAdmin} />
                  </td>
                  <td className="px-3 py-2">
                    <Input value={p.project} onChange={(e) => update(p.id, { project: e.target.value })} className="h-8 min-w-[180px]" disabled={!isAdmin} />
                  </td>
                  <td className="px-3 py-2">
                    <Input type="date" value={p.startDate} onChange={(e) => update(p.id, { startDate: e.target.value })} className="h-8 w-[140px]" disabled={!isAdmin} />
                  </td>
                  <td className="px-3 py-2">
                    <Input type="date" value={p.deadline} onChange={(e) => update(p.id, { deadline: e.target.value })} className="h-8 w-[140px]" disabled={!isAdmin} />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={p.priority} onValueChange={(v) => update(p.id, { priority: v as Priority })} disabled={!isAdmin}>
                      <SelectTrigger className="h-8 w-[90px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((pr) => (
                          <SelectItem key={pr} value={pr}><PriorityBadge priority={pr} /></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Select value={p.status} onValueChange={(v) => update(p.id, { status: v as Status })}>
                      <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started"><StatusBadge status="Not Started" /></SelectItem>
                        <SelectItem value="Ongoing"><StatusBadge status="Ongoing" /></SelectItem>
                        <SelectItem value="Done"><StatusBadge status="Done" /></SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    {isAdmin ? (
                      <AssigneePicker value={p.assignedTo} onChange={(v) => update(p.id, { assignedTo: v })} />
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {p.assignedTo.map((m) => (
                          <MemberAvatar key={m} name={m} />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => remove(p.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function AssigneePicker({ value, onChange }: { value: TeamMember[]; onChange: (v: TeamMember[]) => void }) {
  const members = useProjects((s) => s.members);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <span className="flex items-center gap-2">
            {value.length === 0 ? (
              <span className="text-muted-foreground">Assign</span>
            ) : (
              <span className="flex flex-wrap gap-1">
                {value.map((m) => (
                  <MemberAvatar key={m} name={m} />
                ))}
              </span>
            )}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        {members.length === 0 && (
          <div className="p-2 text-xs text-muted-foreground">No members yet. Add some in Team.</div>
        )}
        {members.map((m) => {
          const checked = value.includes(m);
          return (
            <label key={m} className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-accent">
              <Checkbox
                checked={checked}
                onCheckedChange={(c) => onChange(c ? [...value, m] : value.filter((x) => x !== m))}
              />
              <MemberAvatar name={m} />
            </label>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
