import { router, tenantProcedure } from "../trpc";
import { loanRequestSchema, loanReturnSchema, loansMineSchema } from "../schemas";
import * as loans from "@/server/services/loans";
export const loansRouter = router({
  mine: tenantProcedure.input(loansMineSchema).query(({ ctx, input }) => loans.mine(ctx, input)),
  request: tenantProcedure
    .input(loanRequestSchema)
    .mutation(({ ctx, input }) => loans.requestLoan(ctx, input.equipmentId)),
  return: tenantProcedure
    .input(loanReturnSchema)
    .mutation(({ ctx, input }) => loans.returnLoan(ctx, input.loanId)),
});
