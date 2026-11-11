import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

export function validateLocalDatabase(value: string | undefined): string {
  if (!value) throw new Error("Defina DATABASE_URL e DIRECT_URL para um PostgreSQL local descartável.");
  const url = new URL(value);
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !/^(emprestai_local|disposable|test)(?:_[a-zA-Z0-9_]+)?$/.test(database)) {
    throw new Error("Migration bloqueada: host deve ser loopback e banco emprestai_local*, disposable* ou test*.");
  }
  for (const key of url.searchParams.keys()) {
    if (!["schema", "connection_limit", "pool_timeout", "connect_timeout", "sslmode"].includes(key)) throw new Error("Parâmetro de conexão não permitido no launcher local.");
  }
  if (url.searchParams.has("schema") && url.searchParams.get("schema") !== "public") throw new Error("Use apenas schema public no banco descartável.");
  return value;
}

export async function migrateLocal(
  args = process.argv.slice(2),
  containerEndpoint?: { url: string; address: string; port: number },
) {
  const mode = args[0] ?? "deploy";
  if (!["deploy", "create-only", "reset-disposable"].includes(mode)) throw new Error("Use deploy, create-only [nome], ou reset-disposable --confirm-disposable.");
  if (mode === "reset-disposable" && (args.length !== 2 || args[1] !== "--confirm-disposable")) throw new Error("Reset exige reset-disposable --confirm-disposable; todos os dados serão apagados.");
  const databaseUrl = validateLocalDatabase(process.env.DATABASE_URL);
  const directUrl = validateLocalDatabase(process.env.DIRECT_URL);
  const a = new URL(databaseUrl), b = new URL(directUrl);
  if (a.hostname !== b.hostname || a.port !== b.port || a.pathname !== b.pathname) throw new Error("DATABASE_URL e DIRECT_URL devem apontar ao mesmo banco local.");
  const db = new PrismaClient({ datasources: { db: { url: directUrl } } });
  try {
    const [connection] = await db.$queryRaw<Array<{ database: string; address: string | null; port: number }>>`SELECT current_database() AS database, host(inet_server_addr()) AS address, inet_server_port() AS port`;
    const endpointMatches = containerEndpoint
      ? args.length === 1 &&
        mode === "deploy" &&
        containerEndpoint.url === directUrl &&
        connection?.address === containerEndpoint.address &&
        connection?.port === containerEndpoint.port
      : ["127.0.0.1", "::1"].includes(connection?.address ?? "") &&
        connection?.port === Number(b.port || 5432);

    if (
      !connection ||
      connection.database !== decodeURIComponent(b.pathname.slice(1)) ||
      !endpointMatches
    ) {
      throw new Error("Servidor real não corresponde ao PostgreSQL local solicitado.");
    }
    console.info(`PostgreSQL local verificado: ${connection.database}; modo ${mode}.`);
  } finally { await db.$disconnect(); }
  const name = args[1] ?? "auth_persistence";
  if (mode === "create-only" && !/^[a-z][a-z0-9_]{0,63}$/.test(name)) throw new Error("Nome de migration inválido.");
  const command = mode === "create-only" ? ["migrate", "dev", "--create-only", "--name", name, "--skip-generate", "--skip-seed"] : mode === "reset-disposable" ? ["migrate", "reset", "--force", "--skip-generate", "--skip-seed"] : ["migrate", "deploy"];
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url)), ...command], { stdio: "inherit", env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: directUrl } });
  if (result.error || result.status !== 0) throw new Error("Prisma Migrate local falhou; consulte a saída acima.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  migrateLocal().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Migration local falhou."); process.exitCode = 1; });
}
