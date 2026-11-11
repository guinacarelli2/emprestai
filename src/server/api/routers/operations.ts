import { adminProcedure, router } from "../trpc";
import { operationsListSchema, voidSchema } from "../schemas";
import * as operations from "@/server/services/operations";
export const operationsRouter = router({
  list: adminProcedure
    .input(operationsListSchema)
    .query(({ ctx, input }) => operations.listOperations(ctx, input)),
  stats: adminProcedure.input(voidSchema).query(({ ctx }) => operations.operationsStats(ctx)),
});
