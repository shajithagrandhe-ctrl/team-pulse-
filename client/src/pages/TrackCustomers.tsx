import { Building2, Calendar, Download, Edit, Eye, Hash, KeyRound, MapPin, Phone, PieChart, Plus, Search, TrendingUp, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, customerApi, userApi, type CustomerRecord, type CustomerRecordInput } from "@/services/api";
import { formatINRTextToUnits } from "@/lib/money";

type CustomerStatus = "HOT_LEAD" | "FOLLOWING_UP" | "CONFIRMED_NOT_PAID" | "PAID_ADVANCE" | "BOOKED";

const STATUS_OPTIONS: Array<{ value: CustomerStatus; label: string; badgeClass: string }> = [
  { value: "HOT_LEAD", label: "Hot Lead", badgeClass: "bg-red-100 text-red-800 hover:bg-red-200" },
  { value: "FOLLOWING_UP", label: "Following Up", badgeClass: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" },
  { value: "CONFIRMED_NOT_PAID", label: "Confirmed (Yet to Pay)", badgeClass: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
  { value: "PAID_ADVANCE", label: "Paid Advance", badgeClass: "bg-purple-100 text-purple-800 hover:bg-purple-200" },
  { value: "BOOKED", label: "Booked", badgeClass: "bg-green-100 text-green-800 hover:bg-green-200" }
];

const normalizeStatus = (record: Pick<CustomerRecord, "status" | "interested">): CustomerStatus => {
  if (record.status) return record.status as CustomerStatus;
  return record.interested ? "HOT_LEAD" : "FOLLOWING_UP";
};

const statusMeta = (status: CustomerStatus) => STATUS_OPTIONS.find((o) => o.value === status)!;

const deriveInterested = (status: CustomerStatus) => status !== "FOLLOWING_UP";

const TrackCustomers = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<CustomerStatus | "all">("all");
  const [filterBudget, setFilterBudget] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    contactName: "",
    contactNumber: "",
    location: "",
    budget: "",
    ventureName: "",
    plotInterested: "",
    status: "HOT_LEAD" as CustomerStatus,
    leadName: "",
    notes: ""
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomerRecord | null>(null);
  const [editForm, setEditForm] = useState({
    contactName: "",
    contactNumber: "",
    location: "",
    budget: "",
    ventureName: "",
    plotInterested: "",
    status: "FOLLOWING_UP" as CustomerStatus,
    leadName: "",
    notes: ""
  });

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<CustomerRecord | null>(null);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleRecord, setScheduleRecord] = useState<CustomerRecord | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    dateTimeLocal: "",
    notes: ""
  });
  const [credentialOpen, setCredentialOpen] = useState(false);
  const [credentialCustomer, setCredentialCustomer] = useState<CustomerRecord | null>(null);
  const [credentialForm, setCredentialForm] = useState({
    email: "",
    password: "",
    displayName: ""
  });

  const { data: customersResponse } = useQuery({
    queryKey: ["customer-records"],
    queryFn: () => customerApi.list(1, 200)
  });
  const { data: employeesResponse } = useQuery({
    queryKey: ["employees"],
    queryFn: userApi.employees
  });

  const customers = customersResponse?.data ?? [];
  const employees = employeesResponse?.data ?? [];
  const canProvisionCustomerCredentials = user?.role === "ADMIN" || user?.role === "EMPLOYEE";
  const isEmployee = user?.role === "EMPLOYEE";
  const currentEmployeeName = (user?.fullName || user?.displayName || user?.email || "").trim();

  const parseStructuredNotes = (notesRaw: string | null | undefined) => {
    const notes = (notesRaw || "").trim();
    if (!notes) return { ventureName: "", plotInterested: "", remainingNotes: "" };

    const lines = notes.split(/\r?\n/).map((l) => l.trim());
    let ventureName = "";
    let plotInterested = "";
    const remaining: string[] = [];

    for (const line of lines) {
      const ventureMatch = line.match(/^Venture:\s*(.+)$/i);
      if (ventureMatch?.[1]) {
        ventureName = ventureMatch[1].trim();
        continue;
      }
      const plotMatch = line.match(/^Plot Interested:\s*(.+)$/i);
      if (plotMatch?.[1]) {
        plotInterested = plotMatch[1].trim();
        continue;
      }
      if (line) remaining.push(line);
    }

    return { ventureName, plotInterested, remainingNotes: remaining.join("\n").trim() };
  };

  const buildNotes = (form: { ventureName: string; plotInterested: string; notes: string }) => {
    const parts: string[] = [];
    if (form.ventureName.trim()) parts.push(`Venture: ${form.ventureName.trim()}`);
    if (form.plotInterested.trim()) parts.push(`Plot Interested: ${form.plotInterested.trim()}`);
    if (form.notes.trim()) parts.push(form.notes.trim());
    return parts.join("\n") || undefined;
  };

  useEffect(() => {
    if (!addOpen) return;
    if (addForm.leadName.trim()) return;
    const fallback = user?.fullName || user?.displayName || "";
    if (!fallback) return;
    setAddForm((prev) => ({ ...prev, leadName: fallback }));
  }, [addOpen, addForm.leadName, user?.displayName, user?.fullName]);

  const resetAddForm = () => {
    setAddForm({
      contactName: "",
      contactNumber: "",
      location: "",
      budget: "",
      ventureName: "",
      plotInterested: "",
      status: "HOT_LEAD",
      leadName: currentEmployeeName,
      notes: ""
    });
  };

  useEffect(() => {
    if (!editOpen || !editingRecord) return;

    const agentName = isEmployee ? currentEmployeeName : (editingRecord.leadName || editingRecord.recordOwner || "").trim();
    const structured = parseStructuredNotes(editingRecord.notes);
    setEditForm({
      contactName: editingRecord.contactName ?? "",
      contactNumber: editingRecord.contactNumber ?? "",
      location: editingRecord.location ?? "",
      budget: editingRecord.budget ?? "",
      ventureName: structured.ventureName,
      plotInterested: structured.plotInterested,
      status: normalizeStatus(editingRecord),
      leadName: agentName,
      notes: structured.remainingNotes
    });
  }, [editOpen, editingRecord, isEmployee, currentEmployeeName]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: CustomerRecordInput = {
        contactName: addForm.contactName.trim(),
        contactNumber: addForm.contactNumber.trim(),
        location: addForm.location.trim(),
        budget: addForm.budget.trim(),
        status: addForm.status,
        interested: deriveInterested(addForm.status),
        recordOwner: (isEmployee ? currentEmployeeName : addForm.leadName.trim() || currentEmployeeName || "Unknown").trim(),
        leadName: (isEmployee ? currentEmployeeName : addForm.leadName).trim(),
        notes: buildNotes(addForm)
      };
      return customerApi.create(payload);
    },
    onSuccess: (response) => {
      toast.success(response.message || "Customer saved");
      setAddOpen(false);
      resetAddForm();
      queryClient.invalidateQueries({ queryKey: ["customer-records"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to save customer");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingRecord) throw new Error("No customer selected");

      const payload: CustomerRecordInput = {
        contactName: editForm.contactName.trim(),
        contactNumber: editForm.contactNumber.trim(),
        location: editForm.location.trim(),
        budget: editForm.budget.trim(),
        status: editForm.status,
        interested: deriveInterested(editForm.status),
        recordOwner: (isEmployee ? currentEmployeeName : editForm.leadName).trim(),
        leadName: (isEmployee ? currentEmployeeName : editForm.leadName).trim(),
        notes: buildNotes(editForm)
      };

      return customerApi.update(editingRecord.id, payload);
    },
    onSuccess: (response) => {
      toast.success(response.message || "Customer updated");
      setEditOpen(false);
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ["customer-records"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update customer");
    }
  });

  const provisionCredentialMutation = useMutation({
    mutationFn: async () => {
      if (!credentialCustomer) throw new Error("No customer selected");
      const displayName = credentialForm.displayName.trim() || credentialCustomer.contactName.trim();
      return authApi.createCustomerCredentials({
        email: credentialForm.email.trim(),
        password: credentialForm.password,
        displayName,
        fullName: displayName,
        phoneNumber: credentialCustomer.contactNumber,
        address: credentialCustomer.location
      });
    },
    onSuccess: () => {
      toast.success("Customer credentials created");
      setCredentialOpen(false);
      setCredentialCustomer(null);
      setCredentialForm({ email: "", password: "", displayName: "" });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create customer credentials");
    }
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesSearch = !q || c.contactName.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.contactNumber.includes(q);
      const status = normalizeStatus(c);
      const matchesStatus = filterStatus === "all" || status === filterStatus;
      const matchesBudget = filterBudget === "all" || c.budget === filterBudget;
      return matchesSearch && matchesStatus && matchesBudget;
    });
  }, [customers, search, filterStatus, filterBudget]);

  const stats = useMemo(() => {
    const total = customers.length;
    const hotLeads = customers.filter((c) => normalizeStatus(c) === "HOT_LEAD").length;
    const followingUp = customers.filter((c) => normalizeStatus(c) === "FOLLOWING_UP").length;
    const booked = customers.filter((c) => normalizeStatus(c) === "BOOKED").length;
    return { total, hotLeads, followingUp, booked };
  }, [customers]);

  const getBudgetColor = (budget: string) => {
    if (budget.includes("5-10")) return "bg-green-100 text-green-800";
    if (budget.includes("10-15")) return "bg-blue-100 text-blue-800";
    if (budget.includes("15-20")) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  const displayUnits = (raw: string) => {
    const withoutCurrency = (raw || "")
      .replace(/[₹$]/g, "")
      .replace(/\b(inr|rs)\b\.?/gi, "")
      .trim();

    const formatted = formatINRTextToUnits(withoutCurrency);

    return formatted
      .replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*Lakhs?\b/gi, "$1-$2L Units")
      .replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*Crores?\b/gi, "$1-$2Cr Units")
      .replace(/(\d+(?:\.\d+)?)\s*Lakhs?\b/gi, "$1L Units")
      .replace(/(\d+(?:\.\d+)?)\s*Crores?\b/gi, "$1Cr Units");
  };

  const toTelHref = (rawPhone: string) => {
    const trimmed = (rawPhone || "").trim();
    if (!trimmed) return "";
    const cleaned = trimmed.replace(/[^\d+]/g, "");
    return cleaned ? `tel:${cleaned}` : "";
  };

  const toIcsDateTimeUtc = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
      `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
      `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
    );
  };

  const downloadIcsReminder = (record: CustomerRecord, dateTimeLocal: string, notes: string) => {
    const start = new Date(dateTimeLocal);
    if (Number.isNaN(start.getTime())) {
      toast.error("Please select a valid date/time");
      return;
    }
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const uid = `customer-${record.id}-${Date.now()}@estatehub`;
    const dtstamp = toIcsDateTimeUtc(new Date());
    const dtstart = toIcsDateTimeUtc(start);
    const dtend = toIcsDateTimeUtc(end);
    const summary = `Follow-up: ${record.contactName}`;
    const description = [
      `Customer: ${record.contactName}`,
      `Phone: ${record.contactNumber}`,
      `Location: ${record.location}`,
      `Units: ${displayUnits(record.budget)}`,
      `Status: ${statusMeta(normalizeStatus(record)).label}`,
      `Agent: ${(record.leadName || record.recordOwner || "").trim()}`,
      notes ? `Notes: ${notes}` : ""
    ]
      .filter(Boolean)
      .join("\\n")
      .replace(/\r?\n/g, "\\n");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EstateHub//TrackCustomers//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder",
      "TRIGGER:-PT15M",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const filename = `reminder-${record.contactName.replace(/[^\w\-]+/g, "_")}-${new Date().toISOString().slice(0, 10)}.ics`;
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Calendar reminder downloaded");
  };

  const sanitizeForExcel = (value: string) => (/^[=+\-@]/.test(value) ? `'${value}` : value);

  const toCsvCell = (value: unknown) => {
    const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
    const safe = sanitizeForExcel(text);
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const handleExport = () => {
    if (!filtered.length) {
      toast.error("No customers to export");
      return;
    }

    const header = ["Customer Name", "Phone", "Location", "Venture", "Plot Interested", "Units", "Status", "Agent", "Notes", "Created At", "Updated At"];
    const rows = filtered.map((c) => {
      const status = statusMeta(normalizeStatus(c)).label;
      const structured = parseStructuredNotes(c.notes);
      return [
        c.contactName,
        c.contactNumber,
        c.location,
        structured.ventureName,
        structured.plotInterested,
        displayUnits(c.budget),
        status,
        (c.leadName || c.recordOwner || "").trim(),
        structured.remainingNotes,
        c.createdAt,
        c.updatedAt
      ];
    });

    const csv = [header, ...rows].map((r) => r.map(toCsvCell).join(",")).join("\r\n");
    const filename = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success("Export downloaded");
  };

  const canSave =
    Boolean(addForm.contactName.trim()) &&
    Boolean(addForm.contactNumber.trim()) &&
    Boolean(addForm.location.trim()) &&
    Boolean(addForm.budget.trim()) &&
    Boolean(addForm.leadName.trim());

  const canUpdate =
    Boolean(editForm.contactName.trim()) &&
    Boolean(editForm.contactNumber.trim()) &&
    Boolean(editForm.location.trim()) &&
    Boolean(editForm.budget.trim()) &&
    Boolean(editForm.leadName.trim());

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage customer relationships and sales pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Customers</p>
                <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Hot Leads</p>
                <p className="text-2xl font-bold text-red-600">{stats.hotLeads}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Following Up</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.followingUp}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-yellow-800" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Booked</p>
                <p className="text-2xl font-bold text-green-600">{stats.booked}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <PieChart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name, phone, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as CustomerStatus | "all")}>
              <SelectTrigger className="w-full lg:w-56">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterBudget} onValueChange={setFilterBudget}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="INR 5-10 Lakhs">5-10L Units</SelectItem>
                <SelectItem value="INR 10-15 Lakhs">10-15L Units</SelectItem>
                <SelectItem value="INR 15-20 Lakhs">15-20L Units</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
                Grid
              </Button>
              <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
        {filtered.map((c) => {
          const status = normalizeStatus(c);
          const meta = statusMeta(status);
          const telHref = toTelHref(c.contactNumber);
          return (
            <Card key={c.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground mb-1">{c.contactName}</h3>
                    <Badge variant="secondary" className={meta.badgeClass}>
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="View customer"
                      onClick={() => {
                        setViewingRecord(c);
                        setViewOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Edit customer"
                      onClick={() => {
                        setEditingRecord(c);
                        setEditOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{c.contactNumber}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{c.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <PieChart className="w-4 h-4 text-muted-foreground" />
                    <Badge className={getBudgetColor(c.budget)}>{displayUnits(c.budget)}</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Agent: {c.leadName || c.recordOwner}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      if (!telHref) {
                        toast.error("No phone number available");
                        return;
                      }
                      window.location.href = telHref;
                    }}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setScheduleRecord(c);
                      setScheduleForm({ dateTimeLocal: "", notes: "" });
                      setScheduleOpen(true);
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                  {canProvisionCustomerCredentials && (status === "BOOKED" || status === "PAID_ADVANCE") && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setCredentialCustomer(c);
                        setCredentialForm({
                          email: "",
                          password: "",
                          displayName: c.contactName
                        });
                        setCredentialOpen(true);
                      }}
                    >
                      <KeyRound className="w-4 h-4 mr-2" />
                      Create Login
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No customers found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input
                value={addForm.contactName}
                onChange={(e) => setAddForm((p) => ({ ...p, contactName: e.target.value }))}
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={addForm.contactNumber}
                onChange={(e) => setAddForm((p) => ({ ...p, contactNumber: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={addForm.location} onChange={(e) => setAddForm((p) => ({ ...p, location: e.target.value }))} placeholder="Enter location" />
            </div>

            <div className="space-y-2">
              <Label>Units</Label>
              <Input value={addForm.budget} onChange={(e) => setAddForm((p) => ({ ...p, budget: e.target.value }))} placeholder="e.g. 15,00,000" />
            </div>

            <div className="space-y-2">
              <Label>Venture</Label>
              <Input
                value={addForm.ventureName}
                onChange={(e) => setAddForm((p) => ({ ...p, ventureName: e.target.value }))}
                placeholder="Enter venture name"
              />
            </div>

            <div className="space-y-2">
              <Label>Plot Interested</Label>
              <Input
                value={addForm.plotInterested}
                onChange={(e) => setAddForm((p) => ({ ...p, plotInterested: e.target.value }))}
                placeholder="e.g. Plot 12 / Block A"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={addForm.status} onValueChange={(v) => setAddForm((p) => ({ ...p, status: v as CustomerStatus }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Agent Name</Label>
              {isEmployee ? (
                <Input value={currentEmployeeName} readOnly />
              ) : (
                <Select value={addForm.leadName} onValueChange={(v) => setAddForm((p) => ({ ...p, leadName: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.fullName}>
                        {employee.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea value={addForm.notes} onChange={(e) => setAddForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any notes for follow-up..." />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!canSave) {
                  toast.error("Please fill all required fields");
                  return;
                }
                createMutation.mutate();
              }}
              disabled={!canSave || createMutation.isPending}
            >
              {createMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingRecord(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input
                value={editForm.contactName}
                onChange={(e) => setEditForm((p) => ({ ...p, contactName: e.target.value }))}
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={editForm.contactNumber}
                onChange={(e) => setEditForm((p) => ({ ...p, contactNumber: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="Enter location"
              />
            </div>

            <div className="space-y-2">
              <Label>Units</Label>
              <Input value={editForm.budget} onChange={(e) => setEditForm((p) => ({ ...p, budget: e.target.value }))} placeholder="e.g. 15,00,000" />
            </div>

            <div className="space-y-2">
              <Label>Venture</Label>
              <Input
                value={editForm.ventureName}
                onChange={(e) => setEditForm((p) => ({ ...p, ventureName: e.target.value }))}
                placeholder="Enter venture name"
              />
            </div>

            <div className="space-y-2">
              <Label>Plot Interested</Label>
              <Input
                value={editForm.plotInterested}
                onChange={(e) => setEditForm((p) => ({ ...p, plotInterested: e.target.value }))}
                placeholder="e.g. Plot 12 / Block A"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v as CustomerStatus }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Agent Name</Label>
              {isEmployee ? (
                <Input value={currentEmployeeName} readOnly />
              ) : (
                <Select value={editForm.leadName} onValueChange={(v) => setEditForm((p) => ({ ...p, leadName: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.fullName}>
                        {employee.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any notes for follow-up..." />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setEditingRecord(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!canUpdate) {
                  toast.error("Please fill all required fields");
                  return;
                }
                updateMutation.mutate();
              }}
              disabled={!canUpdate || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) setViewingRecord(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>

          {viewingRecord ? (
            (() => {
              const structured = parseStructuredNotes(viewingRecord.notes);
              return (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-base">{viewingRecord.contactName}</div>
                <Badge className={getBudgetColor(viewingRecord.budget)}>{displayUnits(viewingRecord.budget)}</Badge>
              </div>
              {structured.ventureName ? (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span>Venture: {structured.ventureName}</span>
                </div>
              ) : null}
              {structured.plotInterested ? (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span>Plot Interested: {structured.plotInterested}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{viewingRecord.contactNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{viewingRecord.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Agent: {viewingRecord.leadName || viewingRecord.recordOwner}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span>Status: {statusMeta(normalizeStatus(viewingRecord)).label}</span>
              </div>
              {structured.remainingNotes ? (
                <div className="pt-2 border-t">
                  <div className="text-muted-foreground mb-1">Notes</div>
                  <div className="whitespace-pre-wrap">{structured.remainingNotes}</div>
                </div>
              ) : null}
              <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                <div>Created: {new Date(viewingRecord.createdAt).toLocaleString()}</div>
                <div>Updated: {new Date(viewingRecord.updatedAt).toLocaleString()}</div>
              </div>
            </div>
              );
            })()
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={scheduleOpen}
        onOpenChange={(open) => {
          setScheduleOpen(open);
          if (!open) setScheduleRecord(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Reminder</DialogTitle>
          </DialogHeader>

          {scheduleRecord ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Customer: <span className="text-foreground font-medium">{scheduleRecord.contactName}</span>
              </div>

              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={scheduleForm.dateTimeLocal}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, dateTimeLocal: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Reminder notes..."
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!scheduleRecord) return;
                downloadIcsReminder(scheduleRecord, scheduleForm.dateTimeLocal, scheduleForm.notes);
                setScheduleOpen(false);
                setScheduleRecord(null);
              }}
              disabled={!scheduleRecord || !scheduleForm.dateTimeLocal}
            >
              Download Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={credentialOpen}
        onOpenChange={(open) => {
          setCredentialOpen(open);
          if (!open) {
            setCredentialCustomer(null);
            setCredentialForm({ email: "", password: "", displayName: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Customer Login Credentials</DialogTitle>
          </DialogHeader>

          {credentialCustomer ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Customer: <span className="font-medium text-foreground">{credentialCustomer.contactName}</span>
              </p>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={credentialForm.email}
                  onChange={(e) => setCredentialForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="customer@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={credentialForm.displayName}
                  onChange={(e) => setCredentialForm((p) => ({ ...p, displayName: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>

              <div className="space-y-2">
                <Label>Initial Password</Label>
                <Input
                  type="password"
                  value={credentialForm.password}
                  onChange={(e) => setCredentialForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Minimum 8 characters"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Share this initial password with the customer. They can change it later from their account.
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCredentialOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => provisionCredentialMutation.mutate()}
              disabled={
                !credentialCustomer ||
                !credentialForm.email.trim() ||
                credentialForm.password.length < 8 ||
                provisionCredentialMutation.isPending
              }
            >
              {provisionCredentialMutation.isPending ? "Creating..." : "Create Credentials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackCustomers;
