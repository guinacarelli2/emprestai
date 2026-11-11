import { adminProcedure, router, tenantProcedure } from "../trpc";
import { equipmentCreateSchema, equipmentGetSchema, equipmentListSchema, voidSchema } from "../schemas";
import * as service from "@/server/services/equipment";
export const equipmentRouter = router({
  list: tenantProcedure
    .input(equipmentListSchema)
    .query(({ ctx, input }) => service.listEquipment(ctx, input)),
  get: tenantProcedure
    .input(equipmentGetSchema)
    .query(({ ctx, input }) => service.getEquipment(ctx, input.patrimonio)),
  recent: adminProcedure.input(voidSchema).query(({ ctx }) => service.recentEquipment(ctx)),
  create: adminProcedure
    .input(equipmentCreateSchema)
    .mutation(({ ctx, input }) => service.createEquipment(ctx, input)),
});
