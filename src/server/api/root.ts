import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { equipmentRouter } from "./routers/equipment";
import { loansRouter } from "./routers/loans";
import { operationsRouter } from "./routers/operations";
export const appRouter = router({
  auth: authRouter,
  equipment: equipmentRouter,
  loans: loansRouter,
  operations: operationsRouter,
});
export type AppRouter = typeof appRouter;
