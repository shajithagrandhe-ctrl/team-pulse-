import { z } from "zod";

export const idSchema = z.string().uuid();
export const statusSchema = z.enum(["AVAILABLE", "ADVANCE", "SOLD"]);
const unit = z.number().finite().min(0).max(1);
export const pointSchema = z.object({ x: unit, y: unit });
export const polygonSchema = z.object({ type: z.literal("polygon"), points: z.array(pointSchema).min(3) });
const regionSchema = z.object({ points: z.array(pointSchema).min(3).max(500) }).passthrough();
export const regionsSchema = z.object({ roads: z.array(regionSchema).max(200), parks: z.array(regionSchema).max(200) }).passthrough();
const place = z.object({ id: idSchema, name: z.string() }).passthrough();
export const plotSchema = z.object({ id: idSchema, ventureId: idSchema, plotNumber: z.string(), status: statusSchema, area: z.number(), pricePerSqYard: z.number(), x: z.number().nullable().optional(), y: z.number().nullable().optional(), width: z.number().nullable().optional(), height: z.number().nullable().optional(), shapeData: z.unknown().optional(), venture: place.extend({ layoutImage: z.string().nullable().optional(), location: place.optional() }).optional() }).passthrough();
export const ventureSchema = place.extend({ locationId: idSchema, location: place.optional(), layoutImage: z.string().nullable().optional(), layoutRegions: z.unknown().optional(), plots: z.array(plotSchema).optional() });
export const locationSchema = place.extend({ availablePlots: z.number().optional(), ventures: z.array(place.extend({ photoUrl: z.string().nullable().optional(), plotCount: z.number(), availablePlots: z.number().optional(), soldPlots: z.number().optional() })) });
export const favoriteSchema = z.object({ id: idSchema, plotId: idSchema, plot: plotSchema }).passthrough();
export const plotLeadSchema = z.object({ id: idSchema, customerName: z.string(), email: z.string(), contactNumber: z.string(), location: z.string(), uniqueId: z.string(), status: z.string().optional(), notes: z.string().nullable().optional() }).passthrough();
export const agentSchema = z.object({ id: idSchema, displayName: z.string(), fullName: z.string(), email: z.string().email(), phoneNumber: z.string().nullable(), department: z.string().nullable(), position: z.string().nullable(), agentProfile: z.object({ bio: z.string().nullable(), phone: z.string().nullable(), licenseNumber: z.string().nullable(), photoUrl: z.string().nullable() }).passthrough().nullable() }).passthrough();
const positive = z.coerce.number().int().positive();
export const plotEditSchema = z.object({ plotNumber: z.string().trim().min(1), status: statusSchema, area: positive, pricePerSqYard: positive });
export const createSchema = z.object({ name: z.string().trim().min(1), locationName: z.string().trim().min(1), plotCount: positive.max(200), plotNumberPrefix: z.string(), startingPlotNumber: positive, defaultArea: positive, defaultPricePerSqYard: positive });
export const inquirySchema = z.object({ plotId: idSchema.optional(), agentId: idSchema.optional(), customerName: z.string().trim().min(2), customerEmail: z.string().trim().email(), customerPhone: z.string().trim().optional(), message: z.string().trim().min(10) });
export const coordsSchema = z.object({ id: idSchema, x: unit.optional(), y: unit.optional(), width: unit.optional(), height: unit.optional(), shapeData: polygonSchema.optional() }).refine(v => v.shapeData || [v.x, v.y, v.width, v.height].some(n => n !== undefined), "Coordinates required");
export const batchSchema = z.object({ plots: z.array(coordsSchema) });
export const filterSchema = z.object({ ventureId: idSchema, status: statusSchema.optional() });
export type Plot = z.infer<typeof plotSchema>;
export type Venture = z.infer<typeof ventureSchema>;
export type Point = z.infer<typeof pointSchema>;
export type Regions = z.infer<typeof regionsSchema>;
export function rectangle(a: Point, b: Point) {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) };
}
export function normalize(x: number, y: number, width: number, height: number): Point {
  if (width <= 0 || height <= 0) throw new Error("Invalid surface dimensions");
  return pointSchema.parse({ x: Math.max(0, Math.min(1, x / width)), y: Math.max(0, Math.min(1, y / height)) });
}
export function geometryBatch(plots: Plot[], changed: string[]) {
  return batchSchema.parse({ plots: plots.filter(p => changed.includes(p.id)).map(p => {
    const polygon = polygonSchema.safeParse(p.shapeData);
    return polygon.success ? { id: p.id, shapeData: polygon.data } : { id: p.id, x: p.x ?? undefined, y: p.y ?? undefined, width: p.width ?? undefined, height: p.height ?? undefined };
  }) });
}
export function assetUrl(value?: string | null) {
  if (!value) return undefined;
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (!base) return undefined;
  try {
    const origin = new URL(base); const url = new URL(value, base.replace(/\/api\/?$/, "/"));
    if (url.username || url.password) return undefined;
    if (url.protocol === "https:") return url.toString();
    const preview = (typeof __DEV__ !== "undefined" && __DEV__) || process.env.EXPO_PUBLIC_BUILD_CHANNEL === "local-preview";
    const octets = origin.hostname.split(".").map(Number);
    const ipv4 = octets.length === 4 && octets.every(n => Number.isInteger(n) && n >= 0 && n <= 255);
    const privateHost = ["localhost", "127.0.0.1"].includes(origin.hostname) || (ipv4 && (octets[0] === 10 || (octets[0] === 192 && octets[1] === 168) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)));
    return preview && privateHost && origin.protocol === "http:" && url.protocol === "http:" && url.origin === origin.origin ? url.toString() : undefined;
  } catch { return undefined; }
}
export function validationMessage(error: unknown) {
  return error instanceof z.ZodError ? error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("\n") : error instanceof Error ? error.message : "Request failed";
}
