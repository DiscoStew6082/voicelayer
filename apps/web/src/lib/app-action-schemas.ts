import { z } from "zod";

// Both model adapters describe the same application-owned command arguments.
export const appActionSchemas = {
  empty: z.object({}),
  incident: z.object({ incidentId: z.string() }),
  details: z.object({ expanded: z.boolean() }),
  position: z.object({ position: z.number().int().min(1) }),
  scroll: z.object({ direction: z.enum(["up", "down"]) }),
  field: z.object({ field: z.enum(["title", "details"]), value: z.string().max(4000) }),
  submission: z.object({
    incidentId: z.string(),
    title: z.string().min(1).max(200).refine((value) => Boolean(value.trim())),
    details: z.string().min(1).max(4000).refine((value) => Boolean(value.trim())),
  }),
};
