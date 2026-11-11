import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createContext } from "@/server/api/context";
import { getServerEnv } from "@/env";
import { isAllowedMutation } from "@/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handler(req: Request) {
  try {
    const env = getServerEnv();
    if (req.method === "POST" && !isAllowedMutation(req, env.APP_URL))
      return Response.json(
        { error: "Acesso não permitido" },
        { status: 403, headers: { "Cache-Control": "private, no-store" } },
      );
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: () => createContext({ req }),
      allowMethodOverride: false,
    });
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch {
    return Response.json(
      { error: "Não foi possível concluir a operação" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
export { handler as GET, handler as POST };
