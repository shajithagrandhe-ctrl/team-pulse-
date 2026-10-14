import { useEffect, useRef, useState, type ReactNode } from "react";
import { Image, Linking, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Calendar, Download, FileText, MapPin, Pencil, Plus, RefreshCw, Search, ShieldCheck, Users, UserPlus, List, Phone } from "lucide-react-native";
import { z } from "zod";
import { useAuth } from "../../auth/AuthProvider";
import { Button, Card, ErrorMessage, Field } from "../../components/ui";
import { ConfirmDelete, encoded, Page, Pager, QueryState, RecordList, Row, Select, useEndpoint, useWrite, Values } from "../common";
import { Action, Access, CrmHero, Form, message, options, Panel, Status, type FormField } from "./ui";
import { theme } from "../../theme";
import { collectPages, createLeadSchema, credentialSchema, csv, editor, filterRows, leadColumns, leadSchema,
  leadStatuses, localDateTime, mapUrl, plotSchema, provisionResponseSchema, recordColumns, recordInputSchema,
  recordSchema, recordStatuses, reminderIcs, safeImage, trackingEditor, trackingInputSchema, trackingSchema,
  trackingStatuses, updateLeadSchema, uuid, type CustomerRecord, type Lead } from "./contracts";
import { useAll } from "./data";
import { shareExport } from "./files";

const leadFields = (row: Lead) => [row.customerName, row.email, row.contactNumber, row.location, row.uniqueId, row.notes, row.plot?.plotNumber, row.plot?.venture?.name];
const customerFields = (row: CustomerRecord) => [row.contactName, row.contactNumber, row.location, row.budget, row.recordOwner, row.leadName, row.notes];
const leadSearch = (rows: Lead[], term: string, status: string) => filterRows(rows, term, status, leadFields);
const customerSearch = (rows: CustomerRecord[], term: string, status: string) => filterRows(rows, term, status, customerFields);
const detailDate = (value: string) => new Date(value).toLocaleString();
const trackingHref = (id: string, edit = false) => `/crm/tracking/${encoded(id)}${edit ? "/edit" : ""}` as Href;
function IdScreen({ children }: { children: (id: string) => ReactNode }) {
  const params = useLocalSearchParams();
  const parsed = uuid.safeParse(params.id);
  return parsed.success ? <Access>{children(parsed.data)}</Access> : <Page title="CRM"><ErrorMessage message="Invalid record link." /></Page>;
}
function useRole() {
  const { user } = useAuth();
  return useLatest(user?.role);
}
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref;
}
function useExport() {
  const { api, user } = useAuth();
  const role = useRole();
  const session = useLatest(user?.id);
  const active = useRef(true), controller = useRef<AbortController | null>(null);
  useEffect(() => { active.current = true; return () => { active.current = false; controller.current?.abort(); }; }, []);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const run = async (kind: "leads" | "customers", search = "", status = "") => {
    if (busy) return;
    setBusy(true); setError("");
    const actor = session.current;
    controller.current = new AbortController();
    const signal = controller.current.signal;
    try {
      if (!api || !editor(role.current)) throw new Error("You do not have permission to export records.");
      let contents: string;
      if (kind === "leads") {
        const rows = await collectPages(leadSchema, (page, pageSize) => api.request("/leads", { query: { page, pageSize }, signal }));
        contents = csv(leadSearch(rows, search, status), leadColumns);
      } else {
        const rows = await collectPages(recordSchema, (page, pageSize) => api.request("/total-data", { query: { page, pageSize }, signal }));
        contents = csv(customerSearch(rows, search, status), recordColumns);
      }
      if (!active.current || actor !== session.current || !editor(role.current)) throw new Error("Your session changed. Please sign in again.");
      await shareExport(kind, contents, "csv");
    } catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  };
  return { busy, error, run };
}
export function CrmIndex() {
  const { user } = useAuth();
  return <Access><Page title="CRM">
    <CrmHero icon={Users} meta="Customer operations" title="Relationships in one place"
      description="Review prospects, manage customer records, follow field updates, and export authorized data." />
    <Panel title="Workspace" caption="Your available tools reflect your account permissions.">
      <Action icon={List} title="Leads" subtitle="Review prospects, status, plot interest, and notes." onPress={() => router.push("/crm/leads")} />
      <Action icon={Users} title="Customers" subtitle="Manage contacts, ownership, follow-ups, and records." onPress={() => router.push("/crm/customers")} />
      <Action icon={MapPin} title="Tracking" subtitle="View or record the latest authorized field position." onPress={() => router.push("/crm/tracking")} />
      {editor(user?.role) && <><Action icon={Download} title="Reports" subtitle="Export authorized lead and customer data as CSV." onPress={() => router.push("/crm/reports")} />
        <Action icon={UserPlus} title="Customer credentials" subtitle="Provision a secure customer login account." onPress={() => router.push("/crm/credentials")} /></>}
    </Panel>
  </Page></Access>;
}
function Collection({ kind }: { kind: "leads" | "customers" }) {
  const { user } = useAuth();
  const leads = useAll(leadSchema, "/leads", kind === "leads");
  const customers = useAll(recordSchema, "/total-data", kind === "customers");
  const [search, setSearch] = useState(""), [status, setStatus] = useState(""), [page, setPage] = useState(1);
  const report = useExport();
  const query = kind === "leads" ? leads : customers;
  const rows = kind === "leads" ? leadSearch(leads.data ?? [], search, status) : customerSearch(customers.data ?? [], search, status);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 30)));
  const singular = kind === "leads" ? "lead" : "customer";
  return <Page title={kind === "leads" ? "Leads" : "Customers"}>
    <CrmHero icon={kind === "leads" ? List : Users} meta={`${rows.length} ${rows.length === 1 ? singular : `${singular}s`} shown`}
      title={kind === "leads" ? "Lead pipeline" : "Customer directory"}
      description={kind === "leads" ? "Search prospects and keep every sales conversation moving." : "Find customer records quickly and keep ownership details current."} />
    {editor(user?.role) && <Action icon={Plus} title={kind === "leads" ? "Create lead" : "Create customer record"}
      subtitle={kind === "leads" ? "Add a prospect linked to an available plot." : "Add a customer to the authorized CRM directory."}
      onPress={() => router.push(`/crm/${kind}/new`)} />}
    <Panel title="Find records" caption="Search visible records and narrow the list by status.">
      <Field leading={Search} label={kind === "leads" ? "Search leads" : "Search customer records"} value={search}
        placeholder={kind === "leads" ? "Name, phone, location, plot..." : "Name, phone, location, owner..."}
        onChangeText={value => { setSearch(value); setPage(1); }} />
      <Select label="Status" value={status} options={options(kind === "leads" ? leadStatuses : recordStatuses, true)} onChange={value => { setStatus(value); setPage(1); }} />
      <Action icon={RefreshCw} title="Refresh records" subtitle="Fetch the latest authorized data." busy={query.isFetching} onPress={() => { void query.refetch(); }} />
    </Panel>
    <Panel title="Records" caption={`${rows.length} matching ${rows.length === 1 ? "record" : "records"}`}>
      <QueryState query={query} empty={rows.length === 0}
        emptyTitle={search || status ? "No matching records" : "No records available"}
        emptyMessage={search || status ? "Adjust the search or status filter and try again." : "New records will appear here when they are added."} />
      <RecordList<Lead | CustomerRecord> rows={rows.slice((currentPage - 1) * 30, currentPage * 30)} render={row => <Row
        title={kind === "leads" ? String(row.customerName) : String(row.contactName)}
        subtitle={`${row.contactNumber} | ${row.location}`} onPress={() => router.push(`/crm/${kind}/${encoded(row.id)}`)}>
        <Status value={row.status} /></Row>} />
      <Pager page={currentPage} setPage={setPage} pagination={{ page: currentPage, pageSize: 30, total: rows.length, pageCount: Math.ceil(rows.length / 30) }} />
    </Panel>
    {editor(user?.role) && <Panel title="Export" caption="The exported CSV respects your current authorization and filters.">
      <Action icon={Download} title={search || status ? "Export matching records CSV" : "Export all records CSV"}
        subtitle="Generate a shareable file from the records you can access."
        busy={report.busy || query.isFetching || !!query.error} onPress={() => { void report.run(kind, search, status); }} />
      <ErrorMessage message={report.error} />
    </Panel>}
  </Page>;
}
export const LeadsList = () => <Access><Collection kind="leads" /></Access>;
export const CustomersList = () => <Access><Collection kind="customers" /></Access>;

function LeadPhoto({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);
  const uri = safeImage(url);
  return uri && !failed ? <Image source={{ uri }} accessibilityLabel="Lead photo" resizeMode="cover"
    style={styles.leadPhoto} onError={() => setFailed(true)} /> : null;
}
function LeadDetailContent({ id }: { id: string }) {
  const { user } = useAuth();
  const query = useAll(leadSchema, "/leads");
  const row = query.data?.find(item => item.id === id);
  const write = useWrite(); const role = useRole();
  const [error, setError] = useState("");
  const remove = async () => {
    try {
      if (!editor(role.current) || query.error) throw new Error("You do not have permission to delete this lead.");
      await write.mutateAsync({ path: `/leads/${encoded(id)}`, method: "DELETE" }); router.replace("/crm/leads");
    } catch (failure) { setError(message(failure)); }
  };
  return <Page title={row?.customerName ?? "Lead"}><QueryState query={query} />
    {!query.isPending && !query.error && !row && <ErrorMessage message="Lead not found or access denied." />}
    {row && <><CrmHero icon={List} meta="Lead profile" title={row.customerName}
      description={[row.location, row.plot?.venture?.name].filter(Boolean).join(" | ") || "Sales pipeline record"} />
      <Panel title="Lead overview" caption="Contact, property interest, assignment, and history.">
        <Status value={row.status} /><LeadPhoto url={row.photoUrl} /><Values values={{
        "Customer name": row.customerName, Email: row.email, Phone: row.contactNumber, Location: row.location,
        "Unique ID": row.uniqueId, Plot: row.plot?.plotNumber ?? row.plotId, Venture: row.plot?.venture?.name,
        "Price per sq yard": row.pricePerSqYard, "Assigned user ID": row.agentId, Notes: row.notes,
        Created: detailDate(row.createdAt), Updated: detailDate(row.updatedAt) }} />
      </Panel>
      {editor(user?.role) && !query.error && <Panel title="Lead actions" caption="Changes are applied to this lead record only.">
        <Action icon={Pencil} title="Edit lead" subtitle="Update contact, status, pricing, or notes." onPress={() => router.push(`/crm/leads/${encoded(id)}/edit`)} />
        <ConfirmDelete title={row.customerName} busy={write.isPending} onConfirm={() => { void remove(); }} />
      </Panel>}
    </>}<ErrorMessage message={error} /></Page>;
}
export const LeadDetail = () => <IdScreen>{id => <LeadDetailContent id={id} />}</IdScreen>;

const editableLeadFields: FormField[] = [
  { name: "contactNumber", label: "Contact number", type: "phone" }, { name: "location", label: "Location" },
  { name: "uniqueId", label: "Unique ID" }, { name: "pricePerSqYard", label: "Price per sq yard", type: "number" },
  { name: "status", label: "Lead status", type: "select", options: options(leadStatuses) },
  { name: "notes", label: "Notes", type: "multiline" }
];
function LeadEditContent({ id }: { id: string }) {
  const query = useAll(leadSchema, "/leads"); const row = query.data?.find(item => item.id === id);
  const write = useWrite(); const role = useRole();
  return <Page title="Edit lead"><CrmHero icon={Pencil} meta="Lead workflow" title="Update lead"
    description="Keep the contact, pricing, status, and notes accurate without changing the linked identity." /><QueryState query={query} />
    {!query.isPending && !query.error && !row && <ErrorMessage message="Lead not found or access denied." />}
    {row && <><Values values={{ Customer: row.customerName, Email: row.email, Plot: row.plot?.plotNumber ?? row.plotId }} />
      <Form key={row.id} fields={editableLeadFields} initial={row} schema={updateLeadSchema} disabled={!!query.error} onSave={async body => {
        if (!editor(role.current)) throw new Error("You do not have permission to edit leads.");
        const response = await write.mutateAsync({ path: `/leads/${encoded(id)}`, method: "PUT", body: updateLeadSchema.parse(body) });
        leadSchema.parse(response.data); router.replace(`/crm/leads/${encoded(id)}`);
      }} /></>}
  </Page>;
}
export const LeadEdit = () => <Access permission="write"><IdScreen>{id => <LeadEditContent id={id} />}</IdScreen></Access>;
function LeadCreateContent() {
  const { user } = useAuth(); const role = useRole(); const write = useWrite();
  const plots = useAll(plotSchema, "/plots");
  const params = useLocalSearchParams();
  const selected = uuid.safeParse(params.plotId);
  const fields: FormField[] = [
    { name: "plotId", label: "Plot", type: "select", options: [{ label: "Choose a plot", value: "" }, ...(plots.data ?? []).map(plot => ({ label: `${plot.venture?.name ?? "Plot"} / ${plot.plotNumber}`, value: plot.id }))] },
    { name: "customerName", label: "Customer name" }, { name: "email", label: "Customer email", type: "email" },
    ...editableLeadFields.filter(field => field.name !== "status"),
    { name: "photoUrl", label: "Photo URL (optional)", optional: true },
    ...(user?.role === "ADMIN" ? [{ name: "agentId", label: "Assigned user ID (optional)", optional: true } satisfies FormField] : [])
  ];
  return <Page title="Create lead"><CrmHero icon={Plus} meta="Lead workflow" title="Add a prospect"
    description="Connect a new lead to an authorized plot and capture the sales details your team needs." />
    <QueryState query={plots} empty={!plots.data?.length} />
    {!!plots.data?.length && <Form fields={fields} initial={{ plotId: selected.success ? selected.data : "" }}
      schema={createLeadSchema.extend({ plotId: uuid, agentId: uuid.optional() })}
      title="Create lead" disabled={!!plots.error} onSave={async body => {
        if (!editor(role.current)) throw new Error("You do not have permission to create leads.");
        uuid.parse(body.plotId); if (body.agentId) uuid.parse(body.agentId);
        if (!plots.data?.some(plot => plot.id === body.plotId)) throw new Error("Choose a permitted plot.");
        const response = await write.mutateAsync({ path: "/leads", method: "POST", body: createLeadSchema.parse(body) });
        const saved = leadSchema.parse(response.data); router.replace(`/crm/leads/${encoded(saved.id)}`);
      }} />}
  </Page>;
}
export const LeadCreate = () => <Access permission="write"><LeadCreateContent /></Access>;

function CustomerDetailContent({ id }: { id: string }) {
  const query = useAll(recordSchema, "/total-data"); const row = query.data?.find(item => item.id === id);
  const { user } = useAuth(); const role = useRole(); const write = useWrite(); const [error, setError] = useState("");
  const remove = async () => {
    try {
      if (!editor(role.current) || query.error) throw new Error("You do not have permission to delete customer records.");
      await write.mutateAsync({ path: `/total-data/${encoded(id)}`, method: "DELETE" }); router.replace("/crm/customers");
    } catch (failure) { setError(message(failure)); }
  };
  return <Page title={row?.contactName ?? "Customer record"}><QueryState query={query} />
    {!query.isPending && !query.error && !row && <ErrorMessage message="Customer record not found or access denied." />}
    {row && <><CrmHero icon={Users} meta="Customer profile" title={row.contactName}
      description={[row.location, row.recordOwner ? `Owner: ${row.recordOwner}` : ""].filter(Boolean).join(" | ")} />
      <Panel title="Customer overview" caption="Contact, sales status, ownership, and activity history.">
        <Status value={row.status} /><Values values={{ Customer: row.contactName, Phone: row.contactNumber,
        Location: row.location, Budget: row.budget, Interested: row.interested ? "Yes" : "No", Owner: row.recordOwner,
        "Lead name": row.leadName, Notes: row.notes, Created: detailDate(row.createdAt), Updated: detailDate(row.updatedAt) }} />
      </Panel>
      <Panel title="Contact and location" caption="Use the saved customer details for the next action.">
        <Action icon={Phone} title="Call customer" subtitle="Open this contact number in the phone app." onPress={() => { const phone = row.contactNumber.replace(/[^\d+]/g, "");
          if (phone) void Linking.openURL(`tel:${phone}`).catch(failure => setError(message(failure))); }} />
        <Action icon={MapPin} title="Tracking" subtitle="Review the latest authorized location update." onPress={() => router.push(trackingHref(id))} />
      </Panel>
      {editor(user?.role) && !query.error && <Panel title="Record actions" caption="Edit the record, prepare a follow-up, or remove it.">
        <Action icon={Pencil} title="Edit customer record" subtitle="Update contact, ownership, interest, and notes." onPress={() => router.push(`/crm/customers/${encoded(id)}/edit`)} />
        <Action icon={Calendar} title="Export follow-up" subtitle="Create and share a calendar event file." onPress={() => router.push(`/crm/customers/${encoded(id)}/follow-up`)} />
        <ConfirmDelete title={row.contactName} busy={write.isPending} onConfirm={() => { void remove(); }} />
      </Panel>}
    </>}<ErrorMessage message={error} /></Page>;
}
export const CustomerDetail = () => <IdScreen>{id => <CustomerDetailContent id={id} />}</IdScreen>;
const recordFormFields: FormField[] = [
  { name: "contactName", label: "Customer name" }, { name: "contactNumber", label: "Contact number", type: "phone" },
  { name: "location", label: "Location" }, { name: "budget", label: "Budget" },
  { name: "status", label: "Customer status", type: "select", options: options(recordStatuses) },
  { name: "interested", label: "Interested", type: "switch" }, { name: "recordOwner", label: "Record owner" },
  { name: "leadName", label: "Lead name (optional)", optional: true }, { name: "notes", label: "Notes", type: "multiline" }
];
function CustomerForm({ row, disabled = false }: { row?: CustomerRecord; disabled?: boolean }) {
  const { user } = useAuth(); const role = useRole(); const write = useWrite();
  const owner = user?.fullName?.trim() || user?.displayName?.trim() || user?.email;
  const fields = recordFormFields.map(field => user?.role === "EMPLOYEE" && ["recordOwner", "leadName"].includes(field.name)
    ? { ...field, readOnly: true } : field);
  const initial = { status: "FOLLOWING_UP", interested: false, recordOwner: owner, leadName: owner, ...row,
    ...(user?.role === "EMPLOYEE" ? { recordOwner: owner, leadName: owner } : {}) };
  return <Form fields={fields} initial={initial} schema={recordInputSchema} title={row ? "Save customer record" : "Create customer record"}
    disabled={disabled} onSave={async body => {
      if (!editor(role.current)) throw new Error("You do not have permission to edit customer records.");
      const response = await write.mutateAsync({ path: row ? `/total-data/${encoded(row.id)}` : "/total-data",
        method: row ? "PUT" : "POST", body: recordInputSchema.parse(body) });
      const saved = recordSchema.parse(response.data); router.replace(`/crm/customers/${encoded(saved.id)}`);
    }} />;
}
function CustomerEditContent({ id }: { id: string }) {
  const query = useAll(recordSchema, "/total-data"); const row = query.data?.find(item => item.id === id);
  return <Page title="Edit customer record"><CrmHero icon={Pencil} meta="Customer workflow" title="Update customer"
    description="Keep contact, budget, ownership, interest, and follow-up details accurate." /><QueryState query={query} />
    {!query.isPending && !query.error && !row && <ErrorMessage message="Customer record not found or access denied." />}
    {row && <CustomerForm key={row.id} row={row} disabled={!!query.error} />}</Page>;
}
export const CustomerCreate = () => <Access permission="write"><Page title="Create customer record">
  <CrmHero icon={UserPlus} meta="Customer workflow" title="Add a customer"
    description="Create an authorized CRM record with clear ownership and sales context." /><CustomerForm />
</Page></Access>;
export const CustomerEdit = () => <Access permission="write"><IdScreen>{id => <CustomerEditContent id={id} />}</IdScreen></Access>;

function CredentialsContent() {
  const { api } = useAuth(); const role = useRole(); const [created, setCreated] = useState("");
  const fields: FormField[] = [{ name: "email", label: "Customer email", type: "email" },
    { name: "password", label: "Initial password", type: "password" }, { name: "displayName", label: "Display name" },
    { name: "fullName", label: "Full name" }, { name: "phoneNumber", label: "Phone number (optional)", type: "phone", optional: true },
    { name: "address", label: "Address (optional)", type: "multiline", optional: true }];
  return <Page title="Customer credentials">
    <CrmHero icon={ShieldCheck} meta="Access management" title="Provision customer access"
      description="Create a customer login using the existing authorization and account rules." />
    {created ? <Card style={styles.successCard}><View style={styles.successIcon}><ShieldCheck color={theme.colors.available} size={24} /></View>
      <View style={styles.successCopy}><Text accessibilityRole="alert" style={styles.successTitle}>Customer account created</Text>
        <Text selectable style={styles.successText}>{created}</Text></View>
      <Button title="Create another customer account" secondary onPress={() => setCreated("")} /></Card>
    : <Form fields={fields} initial={{}} schema={credentialSchema} title="Create customer account" clearPassword onSave={async body => {
      if (!api || !editor(role.current)) throw new Error("You do not have permission to provision customer accounts.");
      const response = await api.request("/auth/customers", { method: "POST", body: credentialSchema.parse(body) });
      const saved = provisionResponseSchema.parse(response.data); setCreated(saved.user.email);
    }} />}</Page>;
}
export const Credentials = () => <Access permission="write"><CredentialsContent /></Access>;

function TrackingListContent() {
  const { user } = useAuth();
  const updates = useEndpoint(z.array(trackingSchema), "/tracking"); const customers = useAll(recordSchema, "/total-data");
  const [search, setSearch] = useState(""), [status, setStatus] = useState(""), [page, setPage] = useState(1);
  const names = new Map((customers.data ?? []).map(row => [row.id, row]));
  const rows = filterRows(updates.data?.data ?? [], search, status, row => [names.get(row.customerId)?.contactName,
    names.get(row.customerId)?.contactNumber, row.customerId, row.address, row.latitude, row.longitude]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 30)));
  return <Page title="Tracking">
    <CrmHero icon={MapPin} meta={`${rows.length} ${rows.length === 1 ? "update" : "updates"} shown`} title="Customer tracking"
      description="Review the latest manually recorded field position for authorized customers." />
    {trackingEditor(user?.role) && <Action icon={Plus} title="Add manual update" subtitle="Record coordinates, status, and an address for a customer." onPress={() => router.push("/crm/tracking/new")} />}
    <Panel title="Find updates" caption="Search customer or location details and filter by movement status.">
      <Field leading={Search} label="Search tracking" placeholder="Customer, phone, address, coordinates..." value={search} onChangeText={value => { setSearch(value); setPage(1); }} />
      <Select label="Tracking status" value={status} options={options(trackingStatuses, true)} onChange={value => { setStatus(value); setPage(1); }} />
      <Action icon={RefreshCw} title="Refresh updates" subtitle="Fetch the latest tracking and customer records." busy={updates.isFetching || customers.isFetching} onPress={() => { void updates.refetch(); void customers.refetch(); }} />
    </Panel>
    <Panel title="Latest positions" caption={`${rows.length} matching ${rows.length === 1 ? "record" : "records"}`}>
      <QueryState query={updates} empty={!rows.length} /><QueryState query={customers} />
      <RecordList rows={rows.slice((currentPage - 1) * 30, currentPage * 30)} render={row => <Row title={names.get(row.customerId)?.contactName ?? row.customerId}
        subtitle={`${row.address || `${row.latitude}, ${row.longitude}`} | ${detailDate(row.updatedAt)}`}
        onPress={() => router.push(trackingHref(row.customerId))}><Status value={row.status} /></Row>} />
      <Pager page={currentPage} setPage={setPage} pagination={{ page: currentPage, pageSize: 30, total: rows.length, pageCount: Math.ceil(rows.length / 30) }} />
    </Panel>
  </Page>;
}
export const TrackingList = () => <Access><TrackingListContent /></Access>;
function TrackingDetailContent({ id }: { id: string }) {
  const { user } = useAuth(); const [error, setError] = useState("");
  const updates = useEndpoint(z.array(trackingSchema), "/tracking"); const customers = useAll(recordSchema, "/total-data");
  const customer = customers.data?.find(row => row.id === id), update = updates.data?.data.find(row => row.customerId === id);
  return <Page title={customer?.contactName ?? "Tracking detail"}><QueryState query={customers} /><QueryState query={updates} />
    {!customers.isPending && !customers.error && !customer && <ErrorMessage message="Customer record not found or access denied." />}
    {customer && <><CrmHero icon={MapPin} meta="Tracking detail" title={customer.contactName}
      description={update ? `Last updated ${detailDate(update.updatedAt)}` : "No tracking position has been recorded yet."} />
      <Action icon={Users} title="Customer record" subtitle="Return to the full customer profile." onPress={() => router.push(`/crm/customers/${encoded(id)}`)} />
      {update ? <Panel title="Saved position" caption="Coordinates and address from the latest authorized update.">
        <Status value={update.status} /><Values values={{ Latitude: update.latitude, Longitude: update.longitude,
          Address: update.address, Updated: detailDate(update.updatedAt), "Updated by user ID": update.updatedBy }} />
        <Action icon={MapPin} title="Open saved position in Maps" subtitle="Open these coordinates in the device map app." onPress={() => {
          void Linking.openURL(mapUrl(update.latitude, update.longitude)).catch(failure => setError(message(failure)));
        }} /></Panel> : !updates.isPending && !updates.error && <Card><Text style={styles.emptyCopy}>No tracking update has been recorded for this customer.</Text></Card>}
      {trackingEditor(user?.role) && !customers.error && !updates.error && !updates.isPending && <Action icon={Pencil} title="Update position manually"
        subtitle="Replace the latest coordinates, status, and address." onPress={() => router.push(trackingHref(id, true))} />}
    </>}<ErrorMessage message={error} /></Page>;
}
export const TrackingDetail = () => <IdScreen>{id => <TrackingDetailContent id={id} />}</IdScreen>;
function TrackingFormContent({ id }: { id?: string }) {
  const role = useRole(); const write = useWrite();
  const customers = useAll(recordSchema, "/total-data");
  const updates = useEndpoint(z.array(trackingSchema), "/tracking");
  const row = updates.data?.data.find(item => item.customerId === id);
  const customer = customers.data?.find(item => item.id === id);
  const fields: FormField[] = [
    { name: "customerId", label: "Customer", type: "select", readOnly: !!id,
      options: [{ label: "Choose a customer", value: "" }, ...(customers.data ?? []).filter(item => !id || item.id === id)
        .map(item => ({ label: `${item.contactName} / ${item.contactNumber}`, value: item.id }))] },
    { name: "latitude", label: "Latitude", type: "number" }, { name: "longitude", label: "Longitude", type: "number" },
    { name: "status", label: "Tracking status (optional)", type: "select", optional: true,
      options: [{ label: "Not provided", value: "" }, ...options(trackingStatuses)] },
    { name: "address", label: "Address", type: "multiline" }
  ];
  return <Page title="Manual tracking update"><CrmHero icon={MapPin} meta="Field update" title={id ? "Update saved position" : "Record a position"}
    description="Enter verified coordinates and location details for an authorized customer." />
    <QueryState query={customers} empty={!customers.data?.length} /><QueryState query={updates} />
    {id && !customers.isPending && !customers.error && !customer && <ErrorMessage message="Customer record not found or access denied." />}
    {!updates.isPending && !customers.isPending && !!customers.data?.length && (!id || customer) &&
      <Form key={id ?? "new"} fields={fields} initial={{ ...row, customerId: id ?? "" }} schema={trackingInputSchema}
        disabled={!!customers.error || !!updates.error} title="Save position" onSave={async body => {
          if (!trackingEditor(role.current)) throw new Error("You do not have permission to update tracking.");
          const customerId = uuid.parse(body.customerId);
          if (!customers.data?.some(item => item.id === customerId)) throw new Error("Choose a permitted customer.");
          const response = await write.mutateAsync({ path: "/tracking", method: "POST", body: trackingInputSchema.parse(body) });
          trackingSchema.parse(response.data); router.replace(trackingHref(customerId));
        }} />}
  </Page>;
}
export const TrackingCreate = () => <Access permission="tracking"><TrackingFormContent /></Access>;
export const TrackingEdit = () => <Access permission="tracking"><IdScreen>{id => <TrackingFormContent id={id} />}</IdScreen></Access>;

function FollowUpContent({ id }: { id: string }) {
  const query = useAll(recordSchema, "/total-data"); const row = query.data?.find(item => item.id === id);
  const role = useRole(); const [date, setDate] = useState(""), [time, setTime] = useState(""), [notes, setNotes] = useState("");
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const run = async () => {
    if (busy) return; setError(""); setErrors({});
    const fields = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter YYYY-MM-DD."),
      time: z.string().regex(/^\d{2}:\d{2}$/, "Enter HH:MM in 24-hour time."), notes: z.string() }).safeParse({ date, time, notes });
    if (!fields.success) { setErrors(Object.fromEntries(fields.error.issues.map(issue => [String(issue.path[0]), issue.message]))); return; }
    setBusy(true);
    try {
      if (!row || !editor(role.current) || query.error) throw new Error("You do not have permission to export this follow-up.");
      await shareExport("follow-up", reminderIcs(row, localDateTime(date, time), notes), "ics");
    } catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  };
  return <Page title="Follow-up export"><CrmHero icon={Calendar} meta="Calendar export" title="Plan the next conversation"
    description="Create a local calendar event file for this customer follow-up." /><QueryState query={query} />
    {!query.isPending && !query.error && !row && <ErrorMessage message="Customer record not found or access denied." />}
    {row && <><Values values={{ Customer: row.contactName, "Time zone": Intl.DateTimeFormat().resolvedOptions().timeZone }} />
      <Card><Field label="Follow-up date" hint="Use YYYY-MM-DD." placeholder="YYYY-MM-DD" value={date} editable={!busy} onChangeText={setDate} error={errors.date} />
        <Field label="Local time" hint="Use 24-hour HH:MM format." placeholder="HH:MM" value={time} editable={!busy} onChangeText={setTime} error={errors.time} />
        <Field label="Follow-up notes" value={notes} editable={!busy} onChangeText={setNotes} multiline />
        <Action icon={Calendar} title="Export calendar event" subtitle="Generate and share an ICS calendar file." busy={busy || !!query.error} onPress={() => { void run(); }} />
      </Card></>}<ErrorMessage message={error} /></Page>;
}
export const FollowUp = () => <Access permission="write"><IdScreen>{id => <FollowUpContent id={id} />}</IdScreen></Access>;
function ReportsContent() {
  const report = useExport();
  return <Page title="Reports"><CrmHero icon={FileText} meta="Authorized exports" title="CRM reports"
    description="Generate shareable CSV files from the lead and customer records your role can access." />
    <Panel title="Choose a report" caption="Exports use live records and preserve backend authorization.">
      <Action icon={Download} title="Export all authorized leads CSV" subtitle="Include every lead visible to your account." busy={report.busy}
        onPress={() => { void report.run("leads"); }} />
      <Action icon={Download} title="Export all authorized customer records CSV" subtitle="Include every customer record visible to your account." busy={report.busy}
        onPress={() => { void report.run("customers"); }} />
      <ErrorMessage message={report.error} />
    </Panel></Page>;
}
export const Reports = () => <Access permission="write"><ReportsContent /></Access>;

const styles = StyleSheet.create({
  leadPhoto: { width: "100%", aspectRatio: 1.55, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surfaceMuted },
  successCard: { alignItems: "stretch", gap: 14 },
  successIcon: { width: 48, height: 48, borderRadius: theme.radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.successSurface },
  successCopy: { gap: 3 },
  successTitle: { color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  successText: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  emptyCopy: { color: theme.colors.muted, fontSize: 14, lineHeight: 21 }
});
