const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");
const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME || "estatehub_csrf";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  fullName: string;
  role: "ADMIN" | "EMPLOYEE" | "CUSTOMER" | "AGENT";
  department?: string | null;
  position?: string | null;
  adminCode?: string | null;
  employeeId?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  createdAt?: string;
  lastLogin?: string | null;
}

export interface LocationSummary {
  id: string;
  name: string;
  availablePlots?: number;
  ventures: Array<{
    id: string;
    name: string;
    plotCount: number;
    availablePlots?: number;
    soldPlots?: number;
    photoUrl?: string | null;
  }>;
}

export interface Venture {
  id: string;
  name: string;
  locationId: string;
  location?: { id: string; name: string };
  plots?: Plot[];
  photoUrl?: string | null;
  layoutImage?: string | null;
  layoutRegions?: any | null;
}

export interface Plot {
  id: string;
  plotNumber: string;
  status: "AVAILABLE" | "ADVANCE" | "SOLD";
  area: number;
  pricePerSqYard: number;
  ventureId: string;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  shapeData?: any | null;
  leads?: Lead[];
  venture?: {
    id: string;
    name: string;
    location?: {
      id: string;
      name: string;
    };
  };
}

export interface Lead {
  id: string;
  plotId: string;
  plotNumber?: string;
  customerName: string;
  email: string;
  contactNumber: string;
  location: string;
  uniqueId: string;
  pricePerSqYard: number;
  status?: "NEW" | "FOLLOW_UP" | "QUALIFIED" | "WON" | "LOST";
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  plot?: {
    plotNumber: string;
    venture?: {
      name: string;
    };
  };
}

export interface CustomerRecord {
  id: string;
  contactName: string;
  contactNumber: string;
  location: string;
  budget: string;
  interested: boolean;
  status?: "HOT_LEAD" | "FOLLOWING_UP" | "CONFIRMED_NOT_PAID" | "PAID_ADVANCE" | "BOOKED";
  recordOwner: string;
  leadName?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerRecordInput = {
  contactName: string;
  contactNumber: string;
  location: string;
  budget: string;
  interested?: boolean;
  status?: CustomerRecord["status"];
  recordOwner: string;
  leadName?: string;
  notes?: string;
};

export interface TrackingUpdate {
  customerId: string;
  latitude: number;
  longitude: number;
  status?: "active" | "inactive" | "moving" | "ACTIVE" | "INACTIVE" | "MOVING";
  address?: string;
  updatedAt?: string;
  updatedBy?: string;
}

const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const extractMeaningfulText = (text: string, contentType: string) => {
  if (contentType.includes("text/html")) {
    const pre = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i)?.[1];
    const raw = pre ?? text;
    const noTags = raw.replace(/<[^>]+>/g, " ");
    return decodeHtmlEntities(noTags);
  }
  return text;
};

const toCleanSingleLine = (value: string, maxLen = 240) => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen)}…`;
};

const readApiErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const json = await response.json();
      return (
        toCleanSingleLine(
          String(json?.message || json?.error || json?.errors?.message || response.statusText || "Request failed")
        ) || `Request failed (${response.status})`
      );
    } catch {
      return `Request failed (${response.status})`;
    }
  }

  try {
    const text = await response.text();
    const meaningful = extractMeaningfulText(text, contentType);
    const cleaned = toCleanSingleLine(meaningful);
    return cleaned || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
};

const ensureCsrfToken = async () => {
  const existing = getCookie(CSRF_COOKIE_NAME);
  if (existing) return existing;

  const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Failed to obtain CSRF token");
  }

  const payload = await response.json();
  return payload?.data?.token as string;
};

const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const method = (options.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    try {
      await ensureCsrfToken();
    } catch (err) {
      if (import.meta.env.PROD) throw err;
    }
  }

  const csrfToken = getCookie(CSRF_COOKIE_NAME);
  const headers = {
    "Content-Type": "application/json",
    ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
    ...(options.headers || {})
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include"
    });
  } catch (err: any) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const hint = origin ? ` (page origin: ${origin})` : "";
    const message = String(err?.message || "Failed to fetch");
    throw new Error(
      `${method} ${path} failed: ${message}. Check the API is reachable at ${API_BASE_URL}${hint} and CORS allows this origin.`
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const message = await readApiErrorMessage(response);
    throw new Error(`${method} ${path} failed (${response.status}): ${message}`);
  }

  let payload: any;
  try {
    payload = await response.json();
  } catch {
    const message = await readApiErrorMessage(response);
    throw new Error(`${method} ${path} failed (${response.status}): ${message}`);
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `${method} ${path} failed (${response.status})`);
  }

  return payload;
};

export const authApi = {
  login: (email: string, password: string, adminCode?: string) =>
    apiFetch<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, adminCode })
    }),
  register: (payload: {
    email: string;
    password: string;
    displayName: string;
    fullName: string;
    role: "EMPLOYEE";
    department?: string;
    position?: string;
    employeeId?: string;
    phoneNumber?: string;
    address?: string;
  }) =>
    apiFetch<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  createCustomerCredentials: (payload: {
    email: string;
    password: string;
    displayName: string;
    fullName: string;
    phoneNumber?: string;
    address?: string;
  }) =>
    apiFetch<{ user: User }>("/auth/customers", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiFetch<null>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  logout: () => apiFetch<null>("/auth/logout", { method: "POST" }),
  me: () => apiFetch<{ user: User }>("/auth/me")
};

export const statsApi = {
  get: () =>
    apiFetch<{
      locations: number;
      plots: number;
      employees: number;
      customers: number;
      leads: number;
      plotsByStatus: { available: number; advance: number; sold: number };
    }>("/stats")
};

export const locationApi = {
  list: () => apiFetch<LocationSummary[]>("/locations"),
  get: (id: string) => apiFetch<LocationSummary & { ventures: Venture[] }>(`/locations/${id}`)
};

export const ventureApi = {
  create: (payload: {
    name: string;
    locationName: string;
    plotCount: number;
    plotNumberPrefix?: string;
    startingPlotNumber?: number;
    defaultArea: number;
    defaultPricePerSqYard: number;
  }) => apiFetch<Venture>("/ventures", { method: "POST", body: JSON.stringify(payload) }),
  list: (locationId?: string) =>
    apiFetch<Venture[]>(`/ventures${locationId ? `?locationId=${locationId}` : ""}`),
  get: (id: string) => apiFetch<Venture>(`/ventures/${id}`),
  uploadLayout: async (id: string, file: File) => {
    const form = new FormData();
    form.append("layout", file);

    try {
      await ensureCsrfToken();
    } catch {
      // CSRF is only required in production; ignore failures in dev.
    }

    const csrfToken = getCookie(CSRF_COOKIE_NAME);
    const response = await fetch(`${API_BASE_URL}/ventures/${id}/layout`, {
      method: "POST",
      body: form,
      credentials: "include",
      headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const message = await readApiErrorMessage(response);
      throw new Error(`Upload failed (${response.status}): ${message}`);
    }

    let payload: any;
    try {
      payload = await response.json();
    } catch {
      const message = await readApiErrorMessage(response);
      throw new Error(`Upload failed (${response.status}): ${message}`);
    }
    if (!response.ok) {
      throw new Error(payload?.message || "Failed to upload layout");
    }
    return payload as ApiResponse<Venture>;
  },
  uploadPhoto: async (id: string, file: File) => {
    const form = new FormData();
    form.append("photo", file);

    try {
      await ensureCsrfToken();
    } catch {
      // CSRF is only required in production; ignore failures in dev.
    }

    const csrfToken = getCookie(CSRF_COOKIE_NAME);
    const response = await fetch(`${API_BASE_URL}/ventures/${id}/photo`, {
      method: "POST",
      body: form,
      credentials: "include",
      headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const message = await readApiErrorMessage(response);
      throw new Error(`Upload failed (${response.status}): ${message}`);
    }

    let payload: any;
    try {
      payload = await response.json();
    } catch {
      const message = await readApiErrorMessage(response);
      throw new Error(`Upload failed (${response.status}): ${message}`);
    }
    if (!response.ok) {
      throw new Error(payload?.message || "Failed to upload venture photo");
    }
    return payload as ApiResponse<Venture>;
  },
  getLayoutUrl: (layoutImage?: string | null) => {
    if (!layoutImage) return "";
    if (layoutImage.startsWith("http")) return layoutImage;
    return `${API_ORIGIN}${layoutImage}`;
  },
  getAssetUrl: (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_ORIGIN}${path}`;
  },
  updateRegions: (id: string, regions: any) =>
    apiFetch<Venture>(`/ventures/${id}/regions`, { method: "PUT", body: JSON.stringify({ regions }) })
};

export const plotApi = {
  list: (params: { ventureId?: string; status?: string; page?: number; pageSize?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.ventureId) query.set("ventureId", params.ventureId);
    if (params.status) query.set("status", params.status);
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    return apiFetch<Plot[]>(`/plots?${query.toString()}`);
  },
  get: (id: string) => apiFetch<Plot>(`/plots/${id}`),
  update: (id: string, payload: Partial<Pick<Plot, "status" | "area" | "pricePerSqYard" | "plotNumber">>) =>
    apiFetch<Plot>(`/plots/${id}`, { method: "PUT", body: JSON.stringify(payload) })
  ,
  updateCoords: (id: string, payload: { x?: number; y?: number; width?: number; height?: number; shapeData?: any }) =>
    apiFetch<Plot>(`/plots/${id}/coords`, { method: "PUT", body: JSON.stringify(payload) }),
  updateCoordsBatch: (plots: Array<{ id: string; x?: number; y?: number; width?: number; height?: number; shapeData?: any }>) =>
    apiFetch<Plot[]>(`/plots/coords`, { method: "PUT", body: JSON.stringify({ plots }) })
};

export const leadApi = {
  list: (page?: number, pageSize?: number) => {
    const query = new URLSearchParams();
    if (page) query.set("page", String(page));
    if (pageSize) query.set("pageSize", String(pageSize));
    return apiFetch<Lead[]>(`/leads?${query.toString()}`);
  },
  listByPlot: (plotId: string) => apiFetch<Lead[]>(`/plots/${plotId}/leads`),
  create: (payload: Omit<Lead, "id" | "createdAt" | "updatedAt">) =>
    apiFetch<Lead>("/leads", { method: "POST", body: JSON.stringify(payload) }),
  update: (leadId: string, payload: Partial<Lead>) =>
    apiFetch<Lead>(`/leads/${leadId}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (leadId: string) => apiFetch<null>(`/leads/${leadId}`, { method: "DELETE" })
};

export const customerApi = {
  list: (page?: number, pageSize?: number) => {
    const query = new URLSearchParams();
    if (page) query.set("page", String(page));
    if (pageSize) query.set("pageSize", String(pageSize));
    return apiFetch<CustomerRecord[]>(`/total-data?${query.toString()}`);
  },
  create: (payload: CustomerRecordInput) =>
    apiFetch<CustomerRecord>("/total-data", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: CustomerRecordInput) =>
    apiFetch<CustomerRecord>(`/total-data/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id: string) => apiFetch<null>(`/total-data/${id}`, { method: "DELETE" })
};

export const userApi = {
  admins: () => apiFetch<User[]>("/admins"),
  employees: () => apiFetch<User[]>("/employees"),
  customers: () => apiFetch<User[]>("/customers")
};

export interface EmployeeProfile {
  id: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  dateOfBirth?: string | null;
  yearsOfExperience?: number | null;
  currentCompany?: string | null;
  previousCompanies?: string[] | null;
  currentPosition?: string | null;
  roleGiven?: string | null;
  assignedLocationIds?: string[] | null;
  assignedVentureIds?: string[] | null;
  dateOfJoining?: string | null;
  dateOfRelieving?: string | null;
  achievements?: string[] | null;
  status: "ACTIVE" | "FROZEN";
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeAccount extends User {
  employeeProfile?: EmployeeProfile | null;
}

export type EmployeeAccountInput = {
  email: string;
  password?: string;
  displayName?: string;
  fullName?: string;
  employeeId?: string | null;
  phoneNumber?: string | null;
  department?: string | null;
  position?: string | null;
  address?: string | null;

  firstName?: string | null;
  lastName?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  dateOfBirth?: string | null;

  yearsOfExperience?: number | null;
  currentCompany?: string | null;
  previousCompanies?: string[] | null;
  currentPosition?: string | null;
  roleGiven?: string | null;
  assignedLocationIds?: string[] | null;
  assignedVentureIds?: string[] | null;
  dateOfJoining?: string | null;
  dateOfRelieving?: string | null;
  achievements?: string[] | null;
  status?: "ACTIVE" | "FROZEN";
};

export const employeeAccessApi = {
  list: () => apiFetch<EmployeeAccount[]>("/employee-access/employees"),
  create: (payload: EmployeeAccountInput & { password: string }) =>
    apiFetch<EmployeeAccount>("/employee-access/employees", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: EmployeeAccountInput) =>
    apiFetch<EmployeeAccount>(`/employee-access/employees/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  setStatus: (id: string, status: "ACTIVE" | "FROZEN") =>
    apiFetch<EmployeeProfile>(`/employee-access/employees/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status })
    }),
  requestOtp: (payload: { type: "email" | "phone"; target: string }) =>
    apiFetch<{ requestId: string; otp: string; expiresAt: number }>("/employee-access/otp/request", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  verifyOtp: (payload: { requestId: string; otp: string }) =>
    apiFetch<{ type: "email" | "phone"; target: string; verifiedAt: number }>("/employee-access/otp/verify", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};

export const favoriteApi = {
  list: () => apiFetch<any[]>("/favorites"),
  add: (plotId: string) => apiFetch<any>("/favorites", { method: "POST", body: JSON.stringify({ plotId }) }),
  remove: (plotId: string) => apiFetch<null>(`/favorites/${plotId}`, { method: "DELETE" })
};

export const agentApi = {
  list: () => apiFetch<any[]>("/agents"),
  get: (id: string) => apiFetch<any>(`/agents/${id}`)
};

export const inquiryApi = {
  create: (payload: { plotId?: string; agentId?: string; customerName: string; customerEmail: string; customerPhone?: string; message: string }) =>
    apiFetch<any>("/inquiries", { method: "POST", body: JSON.stringify(payload) })
};

export const trackingApi = {
  list: () => apiFetch<TrackingUpdate[]>("/tracking"),
  update: (payload: Omit<TrackingUpdate, "updatedAt" | "updatedBy">) =>
    apiFetch<TrackingUpdate>("/tracking", { method: "POST", body: JSON.stringify(payload) })
};
