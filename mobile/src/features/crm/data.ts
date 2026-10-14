import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "../../auth/AuthProvider";
import { collectPages, reader } from "./contracts";

export function useAll<T extends { id: string }>(schema: z.ZodType<T>, path: string, enabled = true) {
  const { api, user } = useAuth();
  return useQuery({ queryKey: ["business", user?.id, "crm", path], enabled: !!api && reader(user?.role) && enabled,
    queryFn: ({ signal }) => {
      if (!api) throw new Error("API unavailable");
      return collectPages(schema, (page, pageSize) => api.request(path, { query: { page, pageSize }, signal }));
    } });
}
