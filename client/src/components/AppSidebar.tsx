import { MapPin, Users, FileText, Plus, Database, LayoutDashboard, LogOut, Eye } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = { label: string; icon: any; path: string };

const AppSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const navItems: NavItem[] = [
    ...(isAdmin
      ? [
          { label: "Overview", icon: Eye, path: "/" },
          { label: "Dashboard", icon: LayoutDashboard, path: "/admin" }
        ]
      : [{ label: "Dashboard", icon: LayoutDashboard, path: "/" }]),
    { label: "Venture Locations", icon: MapPin, path: "/ventures" },
    { label: "Track Customers", icon: Users, path: "/track-customers" },
    { label: "Reports", icon: FileText, path: "/reports" },
    { label: "New Venture", icon: Plus, path: "/new-venture" },
    { label: "Total Data", icon: Database, path: "/total-data" }
  ];

  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground font-bold text-lg">
            V
          </div>
          <div>
            <h1 className="text-sidebar-foreground font-bold text-lg leading-tight">Venture Plus</h1>
            <p className="text-sidebar-foreground/70 text-xs">For a Better Tomorrow</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground text-sm font-semibold">
            {initials}
          </div>
          <div>
            <p className="text-sidebar-foreground text-sm font-medium">{user?.displayName || "User"}</p>
            <p className="text-sidebar-foreground/60 text-xs capitalize">{user?.role?.toLowerCase() || "agent"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const currentPath = `${location.pathname}${location.search || ""}`;
          const isExact = currentPath === item.path;
          const isPrefixMatch = !item.path.includes("?") && item.path !== "/" && location.pathname.startsWith(item.path);
          const isActive = isExact || isPrefixMatch;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
