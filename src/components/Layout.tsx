import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, ListTodo, BarChart3, Settings, Coins, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/tasks", icon: ListTodo, label: "Tasks" },
  { to: "/statistics", icon: BarChart3, label: "Statistics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const Layout = () => {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-card p-4">
        <div className="flex items-center gap-2 px-2 mb-8">
          <Coins className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold">TaskScore</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <Button variant="ghost" className="justify-start gap-3 text-muted-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile nav */}
        <nav className="flex md:hidden items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold">TaskScore</span>
          </div>
          <div className="flex gap-1">
            {navItems.map(({ to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "p-2 rounded-md transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )
                }
              >
                <Icon className="h-5 w-5" />
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
