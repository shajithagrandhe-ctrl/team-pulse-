import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { employeeAccessApi, locationApi, type EmployeeAccount, type EmployeeAccountInput } from "@/services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Pencil, Plus, ShieldAlert, Snowflake, Sun, RefreshCw, Filter } from "lucide-react";

const toLines = (value: string) =>
  value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);

type FormState = EmployeeAccountInput & {
  password?: string;
  previousCompaniesText: string;
  achievementsText: string;
  assignedLocationIds: string[];
  assignedVentureIds: string[];
};

const emptyForm = (): FormState => ({
  email: "",
  password: "",
  displayName: "",
  fullName: "",
  employeeId: null,
  phoneNumber: null,
  department: null,
  position: null,
  address: null,
  firstName: null,
  lastName: null,
  emailVerified: false,
  phoneVerified: false,
  dateOfBirth: null,
  yearsOfExperience: null,
  currentCompany: null,
  previousCompanies: null,
  currentPosition: null,
  roleGiven: null,
  assignedLocationIds: [],
  assignedVentureIds: [],
  dateOfJoining: null,
  dateOfRelieving: null,
  achievements: null,
  status: "ACTIVE",
  previousCompaniesText: "",
  achievementsText: ""
});

export default function EmployeeAccess() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeAccount | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "FROZEN">("ALL");

  const [emailOtpRequestId, setEmailOtpRequestId] = useState<string>("");
  const [emailOtp, setEmailOtp] = useState<string>("");
  const [phoneOtpRequestId, setPhoneOtpRequestId] = useState<string>("");
  const [phoneOtp, setPhoneOtp] = useState<string>("");

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["employee-access", "employees"],
    queryFn: employeeAccessApi.list,
    enabled: Boolean(isAdmin)
  });
  const { data: locationsResponse } = useQuery({
    queryKey: ["locations"],
    queryFn: locationApi.list
  });

  const employees = data?.data ?? [];
  const locations = locationsResponse?.data ?? [];
  const filteredEmployees = employees.filter((emp) => {
    if (statusFilter === "ALL") return true;
    return (emp.employeeProfile?.status ?? "ACTIVE") === statusFilter;
  });
  const venturesForSelectedLocations = useMemo(() => {
    const selected = new Set(form.assignedLocationIds);
    return locations
      .filter((loc) => selected.has(loc.id))
      .flatMap((loc) => loc.ventures.map((venture) => ({ ...venture, locationName: loc.name })));
  }, [locations, form.assignedLocationIds]);

  const createMutation = useMutation({
    mutationFn: (payload: EmployeeAccountInput & { password: string }) => employeeAccessApi.create(payload),
    onSuccess: () => {
      toast.success("Employee added");
      queryClient.invalidateQueries({ queryKey: ["employee-access", "employees"] });
      setDialogOpen(false);
    },
    onError: (err: any) => toast.error(err?.message || "Failed to add employee")
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; payload: EmployeeAccountInput }) => employeeAccessApi.update(vars.id, vars.payload),
    onSuccess: () => {
      toast.success("Employee updated");
      queryClient.invalidateQueries({ queryKey: ["employee-access", "employees"] });
      setDialogOpen(false);
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update employee")
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: "ACTIVE" | "FROZEN" }) => employeeAccessApi.setStatus(vars.id, vars.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee-access", "employees"] }),
    onError: (err: any) => toast.error(err?.message || "Failed to update status")
  });

  const otpRequestMutation = useMutation({
    mutationFn: (payload: { type: "email" | "phone"; target: string }) => employeeAccessApi.requestOtp(payload),
    onSuccess: (resp) => {
      toast.success(`OTP generated: ${resp.data.otp}`);
    },
    onError: (err: any) => toast.error(err?.message || "Failed to request OTP")
  });

  const otpVerifyMutation = useMutation({
    mutationFn: (payload: { requestId: string; otp: string }) => employeeAccessApi.verifyOtp(payload),
    onSuccess: () => toast.success("OTP verified"),
    onError: (err: any) => toast.error(err?.message || "OTP verification failed")
  });

  const title = useMemo(() => (editing ? "Modify Employee" : "Add Employee"), [editing]);

  useEffect(() => {
    if (!dialogOpen) {
      setEditing(null);
      setForm(emptyForm());
      setEmailOtpRequestId("");
      setEmailOtp("");
      setPhoneOtpRequestId("");
      setPhoneOtp("");
    }
  }, [dialogOpen]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (employee: EmployeeAccount) => {
    setEditing(employee);
    const profile = employee.employeeProfile;
    setForm({
      email: employee.email,
      password: "",
      displayName: employee.displayName,
      fullName: employee.fullName,
      employeeId: employee.employeeId ?? null,
      phoneNumber: employee.phoneNumber ?? null,
      department: employee.department ?? null,
      position: employee.position ?? null,
      address: employee.address ?? null,
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
      emailVerified: Boolean(profile?.emailVerified),
      phoneVerified: Boolean(profile?.phoneVerified),
      dateOfBirth: profile?.dateOfBirth ?? null,
      yearsOfExperience: profile?.yearsOfExperience ?? null,
      currentCompany: profile?.currentCompany ?? null,
      previousCompanies: profile?.previousCompanies ?? null,
      currentPosition: profile?.currentPosition ?? null,
      roleGiven: profile?.roleGiven ?? null,
      assignedLocationIds: (profile?.assignedLocationIds as string[] | null) ?? [],
      assignedVentureIds: (profile?.assignedVentureIds as string[] | null) ?? [],
      dateOfJoining: profile?.dateOfJoining ?? null,
      dateOfRelieving: profile?.dateOfRelieving ?? null,
      achievements: profile?.achievements ?? null,
      status: profile?.status ?? "ACTIVE",
      previousCompaniesText: (profile?.previousCompanies ?? []).join("\n"),
      achievementsText: (profile?.achievements ?? []).join("\n")
    });
    setDialogOpen(true);
  };

  const buildPayload = (): EmployeeAccountInput & { password?: string } => {
    const previousCompanies = toLines(form.previousCompaniesText);
    const achievements = toLines(form.achievementsText);

    return {
      email: form.email.trim(),
      password: form.password?.trim() ? form.password.trim() : undefined,
      displayName: form.displayName?.trim() || undefined,
      fullName: form.fullName?.trim() || undefined,
      employeeId: form.employeeId?.trim() || null,
      phoneNumber: form.phoneNumber?.trim() || null,
      department: form.department?.trim() || null,
      position: form.position?.trim() || null,
      address: form.address?.trim() || null,

      firstName: form.firstName?.trim() || null,
      lastName: form.lastName?.trim() || null,
      emailVerified: Boolean(form.emailVerified),
      phoneVerified: Boolean(form.phoneVerified),
      dateOfBirth: form.dateOfBirth || null,
      yearsOfExperience: form.yearsOfExperience ?? null,
      currentCompany: form.currentCompany?.trim() || null,
      previousCompanies: previousCompanies.length ? previousCompanies : null,
      currentPosition: form.currentPosition?.trim() || null,
      roleGiven: form.roleGiven?.trim() || null,
      assignedLocationIds: form.assignedLocationIds.length ? form.assignedLocationIds : null,
      assignedVentureIds: form.assignedVentureIds.length ? form.assignedVentureIds : null,
      dateOfJoining: form.dateOfJoining || null,
      dateOfRelieving: form.dateOfRelieving || null,
      achievements: achievements.length ? achievements : null,
      status: form.status
    };
  };

  const submit = () => {
    if (!form.email.trim()) {
      toast.error("Username (email) is required");
      return;
    }

    if (!editing && !(form.password || "").trim()) {
      toast.error("Password is required");
      return;
    }

    const payload = buildPayload();

    if (editing) {
      const { password, ...rest } = payload;
      updateMutation.mutate({
        id: editing.id,
        payload: password ? { ...rest, password } : rest
      });
      return;
    }

    createMutation.mutate(payload as EmployeeAccountInput & { password: string });
  };

  const requestEmailOtp = async () => {
    const email = form.email.trim();
    if (!email) return toast.error("Enter email first");
    const resp = await otpRequestMutation.mutateAsync({ type: "email", target: email });
    setEmailOtpRequestId(resp.data.requestId);
  };

  const verifyEmailOtp = async () => {
    if (!emailOtpRequestId) return toast.error("Request OTP first");
    await otpVerifyMutation.mutateAsync({ requestId: emailOtpRequestId, otp: emailOtp });
    setForm((p) => ({ ...p, emailVerified: true }));
  };

  const requestPhoneOtp = async () => {
    const phone = (form.phoneNumber || "").trim();
    if (!phone) return toast.error("Enter phone number first");
    const resp = await otpRequestMutation.mutateAsync({ type: "phone", target: phone });
    setPhoneOtpRequestId(resp.data.requestId);
  };

  const verifyPhoneOtp = async () => {
    if (!phoneOtpRequestId) return toast.error("Request OTP first");
    await otpVerifyMutation.mutateAsync({ requestId: phoneOtpRequestId, otp: phoneOtp });
    setForm((p) => ({ ...p, phoneVerified: true }));
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Admin only
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Employee Access is available only for admins.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Employee Access</h1>
          <p className="text-muted-foreground text-sm">
            Create / modify employee credentials, verify email & phone via OTP, and freeze logins on relieving.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "ALL" | "ACTIVE" | "FROZEN")}>
            <SelectTrigger className="w-44">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="FROZEN">Frozen</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => {
                  const profile = emp.employeeProfile;
                  const name =
                    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() || emp.fullName || emp.displayName;
                  const status = profile?.status ?? "ACTIVE";
                  const verifiedEmail = Boolean(profile?.emailVerified);
                  const verifiedPhone = Boolean(profile?.phoneVerified);
                  return (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell>{emp.phoneNumber || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          <Badge variant={verifiedEmail ? "default" : "secondary"}>
                            {verifiedEmail ? "Email" : "Email?"}
                          </Badge>
                          <Badge variant={verifiedPhone ? "default" : "secondary"}>
                            {verifiedPhone ? "Phone" : "Phone?"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status === "ACTIVE" ? "default" : "destructive"}>
                          {status === "ACTIVE" ? "Active" : "Frozen"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(emp)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        {status === "ACTIVE" ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: emp.id, status: "FROZEN" })}
                            disabled={statusMutation.isPending}
                          >
                            <Snowflake className="w-4 h-4 mr-2" />
                            Freeze
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: emp.id, status: "ACTIVE" })}
                            disabled={statusMutation.isPending}
                          >
                            <Sun className="w-4 h-4 mr-2" />
                            Activate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filteredEmployees.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No employees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] pr-4">
            <div className="grid gap-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Credentials</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username (Email)</Label>
                    <Input
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="employee@company.com"
                      disabled={Boolean(editing)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{editing ? "New Password (optional)" : "Password"}</Label>
                    <Input
                      type="password"
                      value={form.password || ""}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder={editing ? "Leave blank to keep existing" : "Enter password"}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Employee Details</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First name</Label>
                    <Input value={form.firstName || ""} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last name</Label>
                    <Input value={form.lastName || ""} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Display name</Label>
                    <Input
                      value={form.displayName || ""}
                      onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                      placeholder="Shown in app"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Full name</Label>
                    <Input value={form.fullName || ""} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label>Email verified</Label>
                    <div className="flex items-center gap-3">
                      <Switch checked={Boolean(form.emailVerified)} onCheckedChange={(v) => setForm((p) => ({ ...p, emailVerified: v }))} />
                      {form.emailVerified && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={requestEmailOtp} disabled={otpRequestMutation.isPending}>
                        Send OTP
                      </Button>
                      <Input
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        placeholder="Enter OTP"
                        className="h-9"
                      />
                      <Button type="button" size="sm" onClick={verifyEmailOtp} disabled={otpVerifyMutation.isPending}>
                        Verify
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Phone number</Label>
                    <Input
                      value={form.phoneNumber || ""}
                      onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                      placeholder="+91 9876543210"
                    />
                    <div className="flex items-center gap-3">
                      <Label className="text-sm text-muted-foreground">Phone verified</Label>
                      <Switch checked={Boolean(form.phoneVerified)} onCheckedChange={(v) => setForm((p) => ({ ...p, phoneVerified: v }))} />
                      {form.phoneVerified && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={requestPhoneOtp} disabled={otpRequestMutation.isPending}>
                        Send OTP
                      </Button>
                      <Input value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} placeholder="Enter OTP" className="h-9" />
                      <Button type="button" size="sm" onClick={verifyPhoneOtp} disabled={otpVerifyMutation.isPending}>
                        Verify
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Date of birth</Label>
                    <Input
                      type="date"
                      value={form.dateOfBirth || ""}
                      onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value || null }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee ID</Label>
                    <Input value={form.employeeId || ""} onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Assign Locations</Label>
                    <div className="max-h-40 overflow-auto rounded-md border p-3 space-y-2">
                      {locations.map((loc) => (
                        <label key={loc.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.assignedLocationIds.includes(loc.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setForm((p) => {
                                const nextLocations = checked
                                  ? [...p.assignedLocationIds, loc.id]
                                  : p.assignedLocationIds.filter((id) => id !== loc.id);
                                const allowedVentureIds = new Set(
                                  locations
                                    .filter((location) => nextLocations.includes(location.id))
                                    .flatMap((location) => location.ventures.map((venture) => venture.id))
                                );
                                return {
                                  ...p,
                                  assignedLocationIds: nextLocations,
                                  assignedVentureIds: p.assignedVentureIds.filter((id) => allowedVentureIds.has(id))
                                };
                              });
                            }}
                          />
                          <span>{loc.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Assign Ventures (based on selected locations)</Label>
                    <div className="max-h-48 overflow-auto rounded-md border p-3 space-y-2">
                      {venturesForSelectedLocations.map((venture) => (
                        <label key={venture.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.assignedVentureIds.includes(venture.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setForm((p) => ({
                                ...p,
                                assignedVentureIds: checked
                                  ? [...p.assignedVentureIds, venture.id]
                                  : p.assignedVentureIds.filter((id) => id !== venture.id)
                              }));
                            }}
                          />
                          <span>{venture.name}</span>
                          <span className="text-muted-foreground">({venture.locationName})</span>
                        </label>
                      ))}
                      {!venturesForSelectedLocations.length && (
                        <p className="text-sm text-muted-foreground">Select location(s) first to assign ventures.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Work Experience</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Years of experience</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.yearsOfExperience ?? ""}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, yearsOfExperience: e.target.value === "" ? null : Number(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current company</Label>
                    <Input value={form.currentCompany || ""} onChange={(e) => setForm((p) => ({ ...p, currentCompany: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Previous companies (one per line)</Label>
                    <Textarea
                      value={form.previousCompaniesText}
                      onChange={(e) => setForm((p) => ({ ...p, previousCompaniesText: e.target.value }))}
                      placeholder={"Company A\nCompany B"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current position</Label>
                    <Input
                      value={form.currentPosition || ""}
                      onChange={(e) => setForm((p) => ({ ...p, currentPosition: e.target.value }))}
                      placeholder="Engineer / Sales / ..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role given</Label>
                    <Input value={form.roleGiven || ""} onChange={(e) => setForm((p) => ({ ...p, roleGiven: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of joining</Label>
                    <Input
                      type="date"
                      value={form.dateOfJoining || ""}
                      onChange={(e) => setForm((p) => ({ ...p, dateOfJoining: e.target.value || null }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of relieving (login freezes from this date)</Label>
                    <Input
                      type="date"
                      value={form.dateOfRelieving || ""}
                      onChange={(e) => setForm((p) => ({ ...p, dateOfRelieving: e.target.value || null }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Achievements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label>Achievements (one per line)</Label>
                  <Textarea
                    value={form.achievementsText}
                    onChange={(e) => setForm((p) => ({ ...p, achievementsText: e.target.value }))}
                    placeholder={"Top performer 2025\nEmployee of the month"}
                  />
                </CardContent>
              </Card>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant={form.status === "ACTIVE" ? "default" : "destructive"}>
                    {form.status === "ACTIVE" ? "Active" : "Frozen"}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForm((p) => ({ ...p, status: p.status === "ACTIVE" ? "FROZEN" : "ACTIVE" }))}
                  >
                    Toggle status
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={submit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
