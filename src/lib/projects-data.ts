import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

export type Status = "Done" | "Ongoing" | "Not Started" | "Select";
export type TeamMember = string;
export type Priority = "P0" | "P1" | "P2" | "P3";
export const PRIORITIES: Priority[] = ["P0", "P1", "P2", "P3"];
export const PRIORITY_RANK: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

export interface Project {
  id: string;
  date: string;
  client: string;
  project: string;
  description: string;
  startDate: string;
  deadline: string;
  status: Status;
  priority: Priority;
  assignedTo: TeamMember[];
}

export function sortByPriorityThenDeadline(a: Project, b: Project): number {
  const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (pr !== 0) return pr;
  const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
  const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
  return ad - bd;
}

interface MemberRow {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface ProjectsState {
  projects: Project[];
  members: TeamMember[];
  memberMap: Record<string, string>; // name -> id
  memberAvatars: Record<string, string | null>; // name -> avatar_url
  loading: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  add: (p: Omit<Project, "id">) => Promise<void>;
  update: (id: string, patch: Partial<Project>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setStatus: (id: string, status: Status) => Promise<void>;
  addMember: (name: string) => Promise<void>;
  renameMember: (oldName: string, newName: string) => Promise<void>;
  removeMember: (name: string) => Promise<void>;
  setMemberAvatar: (name: string, file: File) => Promise<void>;
  removeMemberAvatar: (name: string) => Promise<void>;
}

async function fetchAll(): Promise<{ projects: Project[]; members: MemberRow[] }> {
  const [projectsRes, membersRes, assigneesRes] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("members").select("id, name, avatar_url").order("name"),
    supabase.from("project_assignees").select("project_id, members(name)"),
  ]);
  if (projectsRes.error) throw projectsRes.error;
  if (membersRes.error) throw membersRes.error;
  if (assigneesRes.error) throw assigneesRes.error;

  const assigneeMap = new Map<string, TeamMember[]>();
  for (const row of assigneesRes.data ?? []) {
    const name = (row.members as { name: string } | null)?.name;
    if (!name) continue;
    const list = assigneeMap.get(row.project_id) ?? [];
    list.push(name);
    assigneeMap.set(row.project_id, list);
  }

  const projects: Project[] = (projectsRes.data ?? []).map((p) => ({
    id: p.id,
    date: p.date ?? "",
    client: p.client,
    project: p.project,
    description: p.description ?? "",
    startDate: p.start_date ?? "",
    deadline: p.deadline ?? "",
    status: p.status as Status,
    priority: p.priority as Priority,
    assignedTo: assigneeMap.get(p.id) ?? [],
  }));

  return { projects, members: membersRes.data ?? [] };
}

async function syncAssignees(projectId: string, names: TeamMember[], memberMap: Record<string, string>) {
  // Delete existing then insert new (simple, atomic enough for low-volume)
  await supabase.from("project_assignees").delete().eq("project_id", projectId);
  if (names.length === 0) return;
  const rows = names
    .map((n) => memberMap[n])
    .filter(Boolean)
    .map((member_id) => ({ project_id: projectId, member_id }));
  if (rows.length) await supabase.from("project_assignees").insert(rows);
}

export const useProjects = create<ProjectsState>()((set, get) => ({
  projects: [],
  members: [],
  memberMap: {},
  memberAvatars: {},
  loading: false,
  loaded: false,

  load: async () => {
    set({ loading: true });
    try {
      const { projects, members } = await fetchAll();
      const memberMap: Record<string, string> = {};
      const memberAvatars: Record<string, string | null> = {};
      members.forEach((m) => {
        memberMap[m.name] = m.id;
        memberAvatars[m.name] = m.avatar_url;
      });
      set({
        projects,
        members: members.map((m) => m.name),
        memberMap,
        memberAvatars,
        loading: false,
        loaded: true,
      });
    } catch (e) {
      console.error("Failed to load projects", e);
      set({ loading: false, loaded: true });
    }
  },

  add: async (p) => {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        date: p.date || null,
        client: p.client,
        project: p.project,
        description: p.description || null,
        start_date: p.startDate || null,
        deadline: p.deadline || null,
        status: p.status,
        priority: p.priority,
      })
      .select()
      .single();
    if (error || !data) {
      console.error("Insert project failed", error);
      return;
    }
    await syncAssignees(data.id, p.assignedTo, get().memberMap);
    await get().load();
  },

  update: async (id, patch) => {
    type ProjectsUpdate = {
      date?: string | null;
      client?: string;
      project?: string;
      description?: string | null;
      start_date?: string | null;
      deadline?: string | null;
      status?: string;
      priority?: string;
    };
    const dbPatch: ProjectsUpdate = {};
    if (patch.date !== undefined) dbPatch.date = patch.date || null;
    if (patch.client !== undefined) dbPatch.client = patch.client;
    if (patch.project !== undefined) dbPatch.project = patch.project;
    if (patch.description !== undefined) dbPatch.description = patch.description || null;
    if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate || null;
    if (patch.deadline !== undefined) dbPatch.deadline = patch.deadline || null;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.priority !== undefined) dbPatch.priority = patch.priority;

    if (Object.keys(dbPatch).length > 0) {
      const { error } = await supabase.from("projects").update(dbPatch).eq("id", id);
      if (error) {
        console.error("Update project failed", error);
        return;
      }
    }
    if (patch.assignedTo !== undefined) {
      await syncAssignees(id, patch.assignedTo, get().memberMap);
    }
    // Optimistic local update
    set((s) => ({
      projects: s.projects.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  },

  remove: async (id) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      console.error("Delete project failed", error);
      return;
    }
    set((s) => ({ projects: s.projects.filter((x) => x.id !== id) }));
  },

  setStatus: async (id, status) => {
    await get().update(id, { status });
  },

  addMember: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (get().members.some((m) => m.toLowerCase() === trimmed.toLowerCase())) return;
    const { data, error } = await supabase.from("members").insert({ name: trimmed }).select().single();
    if (error || !data) {
      console.error("Add member failed", error);
      return;
    }
    set((s) => ({
      members: [...s.members, data.name],
      memberMap: { ...s.memberMap, [data.name]: data.id },
    }));
  },

  renameMember: async (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = get().memberMap[oldName];
    if (!id) return;
    if (get().members.some((m) => m.toLowerCase() === trimmed.toLowerCase() && m !== oldName)) return;
    const { error } = await supabase.from("members").update({ name: trimmed }).eq("id", id);
    if (error) {
      console.error("Rename member failed", error);
      return;
    }
    await get().load();
  },

  removeMember: async (name) => {
    const id = get().memberMap[name];
    if (!id) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      console.error("Remove member failed", error);
      return;
    }
    await get().load();
  },

  setMemberAvatar: async (name, file) => {
    const id = get().memberMap[name];
    if (!id) return;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (upErr) {
      console.error("Avatar upload failed", upErr);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error } = await supabase.from("members").update({ avatar_url: url }).eq("id", id);
    if (error) {
      console.error("Update avatar_url failed", error);
      return;
    }
    set((s) => ({ memberAvatars: { ...s.memberAvatars, [name]: url } }));
  },

  removeMemberAvatar: async (name) => {
    const id = get().memberMap[name];
    if (!id) return;
    const { error } = await supabase.from("members").update({ avatar_url: null }).eq("id", id);
    if (error) {
      console.error("Remove avatar failed", error);
      return;
    }
    set((s) => ({ memberAvatars: { ...s.memberAvatars, [name]: null } }));
  },
}));
