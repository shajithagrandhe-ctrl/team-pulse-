export const USER_ROLES = ["ADMIN", "EMPLOYEE", "AGENT", "CUSTOMER"] as const;
export type UserRole = typeof USER_ROLES[number];
export const PLOT_STATUSES = ["AVAILABLE", "ADVANCE", "SOLD"] as const;
export type PlotStatus = typeof PLOT_STATUSES[number];
export const LEAD_STATUSES = ["NEW", "FOLLOW_UP", "QUALIFIED", "WON", "LOST"] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];
export const CUSTOMER_STATUSES = ["HOT_LEAD", "FOLLOWING_UP", "CONFIRMED_NOT_PAID", "PAID_ADVANCE", "BOOKED"] as const;
export type CustomerStatus = typeof CUSTOMER_STATUSES[number];

export type Pagination = { total: number; page: number; pageSize: number; pageCount: number };
export type ApiResponse<T> = { success: boolean; data: T; message: string; pagination?: Pagination };
export type User = {
  id: string; email: string; displayName: string; fullName: string; role: UserRole;
  department?: string | null; position?: string | null; employeeId?: string | null;
  phoneNumber?: string | null; address?: string | null; createdAt?: string; lastLogin?: string | null;
};
