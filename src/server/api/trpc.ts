import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";
import { consumeMutationLimit } from "@/server/services/rate-limit";

export const publicMessages: Record<string, string> = {
  BAD_REQUEST: "Dados inválidos",
  UNAUTHORIZED: "Sessão expirada. Entre novamente",
  FORBIDDEN: "Acesso não permitido",
  NOT_FOUND: "Registro não encontrado",
  CONFLICT: "Registro indisponível ou já cadastrado",
  TOO_MANY_REQUESTS: "Muitas tentativas. Tente novamente mais tarde",
  INTERNAL_SERVER_ERROR: "Não foi possível concluir a operação",
};
const businessMessages = new Set([
  "Não foi possível entrar. Verifique suas credenciais",
  "Você tem empréstimo em atraso",
  "Limite de três empréstimos atingido",
  "Equipamento em manutenção",
  "Equipamento fora de uso",
  "Equipamento já emprestado",
  "Patrimônio já cadastrado",
]);
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      message: businessMessages.has(error.message)
        ? error.message
        : (publicMessages[error.code] ?? "Não foi possível concluir a operação"),
      data: { code: error.code, httpStatus: shape.data.httpStatus, path: shape.data.path },
    };
  },
});
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
export const tenantProcedure = protectedProcedure.use(async ({ ctx, next, type, path }) => {
  if (!ctx.tenantId || !ctx.role) throw new TRPCError({ code: "FORBIDDEN" });
  const context = { ...ctx, tenantId: ctx.tenantId, role: ctx.role };
  if (type === "mutation") await consumeMutationLimit(context);
  const result = await next({ ctx: context });
  console.info(
    JSON.stringify({
      request_id: ctx.requestId,
      tenant_id: ctx.tenantId,
      action: path,
      status: result.ok ? "ok" : "error",
    }),
  );
  return result;
});
export const adminProcedure = tenantProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "operacoes") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});
