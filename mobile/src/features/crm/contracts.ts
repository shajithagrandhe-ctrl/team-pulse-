import { z } from "zod";

export const uuid = z.string().uuid();
export const leadStatuses = ["NEW", "FOLLOW_UP", "QUALIFIED", "WON", "LOST"] as const;
export const recordStatuses = ["HOT_LEAD", "FOLLOWING_UP", "CONFIRMED_NOT_PAID", "PAID_ADVANCE", "BOOKED"] as const;
export const trackingStatuses = ["ACTIVE", "INACTIVE", "MOVING"] as const;
export const reader = (role?: string) => ["ADMIN", "EMPLOYEE", "AGENT", "CUSTOMER"].includes(role ?? "");
export const editor = (role?: string) => role === "ADMIN" || role === "EMPLOYEE";
export const trackingEditor = (role?: string) => editor(role) || role === "AGENT";
export const label = (value: string) => value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

// Keep create and update separate: the server cannot update a lead's identity or plot.
export const createLeadSchema = z.object({
  plotId: z.string().min(1), plotNumber: z.string().optional(), customerName: z.string().min(2),
  email: z.string().email(), contactNumber: z.string().min(6), location: z.string().min(2),
  uniqueId: z.string().min(3), pricePerSqYard: z.number().int().positive(), notes: z.string().optional(),
  photoUrl: z.string().url().optional(), agentId: z.string().optional()
}).strict();
export const updateLeadSchema = z.object({
  notes: z.string().optional(), status: z.enum(leadStatuses).optional(),
  pricePerSqYard: z.number().int().positive().optional(), contactNumber: z.string().optional(),
  location: z.string().optional(), uniqueId: z.string().optional()
}).strict();
export const recordInputSchema = z.object({
  contactName: z.string().min(2), contactNumber: z.string().min(6), location: z.string().min(2),
  budget: z.string().min(1), interested: z.boolean().optional(), status: z.enum(recordStatuses).optional(),
  recordOwner: z.string().min(2), leadName: z.string().min(2).optional(), notes: z.string().optional()
}).strict();
export const trackingInputSchema = z.object({
  customerId: z.string().min(1), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
  status: z.enum(["active", "inactive", "moving", ...trackingStatuses]).transform(v => v.toUpperCase()).optional(),
  address: z.string().optional()
}).strict();
export const credentialSchema = z.object({
  email: z.string().email(), password: z.string().min(8), displayName: z.string().min(2),
  fullName: z.string().min(2), phoneNumber: z.string().optional(), address: z.string().optional()
}).strict();
const timestamp = z.string().datetime({ offset: true });
export const plotSchema = z.object({ id: uuid, plotNumber: z.string(), pricePerSqYard: z.number().int(),
  venture: z.object({ name: z.string() }).passthrough().optional() }).passthrough();
export const leadSchema = z.object({
  id: uuid, plotId: uuid, customerName: z.string(), email: z.string().email(), contactNumber: z.string(),
  location: z.string(), uniqueId: z.string(), pricePerSqYard: z.number().int(), status: z.enum(leadStatuses),
  notes: z.string().nullable(), photoUrl: z.string().nullable(), agentId: uuid.nullable(),
  createdAt: timestamp, updatedAt: timestamp, plot: plotSchema.optional()
}).passthrough();
export const recordSchema = recordInputSchema.extend({ id: uuid, interested: z.boolean(), status: z.enum(recordStatuses),
  leadName: z.string().nullable(), notes: z.string().nullable(), createdAt: timestamp, updatedAt: timestamp }).passthrough();
export const trackingSchema = z.object({ id: uuid, customerId: uuid, latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180), status: z.enum(trackingStatuses).nullable(),
  address: z.string().nullable(), updatedAt: timestamp, updatedBy: uuid.nullable() }).passthrough();
export const provisionResponseSchema = z.object({ user: z.object({ id: uuid, email: z.string().email(),
  fullName: z.string(), displayName: z.string(), role: z.literal("CUSTOMER") }).passthrough() });
export const paginationSchema = z.object({ page: z.number().int().safe().positive(), pageSize: z.number().int().min(1).max(100),
  total: z.number().int().safe().nonnegative(), pageCount: z.number().int().safe().nonnegative() });
export type Lead = z.infer<typeof leadSchema>;
export type CustomerRecord = z.infer<typeof recordSchema>;
export type Tracking = z.infer<typeof trackingSchema>;

type PageRequest = (page: number, pageSize: number) => Promise<{ data: unknown; pagination?: unknown }>;
// Never treat a clamped pageSize or missing pagination as a complete dataset.
export async function collectPages<T extends { id: string }>(schema: z.ZodType<T>, request: PageRequest) {
  const rows: T[] = [];
  const seen = new Set<string>();
  let expectedTotal: number | undefined;
  let expectedSize: number | undefined;
  for (let page = 1; ; page++) {
    const response = await request(page, 100);
    const meta = paginationSchema.parse(response.pagination);
    const batch = z.array(schema).parse(response.data);
    if (meta.page !== page || meta.pageCount !== Math.ceil(meta.total / meta.pageSize) ||
        (expectedTotal !== undefined && meta.total !== expectedTotal) ||
        (expectedSize !== undefined && meta.pageSize !== expectedSize) || meta.pageCount > 1000000 ||
        batch.length !== Math.min(meta.pageSize, Math.max(0, meta.total - (page - 1) * meta.pageSize))) {
      throw new Error("Records changed or pagination is incomplete. Refresh and try again.");
    }
    expectedTotal = meta.total; expectedSize = meta.pageSize;
    for (const row of batch) {
      if (seen.has(row.id)) throw new Error("Records changed during loading. Refresh and try again.");
      seen.add(row.id); rows.push(row);
    }
    if (page >= meta.pageCount) return rows;
  }
}

export function filterRows<T extends { status?: string | null }>(rows: T[], search: string, status: string, fields: (row: T) => unknown[]) {
  const term = search.trim().toLocaleLowerCase();
  return rows.filter(row => (!status || row.status === status) && (!term || fields(row).some(value =>
    String(value ?? "").toLocaleLowerCase().includes(term))));
}
export const finiteNumber = (value: string) => value.trim() === "" ? NaN : Number(value);
export const safeImage = (value?: string | null) => {
  try { const url = new URL(value ?? ""); return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined; }
  catch { return undefined; }
};
export function mapUrl(latitude: number, longitude: number) {
  const coords = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }).parse({ latitude, longitude });
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${coords.latitude},${coords.longitude}`)}`;
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+\-@]/u.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function csv<T>(rows: T[], columns: { title: string; value: (row: T) => unknown }[]) {
  return "\uFEFF" + [columns.map(c => csvCell(c.title)).join(","), ...rows.map(row => columns.map(c => csvCell(c.value(row))).join(","))].join("\r\n") + "\r\n";
}
export const leadColumns = ["id", "customerName", "email", "contactNumber", "location", "uniqueId", "plotId", "agentId", "pricePerSqYard", "status", "notes", "createdAt", "updatedAt"].map(key => ({ title: label(key), value: (row: Lead) => row[key] }));
export const recordColumns = ["id", "contactName", "contactNumber", "location", "budget", "interested", "status", "recordOwner", "leadName", "notes", "createdAt", "updatedAt"].map(key => ({ title: label(key), value: (row: CustomerRecord) => row[key] }));
const icsText = (value: string) => value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
const icsDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
// RFC 5545 limits content lines to 75 UTF-8 octets, including continuation spaces.
export function foldIcs(line: string) {
  let result = "", size = 0;
  for (const char of line) {
    const bytes = new TextEncoder().encode(char).length;
    if (size + bytes > 75) { result += "\r\n "; size = 1; }
    result += char; size += bytes;
  }
  return result;
}
export function localDateTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error("Enter a date as YYYY-MM-DD and time as HH:MM.");
  const [year, month, day] = date.split("-").map(Number), [hour, minute] = time.split(":").map(Number);
  const value = new Date(year, month - 1, day, hour, minute);
  if (value.getFullYear() !== year || value.getMonth() !== month - 1 || value.getDate() !== day || value.getHours() !== hour || value.getMinutes() !== minute) {
    throw new Error("Enter a valid local date and time.");
  }
  return value;
}
export function reminderIcs(record: CustomerRecord, start: Date, notes: string, now = new Date()) {
  uuid.parse(record.id);
  if (!Number.isFinite(start.getTime()) || start <= now) throw new Error("Choose a future follow-up date and time.");
  const description = [`Customer: ${record.contactName}`, `Phone: ${record.contactNumber}`, `Location: ${record.location}`,
    `Budget: ${record.budget}`, `Status: ${label(record.status)}`, `Agent: ${record.leadName || record.recordOwner}`, notes && `Notes: ${notes}`].filter(Boolean).join("\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Venture Plus//Customer Follow-up//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:customer-${record.id}-${now.getTime()}@ventureplus`, `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(start)}`, `DTEND:${icsDate(new Date(start.getTime() + 30 * 60 * 1000))}`,
    `SUMMARY:${icsText(`Follow-up: ${record.contactName}`)}`, `DESCRIPTION:${icsText(description)}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Reminder", "TRIGGER:-PT15M", "END:VALARM", "END:VEVENT", "END:VCALENDAR"
  ].map(foldIcs).join("\r\n") + "\r\n";
}
