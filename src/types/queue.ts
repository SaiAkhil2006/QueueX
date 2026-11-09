import type { z } from "zod";
import {
  queueEntrySchema,
  createQueueEntrySchema,
  updateQueueEntryStatusSchema,
  queueStateSchema,
  queueEntryStatusSchema,
  queuePrioritySchema,
  queueSourceSchema,
} from "@/schemas/queue.schema";

export type QueueEntry = z.infer<typeof queueEntrySchema>;
export type CreateQueueEntryInput = z.input<typeof createQueueEntrySchema>;
export type UpdateQueueEntryStatusInput = z.input<typeof updateQueueEntryStatusSchema>;
export type QueueState = z.infer<typeof queueStateSchema>;
export type QueueEntryStatus = z.infer<typeof queueEntryStatusSchema>;
export type QueuePriority = z.infer<typeof queuePrioritySchema>;
export type QueueSource = z.infer<typeof queueSourceSchema>;

export {
  queueEntrySchema,
  createQueueEntrySchema,
  updateQueueEntryStatusSchema,
  queueStateSchema,
  queueEntryStatusSchema,
  queuePrioritySchema,
  queueSourceSchema,
};
