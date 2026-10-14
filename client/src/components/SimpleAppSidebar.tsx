import React from "react";
import { MapPin, Users, FileText, Plus, Database, LayoutDashboard, LogOut, Navigation, Eye, UserCheck, KeyRound, DraftingCompass } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import RealtimeStatusIndicator from "@/components/RealtimeStatusIndicator";
import { authApi } from "@/services/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type NavItem = { label: string; icon: any; path: string };

interface SidebarProps {
  className?: string;
}

const SimpleAppSidebar: React.FC<SidebarProps> = ({ className = "" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, clearSession } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isCustomer = user?.role === "CUSTOMER";
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [savingPassword, setSavingPassword] = React.useState(false);

  const navItems: NavItem[] = isCustomer
    ? [
        { label: "Dashboard", icon: LayoutDashboard, path: "/" },
        { label: "My Properties", icon: MapPin, path: "/ventures" },
        { label: "Plot Updates", icon: Navigation, path: "/live-tracking" }
      ]
    : [
        ...(isAdmin
          ? [
              { label: "Overview", icon: Eye, path: "/" },
              { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
              { label: "Employee access", icon: UserCheck, path: "/employee-access" }
            ]
          : [{ label: "Dashboard", icon: LayoutDashboard, path: "/" }]),
        { label: "Venture Locations", icon: MapPin, path: "/ventures" },
        { label: "Track Customers", icon: Users, path: "/track-customers" },
        { label: "Live Tracking", icon: Navigation, path: "/live-tracking" },
        { label: "Reports", icon: FileText, path: "/reports" },
        { label: "New Venture", icon: Plus, path: "/new-venture" },
        { label: "Layout Editor", icon: DraftingCompass, path: "/layout-editor" },
        { label: "Total Data", icon: Database, path: "/total-data" }
      ];

  const handleLogout = () => {
    logout()
      .then(() => {
        toast.success("Logged out successfully!");
        navigate("/backend-auth");
      })
      .catch(() => {
        toast.error("Failed to log out");
      });
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Please fill current and new password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success("Password updated successfully");
      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      await clearSession();
      navigate("/backend-auth");
    } catch (error: any) {
      toast.error(error?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <aside className={`w-64 min-h-screen bg-sidebar flex flex-col ${className}`}>
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
            <p className="text-sidebar-foreground/60 text-xs capitalize">{user?.role?.toLowerCase() || "user"}</p>
          </div>
        </div>
        <div className="mt-3 px-2">
          <RealtimeStatusIndicator />
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
          onClick={() => setPasswordDialogOpen(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all w-full"
        >
          <KeyRound className="w-5 h-5" />
          Change Password
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setPasswordDialogOpen(false)}
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
};

export default SimpleAppSidebar;
