import { z } from "zod";

export const createBoardSchema = z.object({
  title: z
    .string()
    .min(2, "O nome precisa ter pelo menos 2 caracteres")
    .max(60, "O nome deve ter no máximo 60 caracteres")
    .trim(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
