import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjects } from "@/lib/projects-data";
import { MemberAvatar } from "@/components/status-badge";
import { Pencil, Trash2, Plus, Check, X, UserCog, Camera, ImageOff } from "lucide-react";

export function ManageMembersDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { members, memberAvatars, addMember, renameMember, removeMember, setMemberAvatar, removeMemberAvatar } = useProjects();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingMemberRef = useRef<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addMember(newName);
    setNewName("");
  };

  const startEdit = (name: string) => {
    setEditing(name);
    setEditValue(name);
  };

  const saveEdit = () => {
    if (editing) renameMember(editing, editValue);
    setEditing(null);
    setEditValue("");
  };

  const triggerPhoto = (name: string) => {
    pendingMemberRef.current = name;
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const name = pendingMemberRef.current;
    e.target.value = "";
    if (!file || !name) return;
    setUploadingFor(name);
    await setMemberAvatar(name, file);
    setUploadingFor(null);
    pendingMemberRef.current = null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <UserCog className="h-4 w-4" /> Manage Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Team Members</DialogTitle>
        </DialogHeader>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add a teammate"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} className="gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        <div className="mt-2 grid gap-2">
          {members.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No members yet.
            </div>
          )}
          {members.map((m) => (
            <div key={m} className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
              <MemberAvatar name={editing === m ? editValue || m : m} avatarUrl={memberAvatars[m]} />
              {editing === m ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") setEditing(null);
                    }}
                    className="h-8 flex-1"
                    autoFocus
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveEdit}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{m}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => triggerPhoto(m)}
                    disabled={uploadingFor === m}
                    title="Upload profile photo"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </Button>
                  {memberAvatars[m] && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMemberAvatar(m)}
                      title="Remove photo"
                    >
                      <ImageOff className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(m)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMember(m)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}