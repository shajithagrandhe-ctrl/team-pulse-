import { MapPin, Users, FileText, TrendingUp, Home, DraftingCompass, PlusSquare, Navigation, ArrowRight, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { customerApi, statsApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatINRTextToUnits } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: statsResponse } = useQuery({
    queryKey: ["stats"],
    queryFn: statsApi.get
  });

  const { data: customersResponse } = useQuery({
    queryKey: ["customers", 1],
    queryFn: () => customerApi.list(1, 4)
  });

  const statsData = statsResponse?.data;
  const recentCustomers = customersResponse?.data ?? [];
  const available = statsData?.plotsByStatus.available ?? 0;
  const advance = statsData?.plotsByStatus.advance ?? 0;
  const sold = statsData?.plotsByStatus.sold ?? 0;
  const totalPlots = statsData?.plots ?? 0;
  const occupancyRate = totalPlots > 0 ? Math.round(((advance + sold) / totalPlots) * 100) : 0;

  const stats = [
    { label: "Total Locations", value: statsData?.locations ?? 0, icon: MapPin, accent: "text-sky-600", chip: "bg-sky-100", onClick: () => navigate("/ventures") },
    { label: "Total Plots", value: totalPlots, icon: TrendingUp, accent: "text-indigo-600", chip: "bg-indigo-100", onClick: () => navigate("/ventures") },
    { label: "Employees", value: statsData?.employees ?? 0, icon: Users, accent: "text-emerald-600", chip: "bg-emerald-100", onClick: () => navigate("/reports") },
    { label: "Customers", value: statsData?.customers ?? 0, icon: FileText, accent: "text-amber-600", chip: "bg-amber-100", onClick: () => navigate("/total-data") }
  ];

  const quickActions = user?.role === "CUSTOMER"
    ? [
        { label: "My Properties", hint: "Browse assigned ventures and plots", icon: MapPin, onClick: () => navigate("/ventures") },
        { label: "Track Updates", hint: "Open the live customer tracking screen", icon: Navigation, onClick: () => navigate("/live-tracking") }
      ]
    : [
        { label: "New Venture", hint: "Create a new venture and generate plots", icon: PlusSquare, onClick: () => navigate("/new-venture") },
        { label: "Layout Editor", hint: "Map venture layouts and plot positions", icon: DraftingCompass, onClick: () => navigate("/layout-editor") },
        { label: "Live Tracking", hint: "Monitor customer movement and updates", icon: Navigation, onClick: () => navigate("/live-tracking") }
      ];

  return (
    <div className="p-8 space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.55fr,1fr]">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-950/85 via-slate-900/80 to-sky-950/80 p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.16),transparent_25%)]" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="section-kicker text-sky-200/80">Overview</p>
                  <h1 className="mt-2 text-3xl font-bold text-white">
                    {user?.role === "ADMIN" ? "Operations overview" : "Dashboard"}
                  </h1>
                  <p className="mt-2 text-sm text-slate-200/80">
                    Welcome back, {user?.displayName || "User"}. Here&apos;s a quick snapshot of locations, plots, and customer activity.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Available</div>
                      <div className="mt-2 text-2xl font-bold text-white">{available}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Advance</div>
                      <div className="mt-2 text-2xl font-bold text-white">{advance}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Sold</div>
                      <div className="mt-2 text-2xl font-bold text-white">{sold}</div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:w-[280px]">
                  <button
                    onClick={() => navigate("/ventures")}
                    className="rounded-2xl border border-white/10 bg-white/10 p-4 text-left backdrop-blur-sm transition hover:bg-white/15"
                  >
                    <div className="flex items-center justify-between">
                      <Home className="h-5 w-5 text-sky-200" />
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="mt-4 text-sm font-semibold text-white">Open Inventory</div>
                    <div className="mt-1 text-xs text-slate-300">See locations, ventures, and plot availability.</div>
                  </button>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <Activity className="h-5 w-5 text-amber-200" />
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-slate-200">
                        {occupancyRate}%
                      </span>
                    </div>
                    <div className="mt-4 text-sm font-semibold text-white">Occupancy Rate</div>
                    <div className="mt-1 text-xs text-slate-300">Booked and advance plots against total inventory.</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-white/40 px-4 py-4 text-left transition hover:border-primary/40 hover:bg-white/55"
              >
                <div>
                  <p className="font-medium text-card-foreground">{action.label}</p>
                  <p className="mt-1 text-xs text-slate-600">{action.hint}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="rounded-xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-card-foreground">{stat.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.chip}`}>
                <stat.icon className={`h-5 w-5 ${stat.accent}`} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr,1.1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">Plot Status</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <span className="text-xl font-bold text-emerald-700">{available}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-emerald-900">Available</p>
              <p className="text-xs text-emerald-700/80">Ready to sell</p>
            </div>
            <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 p-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <span className="text-xl font-bold text-amber-700">{advance}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-amber-900">Advance Paid</p>
              <p className="text-xs text-amber-700/80">Under process</p>
            </div>
            <div className="rounded-xl border border-rose-200/70 bg-rose-50/70 p-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
                <span className="text-xl font-bold text-rose-700">{sold}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-rose-900">Sold</p>
              <p className="text-xs text-rose-700/80">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">Recent Customers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCustomers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-slate-600">
                No recent customers found yet.
              </div>
            ) : (
              recentCustomers.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-white/35 px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{c.contactName}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {c.location} - {formatINRTextToUnits(c.budget)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      c.interested ? "bg-plot-available/10 text-plot-available" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {c.interested ? "Interested" : "Not Interested"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
