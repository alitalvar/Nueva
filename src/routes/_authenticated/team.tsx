import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useProjects, sortByPriorityThenDeadline, type Status, type TeamMember } from "@/lib/projects-data";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberAvatar, PriorityBadge, StatusBadge } from "@/components/status-badge";
import { ManageMembersDialog } from "@/components/manage-members-dialog";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { CalendarDays, ListOrdered } from "lucide-react";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [{ title: "Team — Nueva™" }] }),
  component: TeamPage,
});

function TeamPage() {
  const { projects, setStatus, members, memberAvatars } = useProjects();
  const { isAdmin } = useAuth();
  const [member, setMember] = useState<TeamMember | null>(members[0] ?? null);

  // Keep selection valid when members change (rename/remove)
  useEffect(() => {
    if (member && !members.includes(member)) {
      setMember(members[0] ?? null);
    } else if (!member && members.length > 0) {
      setMember(members[0]);
    }
  }, [members, member]);

  const mine = member ? projects.filter((p) => p.assignedTo.includes(member)) : [];
  const notStarted = [...mine.filter((p) => p.status === "Not Started")].sort(sortByPriorityThenDeadline);
  const queue = [...mine.filter((p) => p.status === "Ongoing")].sort(sortByPriorityThenDeadline);
  const done = mine.filter((p) => p.status === "Done");

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Queue</h1>
          <p className="text-sm text-muted-foreground">Tap your name — sorted by priority, then deadline.</p>
        </div>
        {isAdmin && <ManageMembersDialog />}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {members.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No team members yet. Use "Manage Team" to add some.
          </div>
        )}
        {members.map((m) => {
          const active = m === member;
          const count = projects.filter((p) => p.assignedTo.includes(m)).length;
          return (
            <button
              key={m}
              onClick={() => setMember(m)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all",
                active
                  ? "border-transparent bg-[var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)]"
                  : "border-border bg-card hover:bg-accent",
              )}
            >
              <MemberAvatar name={m} avatarUrl={memberAvatars[m]} />
              <span className={cn("rounded-full px-2 text-xs", active ? "bg-white/25" : "bg-muted text-muted-foreground")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {member && (
        <>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ListOrdered className="h-3.5 w-3.5" /> Next up — sorted by priority, then deadline
          </div>
          <Section title="Not Started" items={notStarted} setStatus={setStatus} empty="Nothing waiting to start." />
          <Section title="Ongoing" items={queue} setStatus={setStatus} empty="Nothing in progress 🎉" />
          <Section title="Done" items={done} setStatus={setStatus} empty="No completed tasks yet." />
        </>
      )}
    </AppShell>
  );
}

function Section({
  title,
  items,
  setStatus,
  empty,
}: {
  title: string;
  items: ReturnType<typeof useProjects.getState>["projects"];
  setStatus: (id: string, s: Status) => void;
  empty: string;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title} · {items.length}</h2>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{empty}</div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((p) => (
            <Card key={p.id} className="p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-1.5">
                    <PriorityBadge priority={p.priority} />
                    <div className="text-xs font-medium uppercase tracking-wide text-primary truncate">{p.client}</div>
                  </div>
                  <div className="font-semibold leading-tight">{p.project}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="flex items-center justify-between">
                {p.deadline ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" /> {p.deadline}
                  </div>
                ) : <span />}
                <Select value={p.status} onValueChange={(v) => setStatus(p.id, v as Status)}>
                  <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="Ongoing">Mark Ongoing</SelectItem>
                    <SelectItem value="Done">Mark Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
