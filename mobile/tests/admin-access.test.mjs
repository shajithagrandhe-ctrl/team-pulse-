import assert from "node:assert/strict";
import { test } from "node:test";
import { canManageEmployees, canReadDirectory, calendarDateSchema, createEmployeeSchema, directorySchema,
  directoryKindSchema, employeeSchema, employeeToDraft, employeeDraftToBody, employeeWrite,
  employeeStatusWrite, employeeStatusResponseSchema, updateEmployeeSchema } from "../src/features/admin/contracts.ts";

const id = "d9428888-122b-4e7d-9ab7-a2b6edbb1234";
const locationId = "d9428888-122b-4e7d-9ab7-a2b6edbb1235";
const ventureId = "d9428888-122b-4e7d-9ab7-a2b6edbb1236";
const fixture = () => ({
  id, email: "employee@example.test", displayName: "Employee", fullName: "Test Employee", role: "EMPLOYEE",
  department: "Sales", position: "Advisor", employeeId: "E-12", phoneNumber: "1234567890", address: "Office",
  createdAt: "2026-01-01T00:00:00.000Z", lastLogin: null,
  employeeProfile: { firstName: "Test", lastName: "Employee", status: "FROZEN", emailVerified: true, phoneVerified: false,
    dateOfBirth: "1990-02-28T00:00:00.000Z", yearsOfExperience: 0, currentCompany: "Venture Plus",
    previousCompanies: ["Company A", "Company B"], currentPosition: "Advisor", roleGiven: "ADMIN",
    dateOfJoining: "2026-01-01T00:00:00.000Z", dateOfRelieving: null, achievements: ["Achievement A", "Achievement B"],
    assignedLocationIds: [locationId], assignedVentureIds: [ventureId] }
});

test("only ADMIN manages employee accounts; directory scopes match server roles", () => {
  for (const role of [undefined, "ADMIN", "EMPLOYEE", "AGENT", "CUSTOMER", "admin"]) {
    assert.equal(canManageEmployees(role), role === "ADMIN");
    for (const kind of directoryKindSchema.options) {
      assert.equal(canReadDirectory(role, kind), role === "ADMIN" || (role === "EMPLOYEE" && kind !== "admins"));
    }
  }
  assert.equal(directoryKindSchema.safeParse("../admins").success, false);
  assert.equal(directoryKindSchema.safeParse(["admins"]).success, false);
});

test("profile transform round trips all fields, clears values explicitly and preserves access authority", () => {
  const employee = employeeSchema.parse(fixture());
  const draft = employeeToDraft(employee);
  assert.equal(draft.password, "");
  assert.equal(draft.yearsOfExperience, "0");
  assert.equal(draft.dateOfBirth, "1990-02-28");
  assert.equal(draft.status, "FROZEN");
  const body = employeeDraftToBody(draft, false);
  assert.equal(body.roleGiven, "ADMIN");
  for (const key of ["role", "status", "email", "password", "id", "adminCode"]) assert.equal(key in body, false);
  assert.equal(body.emailVerified, true);
  assert.equal(body.phoneVerified, false);
  assert.deepEqual(body.previousCompanies, employee.employeeProfile.previousCompanies);
  assert.deepEqual(body.achievements, employee.employeeProfile.achievements);
  assert.deepEqual(body.assignedLocationIds, [locationId]);
  assert.deepEqual(body.assignedVentureIds, [ventureId]);
  assert.equal(body.dateOfJoining, "2026-01-01");
  assert.equal(body.dateOfRelieving, null);
  assert.equal(body.yearsOfExperience, 0);
  const cleared = employeeDraftToBody({ ...draft, phoneNumber: " ", yearsOfExperience: "", previousCompanies: "", achievements: "",
    assignedLocationIds: [], assignedVentureIds: [] }, false);
  assert.equal(cleared.phoneNumber, null);
  assert.equal(cleared.yearsOfExperience, null);
  assert.deepEqual(cleared.previousCompanies, []);
  assert.deepEqual(cleared.achievements, []);
  assert.deepEqual(cleared.assignedLocationIds, []);
  assert.deepEqual(cleared.assignedVentureIds, []);
});

test("create validates credentials and retains status; edit omits immutable email and deduplicates assignments", () => {
  const draft = employeeToDraft(employeeSchema.parse(fixture()));
  assert.throws(() => employeeDraftToBody(draft, true));
  const created = employeeDraftToBody({ ...draft, password: " fixture password ", achievements: " One \n\nTwo ",
    assignedLocationIds: [locationId, locationId] }, true);
  assert.equal(created.password, " fixture password ");
  assert.equal(created.status, "FROZEN");
  assert.equal(created.email, draft.email);
  assert.deepEqual(created.achievements, ["One", "Two"]);
  assert.deepEqual(created.assignedLocationIds, [locationId]);
  assert.equal(createEmployeeSchema.safeParse({ ...created, role: "ADMIN" }).success, false);
  const updated = employeeDraftToBody({ ...draft, password: "new-password" }, false);
  assert.equal(updated.password, "new-password");
  assert.equal(updateEmployeeSchema.safeParse({ ...updated, role: "ADMIN" }).success, false);
  assert.equal(updateEmployeeSchema.safeParse({ ...updated, status: "ACTIVE" }).success, false);
});

test("invalid calendar dates, date order, experience and identifiers fail before a mutation", () => {
  assert.equal(calendarDateSchema.safeParse("2024-02-29").success, true);
  for (const value of ["2025-02-29", "2026-04-31", "01/02/2026", "2026-13-01"]) assert.equal(calendarDateSchema.safeParse(value).success, false);
  const draft = employeeToDraft(employeeSchema.parse(fixture()));
  for (const yearsOfExperience of ["-1", "1.5", "81", "abc", "1e1"]) assert.throws(() => employeeDraftToBody({ ...draft, yearsOfExperience }, false));
  assert.throws(() => employeeDraftToBody({ ...draft, dateOfRelieving: "2025-01-01" }, false));
  assert.throws(() => employeeDraftToBody({ ...draft, assignedLocationIds: ["../location"] }, false));
  assert.throws(() => employeeWrite("ADMIN", draft, "../admins"));
  assert.throws(() => employeeStatusWrite("ADMIN", id, "DELETED"));
});

test("writes use verified endpoints and independently enforce ADMIN authority", () => {
  const draft = employeeToDraft(employeeSchema.parse(fixture()));
  assert.equal(employeeWrite("ADMIN", draft, id).path, `/employee-access/employees/${id}`);
  assert.equal(employeeWrite("ADMIN", draft, id).method, "PUT");
  assert.equal(employeeWrite("ADMIN", { ...draft, password: "password" }).method, "POST");
  assert.deepEqual(employeeStatusWrite("ADMIN", id, "ACTIVE"), {
    path: `/employee-access/employees/${id}/status`, method: "POST", body: { status: "ACTIVE" }
  });
  for (const role of [undefined, "EMPLOYEE", "CUSTOMER", "AGENT"]) {
    assert.throws(() => employeeWrite(role, draft, id));
    assert.throws(() => employeeStatusWrite(role, id, "FROZEN"));
  }
});

test("directory schemas strip secrets and private profile fields and reject mismatched roles", () => {
  const raw = { ...fixture(), passwordHash: "secret", adminCode: "secret", token: "secret" };
  const [parsed] = directorySchema("employees").parse([raw]);
  for (const key of ["passwordHash", "adminCode", "token"]) assert.equal(key in parsed, false);
  for (const key of ["dateOfBirth", "yearsOfExperience", "previousCompanies", "achievements", "roleGiven", "assignedLocationIds"])
    assert.equal(key in parsed.employeeProfile, false);
  assert.equal(parsed.employeeProfile.status, "FROZEN");
  assert.equal(directorySchema("admins").safeParse([raw]).success, false);
  assert.equal(directorySchema("customers").safeParse([raw]).success, false);
  assert.equal(employeeSchema.safeParse({ ...raw, role: "ADMIN" }).success, false);
  assert.equal(directorySchema("admins").safeParse([{ ...raw, role: "ADMIN", employeeProfile: null }]).success, true);
});

test("status endpoint profile validates without assignments and carries the target user ID", () => {
  const { assignedLocationIds: _locations, assignedVentureIds: _ventures, ...profile } = fixture().employeeProfile;
  const result = employeeStatusResponseSchema.parse({ ...profile, userId: id, status: "ACTIVE" });
  assert.equal(result.userId, id);
  assert.equal(result.status, "ACTIVE");
  assert.equal("assignedLocationIds" in result, false);
  assert.equal(employeeStatusResponseSchema.safeParse(profile).success, false);
  assert.equal(employeeStatusResponseSchema.safeParse({ ...profile, userId: "../users" }).success, false);
});
