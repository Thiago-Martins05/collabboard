import { z } from "zod";

export const renameSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres").max(80).trim(),
});
export type RenameInput = z.infer<typeof renameSchema>;

export const editCardSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres").max(80).trim(),
  description: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .transform((v) => (v?.trim() ? v : undefined)),
});
export type EditCardInput = z.infer<typeof editCardSchema>;
