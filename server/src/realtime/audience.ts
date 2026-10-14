import type { RealtimeEvent } from "./events.js";

export const eventForRole = (event: RealtimeEvent, role: string): RealtimeEvent => {
  if (role === "ADMIN") return event;

  // Clients refetch through authorized APIs; records must not bypass those filters.
  return {
    id: event.id,
    type: event.type,
    createdAt: event.createdAt,
    payload: {}
  };
};
