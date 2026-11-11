import { z } from "zod";

export const categorySchema = z.enum(["notebook", "monitor", "cabo", "camera", "projetor"]);
const pagination = {
  cursor: z.string().max(300).optional(),
  limit: z.number().int().min(1).max(100).default(24),
};
export const loginSchema = z
  .object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(256) })
  .strict();
export const equipmentListSchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    category: categorySchema.optional(),
    onlyAvailable: z.boolean().optional(),
    ...pagination,
  })
  .strict();
export const equipmentGetSchema = z.object({ patrimonio: z.string().trim().min(1).max(40) }).strict();
export const equipmentCreateSchema = z
  .object({
    nome: z.string().trim().min(2).max(160),
    categoria: categorySchema,
    patrimonio: z
      .string()
      .trim()
      .regex(/^TI-\d{4}$/, "Use TI- seguido de quatro dígitos"),
    numeroSerie: z.string().trim().max(120).optional(),
    local: z.string().trim().min(2).max(160),
    situacao: z.enum(["disponivel", "manutencao", "fora_de_uso"]),
    observacoes: z.string().trim().max(2000).optional(),
  })
  .strict();
export const loansMineSchema = z.object({ history: z.boolean().optional(), ...pagination }).strict();
export const loanRequestSchema = z.object({ equipmentId: z.string().uuid() }).strict();
export const loanReturnSchema = z.object({ loanId: z.string().uuid() }).strict();
export const operationsListSchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    filter: z.enum(["all", "late", "soon"]).optional(),
    category: categorySchema.optional(),
    ...pagination,
  })
  .strict();
export const voidSchema = z.void();
