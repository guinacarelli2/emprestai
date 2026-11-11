import { publicProcedure, router, tenantProcedure } from "../trpc";
import { loginSchema, voidSchema } from "../schemas";
import * as auth from "@/server/services/auth";
export const authRouter = router({
  me: tenantProcedure.input(voidSchema).query(({ ctx }) => auth.me(ctx)),
  login: publicProcedure.input(loginSchema).mutation(({ ctx, input }) => auth.login(ctx, input)),
  logout: publicProcedure.input(voidSchema).mutation(({ ctx }) => auth.logout(ctx)),
});
