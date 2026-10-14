import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import {
  statsApi,
  locationApi,
  ventureApi,
  customerApi,
  userApi,
  leadApi,
  type CustomerRecord,
  type Venture,
  type User,
  type Lead
} from "@/services/api";
import { formatINRUnits, parseINRText } from "@/lib/money";
import {
  Activity,
  Building,
  Database,
  FileText,
  LogOut,
  MapPin,
  PieChart,
  Shield,
  TrendingUp,
  UserCheck,
  Users
} from "lucide-react";

const numberFmt = (n: number) => new Intl.NumberFormat("en-IN").format(n || 0);
const percent = (n: number) => `${Math.round(n)}%`;
const moneyFmt = (n: number) => formatINRUnits(n, { prefix: "", suffix: " Units", decimals: 1, croreAsMillion: true });

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const isLoggedIn = user?.role === "ADMIN";
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: statsResponse } = useQuery({ queryKey: ["stats"], queryFn: statsApi.get, enabled: isLoggedIn });
  const { data: locationsResponse } = useQuery({ queryKey: ["locations"], queryFn: locationApi.list, enabled: isLoggedIn });
  const { data: venturesResponse } = useQuery({ queryKey: ["ventures", "all"], queryFn: () => ventureApi.list(), enabled: isLoggedIn });
  const { data: customersResponse } = useQuery({ queryKey: ["customers", "admin"], queryFn: () => customerApi.list(1, 1000), enabled: isLoggedIn });
  const { data: employeesResponse } = useQuery({ queryKey: ["employees", "admin"], queryFn: userApi.employees, enabled: isLoggedIn });
  const { data: leadsResponse } = useQuery({ queryKey: ["leads", "admin"], queryFn: () => leadApi.list(1, 1000), enabled: isLoggedIn });

  const stats = statsResponse?.data;
  const locations = locationsResponse?.data ?? [];
  const ventures = venturesResponse?.data ?? [];
  const customers = customersResponse?.data ?? [];
  const employees = employeesResponse?.data ?? [];
  const leads = leadsResponse?.data ?? [];

  const analytics = useMemo(() => {
    const totalLocations = stats?.locations ?? locations.length;
    const totalVentures = ventures.length || locations.reduce((sum, loc) => sum + loc.ventures.length, 0);
    const totalCustomers = stats?.customers ?? customers.length;
    const totalEmployees = stats?.employees ?? employees.length;
    const totalPlots = stats?.plots ?? ventures.reduce((sum, venture) => sum + (venture.plots?.length ?? 0), 0);
    const sold = stats?.plotsByStatus.sold ?? 0;
    const available = stats?.plotsByStatus.available ?? 0;
    const advance = stats?.plotsByStatus.advance ?? 0;

    const totalRecords = totalCustomers + totalEmployees + (stats?.leads ?? leads.length);
    const conversionRate = totalPlots > 0 ? (sold / totalPlots) * 100 : 0;
    const occupancyRate = totalPlots > 0 ? ((sold + advance) / totalPlots) * 100 : 0;

    const allPlots = ventures.flatMap((venture) => venture.plots ?? []);
    const getPlotValue = (plot: Venture["plots"][number]) => (plot?.area ?? 0) * (plot?.pricePerSqYard ?? 0);
    const totalPortfolioValue = allPlots.reduce((sum, plot) => sum + getPlotValue(plot), 0);
    const soldValue = allPlots.filter((plot) => plot.status === "SOLD").reduce((sum, plot) => sum + getPlotValue(plot), 0);
    const advanceValue = allPlots.filter((plot) => plot.status === "ADVANCE").reduce((sum, plot) => sum + getPlotValue(plot), 0);
    const availableInventoryValue = allPlots.filter((plot) => plot.status === "AVAILABLE").reduce((sum, plot) => sum + getPlotValue(plot), 0);

    const customerBudgetPool = customers.reduce((sum, c) => sum + (parseINRText(c.budget || "") ?? 0), 0);
    const bookedCustomers = customers.filter((c) => c.status === "BOOKED").length;
    const paidAdvanceCustomers = customers.filter((c) => c.status === "PAID_ADVANCE").length;

    return {
      totalLocations,
      totalVentures,
      totalCustomers,
      totalEmployees,
      totalPlots,
      sold,
      available,
      advance,
      totalRecords,
      conversionRate,
      occupancyRate,
      totalPortfolioValue,
      soldValue,
      advanceValue,
      availableInventoryValue,
      customerBudgetPool,
      bookedCustomers,
      paidAdvanceCustomers
    };
  }, [stats, locations, ventures, customers, employees, leads]);

  const locationUnitBreakdown = useMemo(() => {
    const byLocation = new Map<
      string,
      {
        locationId: string;
        locationName: string;
        ventures: Array<{
          ventureId: string;
          ventureName: string;
          totalUnits: number;
          soldUnits: number;
          advanceUnits: number;
          availableUnits: number;
          totalValue: number;
          soldValue: number;
          advanceValue: number;
          availableValue: number;
        }>;
      }
    >();

    ventures.forEach((venture) => {
      const locationId = venture.location?.id ?? "unknown";
      const locationName = venture.location?.name ?? "Unknown";
      const plots = venture.plots ?? [];
      const totalUnits = plots.length;
      const soldUnits = plots.filter((p) => p.status === "SOLD").length;
      const advanceUnits = plots.filter((p) => p.status === "ADVANCE").length;
      const availableUnits = plots.filter((p) => p.status === "AVAILABLE").length;
      const plotValue = (plot: (typeof plots)[number]) => (plot.area ?? 0) * (plot.pricePerSqYard ?? 0);
      const totalValue = plots.reduce((sum, p) => sum + plotValue(p), 0);
      const soldValue = plots.filter((p) => p.status === "SOLD").reduce((sum, p) => sum + plotValue(p), 0);
      const advanceValue = plots.filter((p) => p.status === "ADVANCE").reduce((sum, p) => sum + plotValue(p), 0);
      const availableValue = plots.filter((p) => p.status === "AVAILABLE").reduce((sum, p) => sum + plotValue(p), 0);

      const existing = byLocation.get(locationId) ?? { locationId, locationName, ventures: [] };
      existing.ventures.push({
        ventureId: venture.id,
        ventureName: venture.name,
        totalUnits,
        soldUnits,
        advanceUnits,
        availableUnits,
        totalValue,
        soldValue,
        advanceValue,
        availableValue
      });
      byLocation.set(locationId, existing);
    });

    return Array.from(byLocation.values())
      .sort((a, b) => a.locationName.localeCompare(b.locationName))
      .map((location) => {
        const totals = location.ventures.reduce(
          (acc, v) => {
            acc.totalUnits += v.totalUnits;
            acc.soldUnits += v.soldUnits;
            acc.advanceUnits += v.advanceUnits;
            acc.availableUnits += v.availableUnits;
            acc.totalValue += v.totalValue;
            acc.soldValue += v.soldValue;
            acc.advanceValue += v.advanceValue;
            acc.availableValue += v.availableValue;
            return acc;
          },
          {
            totalUnits: 0,
            soldUnits: 0,
            advanceUnits: 0,
            availableUnits: 0,
            totalValue: 0,
            soldValue: 0,
            advanceValue: 0,
            availableValue: 0
          }
        );

        return { ...location, ...totals };
      });
  }, [ventures]);

  const employeePerformance = useMemo(() => {
    return employees.map((employee) => {
      const assignedCustomers = customers.filter((c) => {
        const owner = (c.recordOwner || "").trim().toLowerCase();
        const leadName = (c.leadName || "").trim().toLowerCase();
        const fullName = (employee.fullName || "").trim().toLowerCase();
        const displayName = (employee.displayName || "").trim().toLowerCase();
        const email = (employee.email || "").trim().toLowerCase();
        return owner === fullName || owner === displayName || owner === email || leadName === fullName || leadName === displayName || leadName === email;
      });

      const totalCustomers = assignedCustomers.length;
      const hotLeads = assignedCustomers.filter((c) => c.status === "HOT_LEAD").length;
      const followingUp = assignedCustomers.filter((c) => c.status === "FOLLOWING_UP").length;
      const booked = assignedCustomers.filter((c) => c.status === "BOOKED").length;
      const paidAdvance = assignedCustomers.filter((c) => c.status === "PAID_ADVANCE").length;
      const conversionRate = totalCustomers > 0 ? (booked / totalCustomers) * 100 : 0;
      const unitPipeline = assignedCustomers.reduce((sum, c) => sum + (parseINRText(c.budget || "") ?? 0), 0);

      return {
        employeeId: employee.id,
        name: employee.fullName || employee.displayName || employee.email,
        department: employee.department || "-",
        position: employee.position || "-",
        totalCustomers,
        hotLeads,
        followingUp,
        paidAdvance,
        booked,
        conversionRate,
        unitPipeline
      };
    });
  }, [employees, customers]);

  const handleLogout = async () => {
    await logout();
    setActiveTab("dashboard");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Admin Access Required</CardTitle>
            <CardDescription>Please sign in with an admin account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => window.location.assign("/backend-auth")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-8">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-950/85 via-slate-900/80 to-indigo-950/80 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(192,132,252,0.14),transparent_22%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="section-kicker text-sky-200/80">Admin</p>
                <div className="mt-2 flex items-center gap-3">
                  <Shield className="h-8 w-8 text-sky-200" />
                  <div>
                    <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
                    <p className="text-sm text-slate-200/80">Central analytics across ventures, employees, and customers.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:w-[360px]">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Ventures</div>
                  <div className="mt-2 text-2xl font-bold text-white">{numberFmt(analytics.totalVentures)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Employees</div>
                  <div className="mt-2 text-2xl font-bold text-white">{numberFmt(analytics.totalEmployees)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Occupancy</div>
                  <div className="mt-2 text-2xl font-bold text-white">{percent(analytics.occupancyRate)}</div>
                </div>
              </div>
            </div>

            <div className="relative mt-6 flex justify-end">
              <Button onClick={handleLogout} variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <main className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-2 rounded-xl border border-white/20 bg-white/45 p-2 backdrop-blur-md md:grid-cols-4 xl:grid-cols-7">
            <TabsTrigger value="dashboard"><Activity className="w-4 h-4 mr-2" />Dashboard</TabsTrigger>
            <TabsTrigger value="locations"><MapPin className="w-4 h-4 mr-2" />Locations</TabsTrigger>
            <TabsTrigger value="ventures"><Building className="w-4 h-4 mr-2" />Ventures</TabsTrigger>
            <TabsTrigger value="customers"><UserCheck className="w-4 h-4 mr-2" />Customers</TabsTrigger>
            <TabsTrigger value="employees"><Users className="w-4 h-4 mr-2" />Employees</TabsTrigger>
            <TabsTrigger value="performance"><TrendingUp className="w-4 h-4 mr-2" />Performance</TabsTrigger>
            <TabsTrigger value="units"><PieChart className="w-4 h-4 mr-2" />Units</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Total Employees" value={numberFmt(analytics.totalEmployees)} icon={<Users className="w-6 h-6 text-blue-600" />} />
              <StatCard label="All Ventures" value={numberFmt(analytics.totalVentures)} icon={<Building className="w-6 h-6 text-green-600" />} />
              <StatCard label="Customers" value={numberFmt(analytics.totalCustomers)} icon={<UserCheck className="w-6 h-6 text-purple-600" />} />
              <StatCard label="Total Records" value={numberFmt(analytics.totalRecords)} icon={<Database className="w-6 h-6 text-orange-600" />} />
              <StatCard label="Portfolio Value" value={moneyFmt(analytics.totalPortfolioValue)} icon={<PieChart className="w-6 h-6 text-red-600" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Business Overview</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Row label="Active Ventures" value={numberFmt(analytics.totalVentures)} />
                  <Row label="Total Locations" value={numberFmt(analytics.totalLocations)} />
                  <Row label="Sold Plots" value={numberFmt(analytics.sold)} />
                  <Row label="Available Plots" value={numberFmt(analytics.available)} />
                  <Row label="Occupancy Rate" value={percent(analytics.occupancyRate)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Employee Overview</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Row label="Total Employees" value={numberFmt(analytics.totalEmployees)} />
                  <Row label="Total Leads" value={numberFmt(stats?.leads ?? leads.length)} />
                  <Row label="Customers" value={numberFmt(analytics.totalCustomers)} />
                  <Row label="Conversion" value={percent(analytics.conversionRate)} />
                  <Row label="Booked Customers" value={numberFmt(analytics.bookedCustomers)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Unit Overview</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Row label="Total Portfolio Value" value={moneyFmt(analytics.totalPortfolioValue)} />
                  <Row label="Sold Value" value={moneyFmt(analytics.soldValue)} />
                  <Row label="Advance Value" value={moneyFmt(analytics.advanceValue)} />
                  <Row label="Available Inventory Value" value={moneyFmt(analytics.availableInventoryValue)} />
                  <Row label="Customer Budget Pool" value={moneyFmt(analytics.customerBudgetPool)} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Locations</CardTitle>
                <CardDescription>Accurate live location stats</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Location</TableHead><TableHead>Ventures</TableHead><TableHead>Available</TableHead><TableHead>Sold</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {locations.map((loc) => {
                      const sold = loc.ventures.reduce((sum, v) => sum + (v.soldPlots ?? 0), 0);
                      const total = loc.ventures.reduce((sum, v) => sum + (v.plotCount ?? 0), 0);
                      return (
                        <TableRow key={loc.id}>
                          <TableCell className="font-medium">{loc.name}</TableCell>
                          <TableCell>{loc.ventures.length}</TableCell>
                          <TableCell>{loc.availablePlots ?? 0}</TableCell>
                          <TableCell>{sold}</TableCell>
                          <TableCell>{total}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ventures">
            <Card>
              <CardHeader>
                <CardTitle>All Ventures</CardTitle>
                <CardDescription>Accurate venture-level numbers</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Venture</TableHead><TableHead>Location</TableHead><TableHead>Total</TableHead><TableHead>Available</TableHead><TableHead>Advance</TableHead><TableHead>Sold</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {ventures.map((venture: Venture) => {
                      const plots = venture.plots ?? [];
                      const available = plots.filter((p) => p.status === "AVAILABLE").length;
                      const advance = plots.filter((p) => p.status === "ADVANCE").length;
                      const sold = plots.filter((p) => p.status === "SOLD").length;
                      return (
                        <TableRow key={venture.id}>
                          <TableCell className="font-medium">{venture.name}</TableCell>
                          <TableCell>{venture.location?.name ?? "-"}</TableCell>
                          <TableCell>{plots.length}</TableCell>
                          <TableCell>{available}</TableCell>
                          <TableCell>{advance}</TableCell>
                          <TableCell>{sold}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customers</CardTitle>
                <CardDescription>Latest customer records</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Location</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {customers.slice(0, 200).map((c: CustomerRecord) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.contactName}</TableCell>
                        <TableCell>{c.location}</TableCell>
                        <TableCell>{c.recordOwner}</TableCell>
                        <TableCell>
                          <Badge variant={c.interested ? "default" : "secondary"}>{c.interested ? "Interested" : "Not Interested"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle>Employees</CardTitle>
                <CardDescription>All employee records</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Department</TableHead><TableHead>Position</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {employees.map((e: User) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.fullName}</TableCell>
                        <TableCell>{e.email}</TableCell>
                        <TableCell>{e.department ?? "-"}</TableCell>
                        <TableCell>{e.position ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Lead Count" value={numberFmt(stats?.leads ?? leads.length)} icon={<FileText className="w-5 h-5 text-blue-600" />} />
              <StatCard label="Conversion Rate" value={percent(analytics.conversionRate)} icon={<TrendingUp className="w-5 h-5 text-green-600" />} />
              <StatCard label="Occupancy" value={percent(analytics.occupancyRate)} icon={<Activity className="w-5 h-5 text-purple-600" />} />
              <StatCard label="Booked Customers" value={numberFmt(analytics.bookedCustomers)} icon={<Users className="w-5 h-5 text-orange-600" />} />
            </div>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Employee Performance Metrics</CardTitle>
                <CardDescription>Per-employee operational performance from live customer data.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Total Customers</TableHead>
                      <TableHead>Hot Leads</TableHead>
                      <TableHead>Following Up</TableHead>
                      <TableHead>Paid Advance</TableHead>
                      <TableHead>Booked</TableHead>
                      <TableHead>Conversion</TableHead>
                      <TableHead>Unit Pipeline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeePerformance.map((row) => (
                      <TableRow key={row.employeeId}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.department}</TableCell>
                        <TableCell>{numberFmt(row.totalCustomers)}</TableCell>
                        <TableCell>{numberFmt(row.hotLeads)}</TableCell>
                        <TableCell>{numberFmt(row.followingUp)}</TableCell>
                        <TableCell>{numberFmt(row.paidAdvance)}</TableCell>
                        <TableCell>{numberFmt(row.booked)}</TableCell>
                        <TableCell>{percent(row.conversionRate)}</TableCell>
                        <TableCell>{moneyFmt(row.unitPipeline)}</TableCell>
                      </TableRow>
                    ))}
                    {!employeePerformance.length && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-slate-600 py-6">
                          No employee data available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="units">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Total Portfolio Value" value={moneyFmt(analytics.totalPortfolioValue)} icon={<PieChart className="w-5 h-5 text-blue-600" />} />
              <StatCard label="Sold Value" value={moneyFmt(analytics.soldValue)} icon={<PieChart className="w-5 h-5 text-green-600" />} />
              <StatCard label="Advance Value" value={moneyFmt(analytics.advanceValue)} icon={<PieChart className="w-5 h-5 text-yellow-600" />} />
              <StatCard label="Inventory Value" value={moneyFmt(analytics.availableInventoryValue)} icon={<PieChart className="w-5 h-5 text-red-600" />} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <StatCard label="Customer Budget Pool" value={moneyFmt(analytics.customerBudgetPool)} icon={<UserCheck className="w-5 h-5 text-purple-600" />} />
              <StatCard label="Paid Advance Customers" value={numberFmt(analytics.paidAdvanceCustomers)} icon={<TrendingUp className="w-5 h-5 text-indigo-600" />} />
            </div>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Location and Venture Unit Breakdown</CardTitle>
                <CardDescription>Location totals with detailed venture-level unit stats.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {locationUnitBreakdown.map((location) => (
                  <div key={location.locationId} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-card-foreground">{location.locationName}</h3>
                        <p className="text-sm text-slate-600">{location.ventures.length} ventures</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold">Total: {numberFmt(location.totalUnits)} units</p>
                        <p className="text-slate-600">Value: {moneyFmt(location.totalValue)}</p>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Venture</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Sold</TableHead>
                          <TableHead>Advance</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Total Value</TableHead>
                          <TableHead>Sold Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {location.ventures.map((venture) => (
                          <TableRow key={venture.ventureId}>
                            <TableCell className="font-medium">{venture.ventureName}</TableCell>
                            <TableCell>{numberFmt(venture.totalUnits)}</TableCell>
                            <TableCell>{numberFmt(venture.soldUnits)}</TableCell>
                            <TableCell>{numberFmt(venture.advanceUnits)}</TableCell>
                            <TableCell>{numberFmt(venture.availableUnits)}</TableCell>
                            <TableCell>{moneyFmt(venture.totalValue)}</TableCell>
                            <TableCell>{moneyFmt(venture.soldValue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
                {!locationUnitBreakdown.length && <p className="text-sm text-slate-600">No venture data available yet.</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-600">{label}</p>
            <p className="text-xl font-bold text-card-foreground">{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="font-semibold text-card-foreground">{value}</span>
    </div>
  );
}
