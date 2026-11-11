import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import type { TestProject } from "vitest/node";
import { migrateLocal, validateLocalDatabase } from "../../../scripts/local-migrate";

export default async function setup(project: TestProject) {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>> | undefined;
  let url: string;
  if (process.env.TEST_DATABASE_URL) {
    url = validateLocalDatabase(process.env.TEST_DATABASE_URL);
    console.info("Integração: PostgreSQL standalone loopback real (Testcontainers não exercitado).");
  } else {
    try {
      container = await new PostgreSqlContainer("postgres:16.11-alpine").withDatabase("emprestai_local_integration").withUsername("emprestai_migrator").withPassword("disposable-local-only").start();
      url = validateLocalDatabase(container.getConnectionUri());
      console.info("Integração: PostgreSQL real via Testcontainers.");
    } catch {
      throw new Error("Integração exige PostgreSQL real: inicie Docker para Testcontainers ou defina TEST_DATABASE_URL=postgresql://<usuario>@127.0.0.1:<porta>/emprestai_local_integration. Nenhum teste foi pulado.");
    }
  }
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = url;
  project.config.env.DIRECT_URL = url;
  try {
    const containerEndpoint = container
      ? {
          url,
          address: container.getIpAddress(container.getNetworkNames()[0]!),
          port: 5432,
        }
      : undefined;

    if (containerEndpoint && !containerEndpoint.address) {
      throw new Error("Container sem endereço interno verificável.");
    }

    await migrateLocal(["deploy"], containerEndpoint);
  } catch (error) {
    await container?.stop();
    throw error;
  }
  const runtime = new URL(url);
  runtime.username = "emprestai_runtime";
  runtime.password = "";
  if (container) {
    const admin = new PrismaClient({ datasources: { db: { url } } });
    try {
      // Disposable container credential only; production role remains password-unset in migration.
      await admin.$executeRaw`ALTER ROLE emprestai_runtime PASSWORD 'disposable-local-only'`;
      runtime.password = "disposable-local-only";
    } finally {
      await admin.$disconnect();
    }
  }
  project.config.env.DATABASE_URL = runtime.toString();
  return async () => { await container?.stop(); };
}
