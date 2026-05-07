import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Table2, Users, Sparkles, LogOut, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/projects", label: "Projects", icon: Table2 },
  { to: "/team", label: "Team", icon: Users },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-[var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Nueva" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 text-xs text-primary-foreground/80 sm:flex">
              <Sparkles className="h-3.5 w-3.5" /> Project HQ
            </div>
            {isAdmin && (
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            )}
            <span className="hidden text-xs text-primary-foreground/80 md:inline">{user?.email}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSignOut}
              className="h-8 gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto max-w-7xl pb-2 px-0 flex flex-row gap-0">
          {nav.map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:flex-none",
                  active
                    ? "bg-white text-primary shadow-sm"
                    : "bg-white/90 text-primary hover:bg-white",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6">{children}</main>
    </div>
  );
}
