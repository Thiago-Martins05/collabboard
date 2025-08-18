import { z } from "zod";

export const createColumnSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres").max(50).trim(),
});

export const createCardSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres").max(80).trim(),
  description: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v?.trim() ? v : undefined)),
  columnId: z.string().cuid(),
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
