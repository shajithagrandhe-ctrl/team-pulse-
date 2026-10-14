import { z } from "zod";

export const uuid = z.string().uuid();
export const statusSchema = z.enum(["ACTIVE", "FROZEN"]);
export const directoryKindSchema = z.enum(["admins", "employees", "customers"]);
export type DirectoryKind = z.infer<typeof directoryKindSchema>;
export const canManageEmployees = (role?: string) => role === "ADMIN";
export const canReadDirectory = (role: string | undefined, kind: DirectoryKind) =>
  role === "ADMIN" || (role === "EMPLOYEE" && kind !== "admins");
const text = z.string().nullable();
const timestamp = z.string().datetime({ offset: true }).nullable();
const directoryProfile = z.object({ status: statusSchema, emailVerified: z.boolean(), phoneVerified: z.boolean(),
  dateOfJoining: timestamp, dateOfRelieving: timestamp });
export const directoryUserSchema = z.object({
  id: uuid, email: z.string().email(), displayName: z.string(), fullName: text,
  role: z.enum(["ADMIN", "EMPLOYEE", "AGENT", "CUSTOMER"]), department: text, position: text,
  employeeId: text, phoneNumber: text, address: text, createdAt: z.string().datetime({ offset: true }),
  lastLogin: timestamp, employeeProfile: directoryProfile.nullable()
});
export const employeeProfileSchema = directoryProfile.extend({
  firstName: text, lastName: text, dateOfBirth: timestamp,
  yearsOfExperience: z.number().int().min(0).max(80).nullable(), currentCompany: text,
  previousCompanies: z.array(z.string()).nullable(), currentPosition: text, roleGiven: text,
  achievements: z.array(z.string()).nullable(),
  assignedLocationIds: z.array(uuid), assignedVentureIds: z.array(uuid)
});
export const employeeStatusResponseSchema = employeeProfileSchema.omit({ assignedLocationIds: true, assignedVentureIds: true })
  .extend({ userId: uuid });
export const employeeSchema = directoryUserSchema.extend({ role: z.literal("EMPLOYEE"),
  employeeProfile: employeeProfileSchema.nullable() });
export type Employee = z.infer<typeof employeeSchema>;
export type DirectoryUser = z.infer<typeof directoryUserSchema>;
export const locationSchema = z.object({ id: uuid, name: z.string() });
export const ventureSchema = locationSchema.extend({ locationId: uuid });

// Calendar validation prevents JavaScript's silent rollover of invalid dates.
export const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").refine(value => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid calendar date");
const nullableInput = (minimum = 0) => z.string().trim().min(minimum).nullable();
const employeeFields = z.object({
  displayName: z.string().trim().min(2), fullName: z.string().trim().min(2),
  employeeId: nullableInput(1), phoneNumber: nullableInput(6), department: nullableInput(1),
  position: nullableInput(1), address: nullableInput(), firstName: nullableInput(1), lastName: nullableInput(1),
  emailVerified: z.boolean(), phoneVerified: z.boolean(), dateOfBirth: calendarDateSchema.nullable(),
  yearsOfExperience: z.number().int().min(0).max(80).nullable(), currentCompany: nullableInput(),
  previousCompanies: z.array(z.string().trim().min(1)), currentPosition: nullableInput(), roleGiven: nullableInput(),
  assignedLocationIds: z.array(uuid), assignedVentureIds: z.array(uuid), dateOfJoining: calendarDateSchema.nullable(),
  dateOfRelieving: calendarDateSchema.nullable(), achievements: z.array(z.string().trim().min(1))
});
const orderedDates = (value: { dateOfJoining: string | null; dateOfRelieving: string | null }) =>
  !value.dateOfJoining || !value.dateOfRelieving || value.dateOfRelieving >= value.dateOfJoining;
const dateOrder = { message: "Relieving date must be on or after joining date", path: ["dateOfRelieving"] };
export const createEmployeeSchema = employeeFields.extend({ email: z.string().trim().email(),
  password: z.string().min(6), status: statusSchema }).strict().refine(orderedDates, dateOrder);
export const updateEmployeeSchema = employeeFields.extend({ password: z.string().min(6).optional() })
  .strict().refine(orderedDates, dateOrder);
export const employeeStatusBodySchema = z.object({ status: statusSchema }).strict();

export type EmployeeDraft = {
  email: string; password: string; displayName: string; fullName: string; employeeId: string; phoneNumber: string;
  department: string; position: string; address: string; firstName: string; lastName: string;
  emailVerified: boolean; phoneVerified: boolean; dateOfBirth: string; yearsOfExperience: string;
  currentCompany: string; previousCompanies: string; currentPosition: string; roleGiven: string;
  dateOfJoining: string; dateOfRelieving: string; achievements: string; status: "ACTIVE" | "FROZEN";
  assignedLocationIds: string[]; assignedVentureIds: string[];
};
export function employeeToDraft(employee?: Employee): EmployeeDraft {
  const profile = employee?.employeeProfile;
  return {
    email: employee?.email ?? "", password: "", displayName: employee?.displayName ?? "", fullName: employee?.fullName ?? "",
    employeeId: employee?.employeeId ?? "", phoneNumber: employee?.phoneNumber ?? "", department: employee?.department ?? "",
    position: employee?.position ?? "", address: employee?.address ?? "", firstName: profile?.firstName ?? "", lastName: profile?.lastName ?? "",
    emailVerified: profile?.emailVerified ?? false, phoneVerified: profile?.phoneVerified ?? false,
    dateOfBirth: profile?.dateOfBirth?.slice(0, 10) ?? "", yearsOfExperience: profile?.yearsOfExperience?.toString() ?? "",
    currentCompany: profile?.currentCompany ?? "", previousCompanies: profile?.previousCompanies?.join("\n") ?? "",
    currentPosition: profile?.currentPosition ?? "", roleGiven: profile?.roleGiven ?? "",
    dateOfJoining: profile?.dateOfJoining?.slice(0, 10) ?? "", dateOfRelieving: profile?.dateOfRelieving?.slice(0, 10) ?? "",
    achievements: profile?.achievements?.join("\n") ?? "", status: profile?.status ?? "ACTIVE",
    assignedLocationIds: [...(profile?.assignedLocationIds ?? [])], assignedVentureIds: [...(profile?.assignedVentureIds ?? [])]
  };
}
const nullable = (value: string) => value.trim() || null;
const lines = (value: string) => value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
export function employeeDraftToBody(draft: EmployeeDraft, creating: boolean) {
  const experience = draft.yearsOfExperience.trim();
  const body = {
    displayName: draft.displayName.trim(), fullName: draft.fullName.trim(), employeeId: nullable(draft.employeeId),
    phoneNumber: nullable(draft.phoneNumber), department: nullable(draft.department), position: nullable(draft.position),
    address: nullable(draft.address), firstName: nullable(draft.firstName), lastName: nullable(draft.lastName),
    emailVerified: draft.emailVerified, phoneVerified: draft.phoneVerified, dateOfBirth: nullable(draft.dateOfBirth),
    yearsOfExperience: experience === "" ? null : /^\d+$/.test(experience) ? Number(experience) : NaN,
    currentCompany: nullable(draft.currentCompany), previousCompanies: lines(draft.previousCompanies),
    currentPosition: nullable(draft.currentPosition), roleGiven: nullable(draft.roleGiven),
    assignedLocationIds: [...new Set(draft.assignedLocationIds)], assignedVentureIds: [...new Set(draft.assignedVentureIds)],
    dateOfJoining: nullable(draft.dateOfJoining), dateOfRelieving: nullable(draft.dateOfRelieving), achievements: lines(draft.achievements)
  };
  return creating ? createEmployeeSchema.parse({ ...body, email: draft.email.trim(), password: draft.password, status: draft.status })
    : updateEmployeeSchema.parse({ ...body, ...(draft.password ? { password: draft.password } : {}) });
}
export function employeeWrite(role: string | undefined, draft: EmployeeDraft, id?: string) {
  if (!canManageEmployees(role)) throw new Error("Administrator access required");
  return { path: id ? `/employee-access/employees/${encodeURIComponent(uuid.parse(id))}` : "/employee-access/employees",
    method: id ? "PUT" as const : "POST" as const, body: employeeDraftToBody(draft, !id) };
}
export function employeeStatusWrite(role: string | undefined, id: string, status: unknown) {
  if (!canManageEmployees(role)) throw new Error("Administrator access required");
  return { path: `/employee-access/employees/${encodeURIComponent(uuid.parse(id))}/status`, method: "POST" as const,
    body: employeeStatusBodySchema.parse({ status }) };
}
export function directorySchema(kind: DirectoryKind) {
  const role = { admins: "ADMIN", employees: "EMPLOYEE", customers: "CUSTOMER" }[kind];
  return z.array(directoryUserSchema.refine(user => user.role === role, "Unexpected directory role"));
}
