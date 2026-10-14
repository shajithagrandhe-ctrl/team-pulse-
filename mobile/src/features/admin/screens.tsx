import { useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { BadgeCheck, BriefcaseBusiness, Building2, Check, ChevronRight, ContactRound, FolderKanban, LockKeyhole,
  Mail, MapPin, Pencil, Plus, Save, Search, ShieldCheck, Snowflake, Square, SquareCheck, UserRound, Users, X,
  type LucideIcon } from "lucide-react-native";
import { z } from "zod";
import { useAuth, readableError } from "../../auth/AuthProvider";
import { Card, ErrorMessage, Field, Pill, Section } from "../../components/ui";
import { theme } from "../../theme";
import { Page, Select, Values, QueryState, Pager, RecordList, Refresh, encoded, useEndpoint, useWrite } from "../common";
import { canManageEmployees, canReadDirectory, directoryKindSchema, directorySchema, employeeSchema,
  employeeStatusResponseSchema, employeeToDraft, employeeWrite, employeeStatusWrite, locationSchema, ventureSchema, uuid,
  type DirectoryKind, type DirectoryUser, type Employee, type EmployeeDraft } from "./contracts";

const labels: Record<DirectoryKind, string> = { admins: "Administrators", employees: "Employee directory", customers: "Customer directory" };
const directoryDescriptions: Record<DirectoryKind, string> = {
  admins: "Review administrator identities and account activity.",
  employees: "Browse employee contact, role, and verification details.",
  customers: "Find customer accounts and contact information."
};
const directoryIcons: Record<DirectoryKind, LucideIcon> = { admins: ShieldCheck, employees: BriefcaseBusiness, customers: ContactRound };
// Expo refreshes generated route declarations when the new native routes are loaded.
const employeeHref = (id: string, edit = false) => `/admin/employees/${encoded(id)}${edit ? "/edit" : ""}` as Href;
const directoryHref = (kind: DirectoryKind) => `/admin/directories/${directoryKindSchema.parse(kind)}` as Href;
function Access({ children, allowed }: { children: ReactNode; allowed: boolean }) {
  const { loading, user } = useAuth();
  if (loading) return <Page title="Access"><ActivityIndicator accessibilityLabel="Checking access" /></Page>;
  if (!user || !allowed) return <Page title="Access unavailable"><ErrorMessage message="You do not have access to this screen." /></Page>;
  return <>{children}</>;
}
function Action({ title, icon: Icon, onPress, busy = false, disabled = false, primary = false, destructive = false }: {
  title: string; icon: LucideIcon; onPress: () => void; busy?: boolean; disabled?: boolean; primary?: boolean; destructive?: boolean;
}) {
  const inactive = disabled || busy;
  const color = primary ? theme.colors.white : destructive ? theme.colors.danger : theme.colors.primary;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: disabled || busy, busy }}
    disabled={inactive} onPress={onPress} style={({ pressed }) => [local.action, primary && local.actionPrimary,
      destructive && local.actionDestructive, (pressed || inactive) && local.pressed]}>
    {busy ? <ActivityIndicator color={color} /> : <Icon size={20} color={color} />}
    <Text style={[local.actionText, primary && local.actionTextPrimary, destructive && local.actionTextDestructive]}>{title}</Text>
  </Pressable>;
}
function Hero({ eyebrow, title, message, icon: Icon }: { eyebrow: string; title: string; message: string; icon: LucideIcon }) {
  return <View style={local.hero}><View style={local.heroIcon}><Icon size={24} color={theme.colors.white} /></View>
    <View style={local.heroCopy}><Text style={local.heroEyebrow}>{eyebrow}</Text><Text accessibilityRole="header" style={local.heroTitle}>{title}</Text>
      <Text style={local.heroMessage}>{message}</Text></View></View>;
}
function NavigationCard({ title, description, icon: Icon, onPress }: { title: string; description: string; icon: LucideIcon; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={description} onPress={onPress}
    style={({ pressed }) => [local.navigationCard, pressed && local.pressed]}>
    <View style={local.navigationIcon}><Icon color={theme.colors.primary} size={22} /></View>
    <View style={local.navigationCopy}><Text style={local.cardTitle}>{title}</Text><Text style={local.body}>{description}</Text></View>
    <ChevronRight color={theme.colors.subtle} size={20} />
  </Pressable>;
}
export function AdminIndex() {
  const { user } = useAuth();
  return <Access allowed={canManageEmployees(user?.role)}><Page title="Administration">
    <Hero eyebrow="Admin workspace" title="People and access" message="Manage employee access and review user directories." icon={ShieldCheck} />
    <Section title="Management">
      <NavigationCard title="Employee access" description="Create employees, manage assignments, and control account status."
        icon={Users} onPress={() => router.push("/admin/employees" as Href)} />
      <NavigationCard title="User directories" description="Review administrators, employees, and customer accounts."
        icon={FolderKanban} onPress={() => router.push("/admin/directories" as Href)} />
    </Section>
  </Page></Access>;
}
export function DirectoryIndex() {
  const { user } = useAuth();
  return <Access allowed={canReadDirectory(user?.role, "employees")}><Page title="User directories">
    <Hero eyebrow="Directory" title="Find the right person" message="Review account information available to your role." icon={ContactRound} />
    <Section title="Available directories">{directoryKindSchema.options.filter(kind => canReadDirectory(user?.role, kind)).map(kind =>
      <NavigationCard key={kind} title={labels[kind]} description={directoryDescriptions[kind]} icon={directoryIcons[kind]}
        onPress={() => router.push(directoryHref(kind))} />)}</Section>
  </Page></Access>;
}
function useLocalPage<T>(rows: T[], search: string, matches: (row: T, search: string) => boolean) {
  const [page, setPage] = useState(1);
  const filtered = rows.filter(row => matches(row, search.trim().toLocaleLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 30));
  const current = Math.min(page, pageCount);
  // Search controls reset the page; clamping also handles a refreshed, shorter list.
  return { rows: filtered.slice((current - 1) * 30, current * 30), page: current, setPage,
    pagination: { total: filtered.length, page: current, pageSize: 30, pageCount } };
}
const matchesUser = (user: DirectoryUser, search: string) =>
  [user.displayName, user.fullName, user.email, user.employeeId, user.department, user.position].some(value => value?.toLocaleLowerCase().includes(search));
const date = (value?: string | null) => value?.slice(0, 10) ?? null;
const verified = (value?: boolean) => value === undefined ? null : value ? "Verified" : "Not verified";
function userValues(user: DirectoryUser) {
  return { "Full name": user.fullName, Email: user.email, Role: user.role, Department: user.department,
    Position: user.position, "Employee ID": user.employeeId, Phone: user.phoneNumber, Address: user.address,
    "Created at": user.createdAt, "Last login": user.lastLogin,
    ...(user.employeeProfile ? { Status: user.employeeProfile.status,
      "Email verification": verified(user.employeeProfile.emailVerified), "Phone verification": verified(user.employeeProfile.phoneVerified),
      "Joining date": date(user.employeeProfile.dateOfJoining), "Relieving date": date(user.employeeProfile.dateOfRelieving) } : {}) };
}
function ResultSummary({ count, label }: { count: number; label: string }) {
  return <View style={local.resultSummary} accessibilityLiveRegion="polite"><Text style={local.resultCount}>{count}</Text>
    <Text style={local.resultLabel}>{label}</Text></View>;
}
function PersonCard({ user, onPress, expanded = false, children }: {
  user: DirectoryUser; onPress: () => void; expanded?: boolean; children?: ReactNode;
}) {
  const status = user.employeeProfile?.status;
  const initials = (user.displayName || user.fullName || user.email).split(/\s+/).filter(Boolean).slice(0, 2)
    .map(part => part[0]?.toLocaleUpperCase()).join("");
  return <Pressable accessibilityRole="button" accessibilityLabel={user.displayName || user.fullName || user.email}
    accessibilityState={{ expanded }} onPress={onPress} style={({ pressed }) => [local.personCard, pressed && local.pressed]}>
    <View style={local.personHeader}><View style={local.avatar}><Text style={local.avatarText}>{initials || "VP"}</Text></View>
      <View style={local.personCopy}><Text style={local.personName}>{user.displayName || user.fullName || user.email}</Text>
        <Text selectable style={local.personEmail}>{user.email}</Text><View style={local.pillRow}><Pill label={user.role} tone="info" />
          {status ? <Pill label={status} tone={status === "ACTIVE" ? "success" : "danger"} /> : null}</View></View>
      <ChevronRight color={theme.colors.subtle} size={20} style={expanded ? local.chevronExpanded : undefined} />
    </View>
    {user.department || user.position ? <View style={local.metaRow}><BriefcaseBusiness color={theme.colors.muted} size={16} />
      <Text style={local.metaText}>{[user.department, user.position].filter(Boolean).join(" / ")}</Text></View> : null}
    {children}
  </Pressable>;
}
export function DirectoryRoute() {
  const { kind } = useLocalSearchParams<{ kind: string | string[] }>();
  const parsed = directoryKindSchema.safeParse(kind);
  const { user } = useAuth();
  if (!parsed.success) return <Page title="Directory unavailable"><ErrorMessage message="Invalid directory." /></Page>;
  return <Access allowed={canReadDirectory(user?.role, parsed.data)}><Directory key={parsed.data} kind={parsed.data} /></Access>;
}
function Directory({ kind }: { kind: DirectoryKind }) {
  const { user } = useAuth();
  const query = useEndpoint(directorySchema(kind), `/${kind}`, {}, canReadDirectory(user?.role, kind));
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const paging = useLocalPage(query.data?.data ?? [], search, matchesUser);
  return <Page title={labels[kind]}>
    <Hero eyebrow="User directory" title={labels[kind]} message={directoryDescriptions[kind]} icon={directoryIcons[kind]} />
    <Card><View style={local.filterHeader}><ResultSummary count={paging.pagination.total}
      label={paging.pagination.total === 1 ? "matching account" : "matching accounts"} />
      <Refresh onPress={() => { void query.refetch(); }} /></View>
      <Field label="Search directory" value={search} leading={Search} placeholder="Name, email, ID, or department"
        autoCapitalize="none" returnKeyType="search" onChangeText={value => { setSearch(value); paging.setPage(1); }} />
    </Card>
    <QueryState query={query} empty={!paging.pagination.total} />
    {!query.error && <RecordList rows={paging.rows} render={item => <PersonCard user={item} expanded={expanded === item.id}
      onPress={() => setExpanded(expanded === item.id ? null : item.id)}>
      {expanded === item.id ? <View style={local.expandedDetails}><Values values={userValues(item)} /></View> : null}
    </PersonCard>} />}
    {!query.error && <Pager {...paging} />}
  </Page>;
}
export function EmployeeListRoute() {
  const { user } = useAuth();
  return <Access allowed={canManageEmployees(user?.role)}><EmployeeList /></Access>;
}
function EmployeeList() {
  const query = useEndpoint(z.array(employeeSchema), "/employee-access/employees");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const paging = useLocalPage((query.data?.data ?? []).filter(item => !status || item.employeeProfile?.status === status), search, matchesUser);
  return <Page title="Employee access">
    <Hero eyebrow="Administration" title="Employee access" message="Create employee accounts, review assignments, and manage access status." icon={Users} />
    <Action title="Create employee" icon={Plus} primary onPress={() => router.push("/admin/employees/new" as Href)} />
    <Card><View style={local.filterHeader}><ResultSummary count={paging.pagination.total}
      label={paging.pagination.total === 1 ? "matching employee" : "matching employees"} />
      <Refresh onPress={() => { void query.refetch(); }} /></View>
      <Field label="Search employees" value={search} leading={Search} placeholder="Name, email, ID, or department"
        autoCapitalize="none" returnKeyType="search" onChangeText={value => { setSearch(value); paging.setPage(1); }} />
      <Select label="Account status" value={status} onChange={value => { setStatus(value); paging.setPage(1); }}
        options={[{ label: "All statuses", value: "" }, { label: "Active", value: "ACTIVE" }, { label: "Frozen", value: "FROZEN" }]} />
    </Card>
    <QueryState query={query} empty={!paging.pagination.total} />
    {!query.error && <RecordList rows={paging.rows} render={employee => <PersonCard user={employee}
      onPress={() => router.push(employeeHref(employee.id))} />} />}
    {!query.error && <Pager {...paging} />}
  </Page>;
}
export function EmployeeRoute({ edit = false }: { edit?: boolean }) {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const parsed = uuid.safeParse(id);
  const { user } = useAuth();
  if (!parsed.success) return <Page title="Employee unavailable"><ErrorMessage message="Invalid employee ID." /></Page>;
  return <Access allowed={canManageEmployees(user?.role)}><EmployeeRecord key={`${parsed.data}:${edit}`} id={parsed.data} edit={edit} /></Access>;
}
function EmployeeRecord({ id, edit }: { id: string; edit: boolean }) {
  const query = useEndpoint(z.array(employeeSchema), "/employee-access/employees");
  const employee = query.data?.data.find(item => item.id === id);
  if (query.isPending || query.error) return <Page title="Employee"><QueryState query={query} /></Page>;
  if (!employee) return <Page title="Employee unavailable"><ErrorMessage message="Employee not found." /><Refresh onPress={() => { void query.refetch(); }} /></Page>;
  return edit ? <EmployeeForm employee={employee} /> : <EmployeeDetail employee={employee} />;
}
function EmployeeDetail({ employee }: { employee: Employee }) {
  const { user, api } = useAuth();
  const write = useWrite();
  const [error, setError] = useState<string | null>(null);
  const profile = employee.employeeProfile;
  const locations = useEndpoint(z.array(locationSchema), "/locations");
  const ventures = useEndpoint(z.array(ventureSchema), "/ventures");
  const names = (ids: string[], records?: { id: string; name: string }[]) => ids.length
    ? ids.map(id => records?.find(item => item.id === id)?.name ?? `Unavailable (${id})`).join("\n") : "None";
  const changeStatus = async (status: "ACTIVE" | "FROZEN") => {
    try {
      setError(null);
      const response = await write.mutateAsync(employeeStatusWrite(user?.role, employee.id, status));
      const result = employeeStatusResponseSchema.parse(response.data);
      if (result.status !== status || result.userId !== employee.id) throw new Error("Unexpected status response");
    } catch (failure) { setError(readableError(failure)); }
    finally { write.reset(); }
  };
  const nextStatus = profile?.status === "ACTIVE" ? "FROZEN" : "ACTIVE";
  const statusIcon = nextStatus === "FROZEN" ? Snowflake : BadgeCheck;
  return <Page title={employee.displayName}>
    <View style={local.profileHero}><View style={local.profileAvatar}><UserRound color={theme.colors.white} size={30} /></View>
      <View style={local.heroCopy}><Text style={local.profileName}>{employee.displayName}</Text><Text selectable style={local.profileEmail}>{employee.email}</Text>
        <View style={local.pillRow}><Pill label="EMPLOYEE" tone="info" /><Pill label={profile?.status ?? "NO PROFILE"}
          tone={profile?.status === "ACTIVE" ? "success" : profile?.status === "FROZEN" ? "danger" : "neutral"} /></View></View></View>
    <Section title="Account information"><Values values={userValues(employee)} /></Section>
    {profile && <Section title="Professional profile"><Values values={{ "First name": profile.firstName, "Last name": profile.lastName,
      "Date of birth": date(profile.dateOfBirth), "Years of experience": profile.yearsOfExperience,
      "Current company": profile.currentCompany, "Previous companies": profile.previousCompanies?.join("\n"),
      "Current position": profile.currentPosition, "Assigned profile role": profile.roleGiven, Achievements: profile.achievements?.join("\n") }} /></Section>}
    <Section title="Assignments"><QueryState query={locations} /><QueryState query={ventures} />
      <Values values={{ Locations: names(profile?.assignedLocationIds ?? [], locations.data?.data),
        Ventures: names(profile?.assignedVentureIds ?? [], ventures.data?.data) }} /></Section>
    <ErrorMessage message={error} />
    <Section title="Account actions"><Action title="Edit employee" icon={Pencil} disabled={write.isPending}
      onPress={() => router.push(employeeHref(employee.id, true))} />
      <Action title={`Set ${nextStatus.toLocaleLowerCase()}`} icon={statusIcon} destructive={nextStatus === "FROZEN"}
        busy={write.isPending} disabled={!api || write.isPaused} onPress={() => Alert.alert(`Set employee ${nextStatus}?`,
          nextStatus === "FROZEN" ? "Employee account access will be frozen." : "The server will apply account and relieving-date rules.",
          [{ text: "Cancel", style: "cancel" }, { text: "Confirm", onPress: () => { void changeStatus(nextStatus); } }])} />
    </Section>
  </Page>;
}
export function EmployeeCreateRoute() {
  const { user } = useAuth();
  return <Access allowed={canManageEmployees(user?.role)}><EmployeeForm /></Access>;
}
type StringKey = { [K in keyof EmployeeDraft]: EmployeeDraft[K] extends string ? K : never }[keyof EmployeeDraft];
const profileFields: { key: StringKey; label: string; multiline?: boolean; numeric?: boolean }[] = [
  { key: "firstName", label: "First name" }, { key: "lastName", label: "Last name" },
  { key: "dateOfBirth", label: "Date of birth (YYYY-MM-DD)" }, { key: "yearsOfExperience", label: "Years of experience", numeric: true },
  { key: "currentCompany", label: "Current company" },
  { key: "currentPosition", label: "Current position" }, { key: "roleGiven", label: "Assigned profile role" },
  { key: "dateOfJoining", label: "Joining date (YYYY-MM-DD)" }, { key: "dateOfRelieving", label: "Relieving date (YYYY-MM-DD)" }
];
function LineItems({ title, itemLabel, value, onChange, disabled }: { title: string; itemLabel: string; value: string;
  onChange: (value: string) => void; disabled: boolean }) {
  const items = value.split("\n");
  return <Card><View style={local.inlineTitle}><Text style={local.cardTitle}>{title}</Text><Pill label={`${items.filter(Boolean).length}`} /></View>
    {items.map((item, index) => <View key={index} style={local.lineItem}>
      <View style={local.flex}><Field label={`${itemLabel} ${index + 1}`} value={item} editable={!disabled}
        onChangeText={next => onChange(items.map((entry, entryIndex) => entryIndex === index ? next : entry).join("\n"))} /></View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
        accessibilityState={{ disabled }} disabled={disabled} style={({ pressed }) => [local.removeButton, pressed && local.pressed]}
        onPress={() => onChange(items.filter((_, entryIndex) => entryIndex !== index).join("\n"))}>
        <X size={20} color={theme.colors.danger} />
      </Pressable>
    </View>)}
    <Action title={`Add ${itemLabel.toLowerCase()}`} icon={Plus} disabled={disabled} onPress={() => onChange(`${value}\n`)} />
  </Card>;
}
function MultiSelect({ title, selected, options, onChange, disabled, icon: Icon }: { title: string; selected: string[];
  options: { id: string; name: string }[]; onChange: (ids: string[]) => void; disabled: boolean; icon: LucideIcon }) {
  const [search, setSearch] = useState("");
  const all = [...options, ...selected.filter(id => !options.some(option => option.id === id)).map(id => ({ id, name: `Unavailable (${id})` }))];
  const visible = all.filter(option => option.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <Card><View style={local.assignmentHeader}><View style={local.assignmentTitle}><View style={local.smallIcon}>
    <Icon size={18} color={theme.colors.primary} /></View><Text style={local.cardTitle}>{title}</Text></View>
    <Pill label={`${selected.length} selected`} tone={selected.length ? "info" : "neutral"} /></View>
    <Field label={`Search ${title.toLowerCase()}`} value={search} leading={Search} returnKeyType="search" onChangeText={setSearch} />
    <View style={local.optionList}>{visible.map(option => {
      const checked = selected.includes(option.id);
      const CheckboxIcon = checked ? SquareCheck : Square;
      return <Pressable key={option.id} accessibilityRole="checkbox" accessibilityLabel={option.name}
        accessibilityState={{ checked, disabled }} disabled={disabled} onPress={() => onChange(checked ? selected.filter(id => id !== option.id) : [...selected, option.id])}
        style={({ pressed }) => [local.option, checked && local.optionSelected, pressed && local.pressed]}>
        <CheckboxIcon color={checked ? theme.colors.primary : theme.colors.muted} size={23} />
        <Text style={[local.optionText, checked && local.optionTextSelected]}>{option.name}</Text>
      </Pressable>;
    })}{!visible.length && <Text style={local.emptyCopy}>{all.length ? "No assignments match your search." : "No assignments available."}</Text>}</View>
  </Card>;
}
function VerificationSwitch({ label, value, disabled, onChange }: { label: string; value: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  return <View style={local.switchRow}><View style={local.verificationIcon}><BadgeCheck color={value ? theme.colors.available : theme.colors.muted} size={20} /></View>
    <View style={local.flex}><Text style={local.switchLabel}>{label}</Text><Text style={local.switchHint}>{value ? "Marked as verified" : "Not yet verified"}</Text></View>
    <Switch accessibilityLabel={label} accessibilityState={{ checked: value, disabled }} value={value} disabled={disabled}
      trackColor={{ false: theme.colors.borderStrong, true: theme.colors.available }} thumbColor={theme.colors.white} onValueChange={onChange} />
  </View>;
}
function EmployeeForm({ employee }: { employee?: Employee }) {
  const { user, api } = useAuth();
  const [draft, setDraft] = useState(() => employeeToDraft(employee));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Employee | null>(null);
  const write = useWrite();
  const locations = useEndpoint(z.array(locationSchema), "/locations");
  const ventures = useEndpoint(z.array(ventureSchema), "/ventures");
  const assignmentsReady = !!locations.data && !!ventures.data && !locations.error && !ventures.error && !locations.isPaused && !ventures.isPaused;
  const set = <K extends keyof EmployeeDraft>(key: K, value: EmployeeDraft[K]) => {
    setDraft(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: "" }));
  };
  const submit = async () => {
    if (!api || !canManageEmployees(user?.role) || !assignmentsReady || write.isPending) return;
    setErrors({}); setError(null);
    try {
      const mutation = employeeWrite(user?.role, draft, employee?.id);
      const response = await write.mutateAsync(mutation);
      const parsed = employeeSchema.safeParse(response.data);
      if (!parsed.success) {
        setError("Save response unavailable. Refresh the employee list before trying again.");
        return;
      }
      const result = parsed.data;
      if (employee && result.id !== employee.id) throw new Error("Unexpected employee response");
      set("password", ""); setSaved(result);
    } catch (failure) {
      if (failure instanceof z.ZodError) {
        const fields: Record<string, string> = {};
        failure.issues.forEach(issue => { fields[String(issue.path[0])] = issue.message; });
        setErrors(fields); setError("Please check the employee fields.");
      } else setError(readableError(failure));
    } finally { write.reset(); }
  };
  if (saved) return <Page title="Employee saved"><Hero eyebrow="Saved" title="Employee updated"
    message="The employee record and access settings were saved successfully." icon={Check} />
    <Values values={{ Employee: saved.displayName, Role: saved.role, Status: saved.employeeProfile?.status }} />
    <Action title="View employee" icon={UserRound} primary onPress={() => router.replace(employeeHref(saved.id))} /></Page>;
  const field = (key: StringKey, label: string, multiline = false, numeric = false) => <Field key={key} label={label}
    value={draft[key]} error={errors[key]} onChangeText={value => set(key, value as EmployeeDraft[typeof key])}
    editable={!write.isPending} multiline={multiline} keyboardType={numeric ? "number-pad" : "default"} />;
  return <Page title={employee ? "Edit employee" : "Create employee"}>
    <Hero eyebrow={employee ? "Employee record" : "New account"} title={employee ? "Update employee" : "Create employee"}
      message={employee ? "Keep identity, profile, and assignment information accurate." : "Set up an employee account and assign its operating scope."}
      icon={employee ? Pencil : Plus} />
    <Section title="Account credentials"><Card>
      {employee ? <View style={local.accountSummary}><View style={local.summaryIcon}><Mail color={theme.colors.primary} size={20} /></View>
        <View style={local.flex}><Text style={local.summaryLabel}>Account email</Text><Text selectable style={local.summaryValue}>{employee.email}</Text></View>
        <Pill label={employee.employeeProfile?.status ?? "NO PROFILE"}
          tone={employee.employeeProfile?.status === "ACTIVE" ? "success" : employee.employeeProfile?.status === "FROZEN" ? "danger" : "neutral"} />
      </View> : <Field label="Email" value={draft.email} error={errors.email} leading={Mail} autoCapitalize="none" keyboardType="email-address"
        editable={!write.isPending} onChangeText={value => set("email", value)} />}
      <Field label={employee ? "New password (optional)" : "Password"} value={draft.password} error={errors.password} leading={LockKeyhole}
        secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!write.isPending}
        hint={employee ? "Leave blank to keep the current password." : "Use at least 6 characters."} onChangeText={value => set("password", value)} />
    </Card></Section>
    <Section title="Identity and contact"><Card>
      {field("displayName", "Display name")}{field("fullName", "Full name")}{field("employeeId", "Employee ID")}
      <Field label="Phone" value={draft.phoneNumber} error={errors.phoneNumber} keyboardType="phone-pad"
        editable={!write.isPending} onChangeText={value => set("phoneNumber", value)} />
      {field("department", "Department")}{field("position", "Position")}{field("address", "Address", true)}
    </Card></Section>
    <Section title="Professional profile"><Card>{profileFields.map(item => field(item.key, item.label, item.multiline, item.numeric))}</Card></Section>
    <LineItems title="Previous companies" itemLabel="Company" value={draft.previousCompanies}
      disabled={write.isPending} onChange={value => set("previousCompanies", value)} />
    <ErrorMessage message={errors.previousCompanies} />
    <LineItems title="Achievements" itemLabel="Achievement" value={draft.achievements}
      disabled={write.isPending} onChange={value => set("achievements", value)} />
    <ErrorMessage message={errors.achievements} />
    <Section title="Verification and status"><Card>
      <VerificationSwitch label="Email verified" value={draft.emailVerified} disabled={write.isPending}
        onChange={value => set("emailVerified", value)} /><View style={local.divider} />
      <VerificationSwitch label="Phone verified" value={draft.phoneVerified} disabled={write.isPending}
        onChange={value => set("phoneVerified", value)} />
      {!employee && <Select label="Initial status" value={draft.status} onChange={value => { if (!write.isPending) set("status", value as EmployeeDraft["status"]); }}
        options={[{ label: "Active", value: "ACTIVE" }, { label: "Frozen", value: "FROZEN" }]} />}
    </Card></Section>
    <Section title="Assignments"><QueryState query={locations} /><QueryState query={ventures} />
    <MultiSelect title="Locations" icon={MapPin} selected={draft.assignedLocationIds} options={locations.data?.data ?? []}
      onChange={value => set("assignedLocationIds", value)} disabled={write.isPending || !assignmentsReady} />
    <ErrorMessage message={errors.assignedLocationIds} />
    <MultiSelect title="Ventures" icon={Building2} selected={draft.assignedVentureIds}
      options={(ventures.data?.data ?? []).map(item => ({ id: item.id,
        name: `${item.name} / ${locations.data?.data.find(location => location.id === item.locationId)?.name ?? item.locationId}` }))}
      onChange={value => set("assignedVentureIds", value)} disabled={write.isPending || !assignmentsReady} />
    <ErrorMessage message={errors.assignedVentureIds} /></Section><ErrorMessage message={error} />
    <Action title="Save employee" icon={Save} primary onPress={() => { void submit(); }} busy={write.isPending}
      disabled={!assignmentsReady || !api || !canManageEmployees(user?.role) || write.isPaused} />
  </Page>;
}

const local = StyleSheet.create({
  hero: { minHeight: 150, padding: theme.spacing.xl, flexDirection: "row", alignItems: "flex-start", gap: theme.spacing.lg,
    backgroundColor: theme.colors.navigation, borderRadius: theme.radius.lg, borderBottomWidth: 3, borderBottomColor: theme.colors.accent },
  heroIcon: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.navigationAlt },
  heroCopy: { flex: 1, gap: theme.spacing.xs },
  heroEyebrow: { color: "#8BB5FF", fontSize: 12, lineHeight: 17, fontWeight: "800", textTransform: "uppercase" },
  heroTitle: { color: theme.colors.white, fontSize: 23, lineHeight: 29, fontWeight: "800" },
  heroMessage: { color: "#C8D7E7", fontSize: 14, lineHeight: 21 },
  navigationCard: { minHeight: 96, padding: theme.spacing.lg, flexDirection: "row", alignItems: "center", gap: theme.spacing.md,
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, ...theme.shadow },
  navigationIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.infoSurface },
  navigationCopy: { flex: 1, gap: theme.spacing.xs },
  cardTitle: { flex: 1, color: theme.colors.ink, fontSize: 16, lineHeight: 21, fontWeight: "800" },
  body: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  action: { minHeight: 50, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: theme.spacing.sm, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.borderStrong },
  actionPrimary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  actionDestructive: { backgroundColor: theme.colors.dangerSurface, borderColor: "#F2C7CC" },
  actionText: { color: theme.colors.primary, fontSize: 15, lineHeight: 20, fontWeight: "800", textAlign: "center", flexShrink: 1 },
  actionTextPrimary: { color: theme.colors.white },
  actionTextDestructive: { color: theme.colors.danger },
  pressed: { opacity: 0.62 },
  filterHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.md },
  resultSummary: { flex: 1, flexDirection: "row", alignItems: "baseline", gap: theme.spacing.sm },
  resultCount: { color: theme.colors.ink, fontSize: 25, lineHeight: 30, fontWeight: "800" },
  resultLabel: { flex: 1, color: theme.colors.muted, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  personCard: { minHeight: 104, padding: theme.spacing.lg, gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, ...theme.shadow },
  personHeader: { flexDirection: "row", alignItems: "flex-start", gap: theme.spacing.md },
  avatar: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 23, backgroundColor: theme.colors.navigation },
  avatarText: { color: theme.colors.white, fontSize: 15, lineHeight: 20, fontWeight: "800" },
  personCopy: { flex: 1, gap: theme.spacing.xs },
  personName: { color: theme.colors.ink, fontSize: 16, lineHeight: 21, fontWeight: "800" },
  personEmail: { color: theme.colors.muted, fontSize: 13, lineHeight: 18 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: theme.spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, paddingLeft: 58 },
  metaText: { flex: 1, color: theme.colors.muted, fontSize: 13, lineHeight: 18 },
  expandedDetails: { paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border },
  chevronExpanded: { transform: [{ rotate: "90deg" }] },
  profileHero: { padding: theme.spacing.xl, flexDirection: "row", alignItems: "center", gap: theme.spacing.lg,
    backgroundColor: theme.colors.navigation, borderRadius: theme.radius.lg, borderBottomWidth: 3, borderBottomColor: theme.colors.accent },
  profileAvatar: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 29,
    backgroundColor: theme.colors.navigationAlt },
  profileName: { color: theme.colors.white, fontSize: 21, lineHeight: 27, fontWeight: "800" },
  profileEmail: { color: "#C8D7E7", fontSize: 13, lineHeight: 18 },
  inlineTitle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm },
  lineItem: { flexDirection: "row", alignItems: "flex-end", gap: theme.spacing.sm },
  flex: { flex: 1 },
  removeButton: { width: 50, height: 50, alignItems: "center", justifyContent: "center", borderWidth: 1,
    borderColor: "#F2C7CC", borderRadius: theme.radius.lg, backgroundColor: theme.colors.dangerSurface },
  assignmentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm },
  assignmentTitle: { flex: 1, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  smallIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.md,
    backgroundColor: theme.colors.infoSurface },
  optionList: { gap: theme.spacing.sm },
  option: { minHeight: 50, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, flexDirection: "row",
    alignItems: "center", gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface },
  optionSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.infoSurface },
  optionText: { flex: 1, color: theme.colors.ink, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  optionTextSelected: { color: theme.colors.primaryDark },
  emptyCopy: { paddingVertical: theme.spacing.md, color: theme.colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  switchRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
  verificationIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted },
  switchLabel: { color: theme.colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "800" },
  switchHint: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
  divider: { height: 1, backgroundColor: theme.colors.border },
  accountSummary: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
  summaryIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.md,
    backgroundColor: theme.colors.infoSurface },
  summaryLabel: { color: theme.colors.muted, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  summaryValue: { color: theme.colors.ink, fontSize: 14, lineHeight: 20, fontWeight: "800" }
});
