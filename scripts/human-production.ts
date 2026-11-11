import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { seedInventory } from "../prisma/seed";
import { validateManifestFiles, manifestToSeedImages, sha256 } from "./equipment-images";

// Launcher interativo humano. Não confunde confirmação com isolamento do agente:
// o verificador fica sem rede e sem os segredos; este comando não é executado por ele.
export async function humanConfirmation(action: string) {
  if (!["migrate", "seed", "images", "runtime-password"].includes(action) || !stdin.isTTY || !stdout.isTTY) throw new Error("Ação remota exige terminal humano interativo.");
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    const project = (await prompt.question("ID público do projeto Supabase que você deseja alterar: ")).trim();
    if (!/^[a-z]{20}$/.test(project)) throw new Error("ID público de projeto inválido.");
    const confirmation = await prompt.question(`Esta ação altera PRODUÇÃO. Digite ${action.toUpperCase()} ${project} para confirmar: `);
    if (confirmation !== `${action.toUpperCase()} ${project}`) throw new Error("Ação cancelada.");
    return project;
  } finally { prompt.close(); }
}

async function main() {
  const action = process.argv[2] ?? "";
  const project = await humanConfirmation(action);
  process.loadEnvFile(resolve(".env.local"));
  const url = new URL(process.env.SUPABASE_URL ?? "");
  if (url.origin !== `https://${project}.supabase.co` || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("SUPABASE_URL não corresponde ao projeto confirmado.");
  const direct = new URL(process.env.DIRECT_URL ?? "");
  if (!["postgres:", "postgresql:"].includes(direct.protocol) || Number(direct.port || 5432) !== 5432 || direct.pathname !== "/postgres") throw new Error("DIRECT_URL deve usar PostgreSQL do projeto, porta 5432 e banco postgres.");
  if (!(direct.hostname === `db.${project}.supabase.co` || (direct.hostname.endsWith(".pooler.supabase.com") && decodeURIComponent(direct.username).endsWith(`.${project}`)))) throw new Error("DIRECT_URL não corresponde ao projeto confirmado.");
  const env = { ...process.env, DATABASE_URL: direct.toString(), DIRECT_URL: direct.toString() };
  if (action === "migrate") {
    const result = spawnSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"], { env, stdio: ["inherit", "pipe", "pipe"] });
    if (result.error || result.status !== 0) throw new Error("Migration humana falhou. Revise conexão direta/session pooler, permissões da role e migrations; saídas não são impressas para preservar segredos.");
    console.log("Migration aplicada pelo terminal humano. Verifique as tabelas, RLS e role antes de popular.");
    return;
  }
if (action === "runtime-password") {
    // psql masks both password prompts and computes SCRAM locally; no plaintext SQL/argv/logs.
    const result = spawnSync(
      "psql",
      [
        "-X",
        "--no-password",
        "--set=ON_ERROR_STOP=1",
        "-c",
        "SET password_encryption = 'scram-sha-256'; SET log_statement = 'none'; SET log_min_duration_statement = -1; SET log_min_error_statement = 'panic';",
        "-c",
        "\\password emprestai_runtime",
      ],
      {
        env: {
          ...process.env,
          PGHOST: direct.hostname,
          PGPORT: direct.port || "5432",
          PGDATABASE: "postgres",
          PGUSER: decodeURIComponent(direct.username),
          PGPASSWORD: decodeURIComponent(direct.password),
          PGSSLMODE: "require",
          PSQL_HISTORY: process.platform === "win32" ? "NUL" : "/dev/null",
        },
        stdio: ["inherit", "inherit", "pipe"],
      },
    );
    if (result.error || result.status !== 0) {
      const detail = result.stderr?.toString() ?? "";
      const reason =
        /did not match|do not match|não coincidem|não conferem|diferentes/i.test(detail)
          ? "As duas senhas não coincidiram."
          : /permission denied|must be superuser|insufficient privilege|permissão negada/i.test(detail)
            ? "O banco recusou a alteração por falta de permissão."
            : /does not exist|não existe/i.test(detail)
              ? "O banco não encontrou a role solicitada."
              : /empty|vazia|em branco/i.test(detail)
                ? "A senha foi recebida vazia."
                : /connection|SSL|timeout|conexão/i.test(detail)
                  ? "Falha de conexão durante a alteração."
                  : "Erro não identificado; detalhes privados foram preservados.";
      throw new Error(`Provisionamento não concluído: ${reason}`);
    }
    console.log(
      "Senha runtime definida pelo humano. Configure DATABASE_URL privada com emprestai_runtime, nunca com o administrador; valide suporte do pooler a login customizado.",
    );
    return;
  }
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Configure a chave administrativa somente no ambiente local humano.");
  const supabase = createClient(url.origin, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const imageDir = resolve(".local/images");
  const manifest = await validateManifestFiles(JSON.parse(await readFile(resolve(imageDir, "manifest.json"), "utf8")), imageDir);
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "";
  if (!/^[a-zA-Z0-9_-]+$/.test(bucket)) throw new Error("Nome de bucket inválido.");
  const imageData = manifestToSeedImages(manifest);
  if (action === "images") {
    const existing = await supabase.storage.getBucket(bucket);
    if (existing.error) {
      throw new Error("Bucket não confirmado. Crie e revise um bucket público pelo painel humano; nada foi enviado.");
    } else if (!existing.data.public) {
      throw new Error("O bucket existente é privado. Não foi tornado público automaticamente; revise o destino.");
    }
    // Upsert usa caminhos determinísticos; só os arquivos revisados e verificados são enviados.
    for (const entry of manifest.entries) {
      const bytes = await readFile(resolve(imageDir, entry.file));
      if (sha256(bytes) !== entry.sha256) throw new Error("Imagem modificada após a revisão; upload cancelado.");
      const uploaded = await supabase.storage.from(bucket).upload(entry.storagePath, bytes, { contentType: "image/jpeg", upsert: true, cacheControl: "3600" });
      if (uploaded.error) throw new Error("Upload parcial não concluído. Repita o comando humano para os mesmos caminhos após revisar o erro.");
    }
    await writeFile(resolve(imageDir, "upload-receipt.json"), JSON.stringify({ project, bucket, uploadedAt: new Date().toISOString(), manifestHash: sha256(JSON.stringify(manifest)), entries: imageData }, null, 2) + "\n", { mode: 0o600 });
    console.log("Doze fotos revisadas enviadas pelo terminal humano a caminhos determinísticos. Seed permanece uma ação separada.");
    return;
  }
  const identities = { teacher: process.env.TEACHER_AUTH_USER_ID ?? "", operations: process.env.OPERATIONS_AUTH_USER_ID ?? "", test: process.env.TEST_AUTH_USER_ID ?? "" };
  const teacher = await supabase.auth.admin.getUserById(identities.teacher);
  if (teacher.error || teacher.data.user?.email !== "marcelo.grilo@institutojef.org.br") throw new Error("A identidade do professor não corresponde ao e-mail obrigatório.");
  for (const id of [identities.operations, identities.test]) {
    const result = await supabase.auth.admin.getUserById(id);
    if (result.error || !result.data.user?.email) throw new Error("Identidade de Operações/testes ausente no Auth.");
  }
  const receipt = JSON.parse(await readFile(resolve(imageDir, "upload-receipt.json"), "utf8")) as { project?: string; bucket?: string; manifestHash?: string };
  if (receipt.project !== project || receipt.bucket !== bucket || receipt.manifestHash !== sha256(JSON.stringify(manifest))) throw new Error("Comprovante de upload ausente ou não corresponde às imagens/destino.");
  // Recibo local sozinho não prova upload: conferir acesso público e bytes antes do seed.
  for (const entry of manifest.entries) {
    const path = `${url.origin}/storage/v1/object/public/${encodeURIComponent(bucket)}/${entry.storagePath.split("/").map(encodeURIComponent).join("/")}`;
    const response = await fetch(path, { redirect: "error", signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/jpeg") || Number(response.headers.get("content-length") ?? 0) > 10 * 1024 * 1024) throw new Error("Foto pública indisponível ou inválida; seed cancelado.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (!response.body) throw new Error("Foto pública sem conteúdo; seed cancelado.");
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 10 * 1024 * 1024) throw new Error("Foto pública excede limite; seed cancelado.");
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
      reader.releaseLock();
    }
    if (sha256(Buffer.concat(chunks)) !== entry.sha256) throw new Error("Bytes públicos não correspondem à revisão; seed cancelado.");
  }
  const images = imageData;
  const db = new PrismaClient({ datasources: { db: { url: direct.toString() } } });
  try {
    const result = await seedInventory(db, identities, images);
    console.log(JSON.stringify({ action: "human_seed", ...result }));
  } finally { await db.$disconnect(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    // Não imprimir erro de API/driver, pois pode incluir URLs/chaves.
    console.error(error instanceof Error && !/https?:|postgres:|token|jwt/i.test(error.message) ? error.message : "Ação humana não concluída. Verifique configuração e permissões sem compartilhar segredos.");
    process.exitCode = 1;
  });
}
