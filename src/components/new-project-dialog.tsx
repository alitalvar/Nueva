import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { PRIORITIES, useProjects, type Priority, type Status, type TeamMember } from "@/lib/projects-data";
import { PriorityBadge } from "@/components/status-badge";

const PRIORITY_LABEL: Record<Priority, string> = {
  P0: "Urgent",
  P1: "High",
  P2: "Medium",
  P3: "Low",
};

export function NewProjectDialog() {
  const add = useProjects((s) => s.add);
  const members = useProjects((s) => s.members);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: "",
    client: "",
    project: "",
    description: "",
    startDate: "",
    deadline: "",
    status: "Ongoing" as Status,
    priority: "P2" as Priority,
    assignedTo: [] as TeamMember[],
  });

  const submit = () => {
    if (!form.client || !form.project) return;
    add(form);
    setOpen(false);
    setForm({ date: "", client: "", project: "", description: "", startDate: "", deadline: "", status: "Ongoing", priority: "P2", assignedTo: [] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 shadow-[var(--shadow-elegant)]">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Client</Label>
            <Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Client name" />
          </div>
          <div className="grid gap-1.5">
            <Label>Project</Label>
            <Input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} placeholder="Project title" />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief project description (optional)"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, date: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Deadline</Label>
              <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <PriorityBadge priority={p} /> {PRIORITY_LABEL[p]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Assigned To</Label>
            <div className="flex flex-wrap gap-3 rounded-md border border-input p-3">
              {members.map((m) => {
                const checked = form.assignedTo.includes(m);
                return (
                  <label key={m} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) =>
                        setForm({
                          ...form,
                          assignedTo: c ? [...form.assignedTo, m] : form.assignedTo.filter((x) => x !== m),
                        })
                      }
                    />
                    {m}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Create Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
