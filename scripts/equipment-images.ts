import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { BlockList, isIP } from "node:net";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import inventory from "../assets/equipment-list.json";

export const equipment = inventory;
export const IMAGE_DIR = resolve(".local/images");
export const CACHE_MS = 24 * 60 * 60 * 1000;
export const MAX_BYTES = 10 * 1024 * 1024;
export const LICENSE_URL = "https://pixabay.com/service/license-summary/";
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const idSchema = z.number().int().positive().safe();
export const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");
const fail = (message: string): never => {
  throw new Error(message);
};

export function safeUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return fail("URL inválida.");
  }
  if (
    !/^https:\/\/(pixabay\.com|cdn\.pixabay\.com)\//.test(value) ||
    url.protocol !== "https:" ||
    !["pixabay.com", "cdn.pixabay.com"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    /[\u0000-\u0020\\]/.test(value)
  ) {
    return fail("URL fora da política Pixabay.");
  }
  return url;
}
const sourceUrl = z.string().superRefine((value, ctx) => {
  try {
    safeUrl(value);
  } catch {
    ctx.addIssue({ code: "custom", message: "URL fora da política Pixabay." });
  }
});
const pageUrl = sourceUrl.refine((value) => new URL(value).hostname === "pixabay.com");
const blocked = new BlockList();
for (const [ip, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 3],
] as const)
  blocked.addSubnet(ip, prefix, "ipv4");
export function publicAddress(address: string) {
  if (isIP(address) === 4) return !blocked.check(address, "ipv4");
  // Only global unicast IPv6; reject mapped IPv4, local, multicast and documentation ranges.
  if (isIP(address) !== 6) return false;
  const global = new BlockList();
  global.addSubnet("2000::", 3, "ipv6");
  const reserved = new BlockList();
  reserved.addSubnet("2001::", 23, "ipv6");
  reserved.addSubnet("2001:db8::", 32, "ipv6");
  reserved.addSubnet("2002::", 16, "ipv6");
  reserved.addSubnet("3fff::", 20, "ipv6");
  return global.check(address, "ipv6") && !reserved.check(address, "ipv6");
}

type WireResponse = { status: number; headers: Record<string, string | string[] | undefined>; body: Buffer };
export type ImageTransport = (url: URL, limit: number, signal: AbortSignal) => Promise<WireResponse>;
const pinnedTransport: ImageTransport = async (url, limit, signal) => {
  const addresses = await Promise.race([
    lookup(url.hostname, { all: true, family: 4 }),
    new Promise<never>((_accept, reject) => {
      if (signal.aborted) reject(new Error("Tempo de resposta excedido."));
      else
        signal.addEventListener("abort", () => reject(new Error("Tempo de resposta excedido.")), {
          once: true,
        });
    }),
  ]);
  if (!addresses.length || addresses.some(({ address }) => !publicAddress(address)))
    fail("Endereço de rede bloqueado.");
  if (signal.aborted) fail("Tempo de resposta excedido.");
  const chosen = addresses[0];
  return new Promise((accept, reject) => {
    const req = request(
      url,
      {
        signal,
        family: chosen.family,
        lookup: (_hostname, _options, callback) => callback(null, chosen.address, chosen.family),
        headers: {
          Accept: url.pathname === "/api/" ? "application/json" : "image/jpeg,image/png,image/webp",
        },
      },
      (res) => {
        if (Number(res.headers["content-length"] ?? 0) > limit) {
          res.destroy();
          reject(new Error("Resposta excede limite de bytes."));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > limit) {
            res.destroy();
            reject(new Error("Resposta excede limite de bytes."));
          } else chunks.push(chunk);
        });
        res.on("end", () =>
          accept({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }),
        );
        res.on("error", () => reject(new Error("Leitura de rede não concluída.")));
      },
    );
    req.on("error", () => reject(new Error("Requisição de rede não concluída.")));
    req.end();
  });
};

export async function safeRequest(
  value: string,
  options: { apiKey?: string; transport?: ImageTransport } = {},
) {
  let url = safeUrl(value);
  const api = options.apiKey !== undefined;
  if (api && (url.hostname !== "pixabay.com" || url.pathname !== "/api/")) fail("Endpoint inválido.");
  const signal = AbortSignal.timeout(10_000);
  const limit = api ? 1024 * 1024 : MAX_BYTES;
  // The query exists only in memory, never in cache, logs, HTML or errors.
  if (api) {
    url.searchParams.set("key", options.apiKey!);
  }
  for (let redirects = 0; ; redirects++) {
    const response = await (options.transport ?? pinnedTransport)(url, limit, signal);
    if (response.body.length > limit) fail("Resposta excede limite de bytes.");
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (api || redirects >= 3) fail("Redirecionamento não permitido.");
      const location = response.headers.location;
      if (typeof location !== "string") throw new Error("Redirecionamento inválido.");
      url = safeUrl(new URL(location, url).href);
      continue;
    }
    if (response.status !== 200) fail("Pixabay não concluiu a requisição; não há retry automático.");
    const mime = String(response.headers["content-type"] ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!(api ? mime === "application/json" : ["image/jpeg", "image/png", "image/webp"].includes(mime)))
      fail("MIME não permitido.");
    return { body: response.body, mime, finalUrl: api ? "https://pixabay.com/api/" : url.href };
  }
}
const hitSchema = z
  .object({
    photoId: idSchema,
    pageUrl,
    photographer: z.string().min(1).max(200),
    photographerUrl: pageUrl,
    downloadUrl: sourceUrl,
    sourceEndpoint: z.literal("https://pixabay.com/api/"),
  })
  .strict();
export type PhotoHit = z.infer<typeof hitSchema>;
const cacheSchema = z
  .object({
    version: z.literal(1),
    patrimonio: z.string(),
    query: z.string(),
    fetchedAt: z.iso.datetime(),
    hits: z.array(hitSchema).max(3),
  })
  .strict();
const fileSchema = z.string().regex(/^TI-\d{4}\.jpg$/);
const originalFileSchema = z.string().regex(/^original-TI-\d{4}\.(jpg|png|webp)$/);
const preparedEntrySchema = hitSchema
  .extend({
    patrimonio: z.string(),
    nome: z.string(),
    file: fileSchema,
    storagePath: z.string(),
    source: z.literal("Pixabay"),
    licenseName: z.literal("Pixabay Content License"),
    licenseUrl: z.literal(LICENSE_URL),
    sha256: hashSchema,
    originalSha256: hashSchema,
    originalFile: originalFileSchema,
    width: z.literal(800),
    height: z.literal(600),
  })
  .strict();
export type PreparedImage = z.infer<typeof preparedEntrySchema>;
const inspectionSchema = z
  .object({
    noPeople: z.literal(true),
    noLogos: z.literal(true),
    noText: z.literal(true),
    noScreenContent: z.literal(true),
    equipmentMatch: z.literal(true),
    licenseRead: z.literal(true),
  })
  .strict();
const reviewEntrySchema = z
  .object({
    patrimonio: z.string(),
    photoId: idSchema,
    sha256: hashSchema,
    originalSha256: hashSchema,
    reviewer: z.string().trim().min(2).max(200),
    reviewedAt: z.iso.datetime(),
    originalInspection: inspectionSchema,
    finalCropInspection: inspectionSchema,
  })
  .strict();
const reviewSchema = z
  .object({
    version: z.literal(1),
    preparationSha256: hashSchema,
    entries: z.array(reviewEntrySchema).length(12),
  })
  .strict();
const manifestEntrySchema = preparedEntrySchema
  .extend({
    reviewer: z.string().trim().min(2),
    reviewedAt: z.iso.datetime(),
    review: reviewEntrySchema,
  })
  .strict();
const manifestSchema = z
  .object({
    version: z.literal(1),
    preparationSha256: hashSchema,
    entries: z.array(manifestEntrySchema).length(12),
  })
  .strict();
export type ImageManifest = z.infer<typeof manifestSchema>;

async function json(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}
async function save(path: string, value: unknown, exclusive = false) {
  await writeFile(path, JSON.stringify(value, null, 2) + "\n", { mode: 0o600, flag: exclusive ? "wx" : "w" });
}
function itemFor(patrimonio: string) {
  return (
    equipment.find((item) => item.patrimonio === patrimonio) ?? fail("Patrimônio fora do inventário literal.")
  );
}
async function ensure(dir: string) {
  await mkdir(dir, { recursive: true, mode: 0o700 });
}
async function readCache(dir: string, patrimonio: string, fresh: boolean) {
  const item = itemFor(patrimonio);
  const cache = cacheSchema.parse(await json(join(dir, `cache-${patrimonio}.json`)));
  const age = Date.now() - Date.parse(cache.fetchedAt);
  if (cache.patrimonio !== patrimonio || cache.query !== item.busca || age < 0 || (fresh && age >= CACHE_MS))
    fail("Cache inválido ou expirado; refaça discover.");
  return cache;
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );
}
function htmlPage(content: string) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file:; base-uri 'none'; form-action 'none'"><title>Revisão Pixabay local</title></head><body><h1>Fotos: <a href="https://pixabay.com/" rel="noreferrer">Pixabay</a></h1><p>Inspecione original e recorte. SafeSearch não comprova ausência de restrições.</p>${content}</body></html>`;
}
export function suggestionsHtml(patrimonio: string, hits: PhotoHit[]) {
  const item = itemFor(patrimonio);
  return htmlPage(
    `<h2>${escapeHtml(item.nome)} — ${patrimonio}</h2>` +
      hits
        .map((hit) => {
          hitSchema.parse(hit);
          return `<p>ID ${hit.photoId}: <a href="${escapeHtml(hit.pageUrl)}" rel="noreferrer">Inspecionar foto no Pixabay</a> — <a href="${escapeHtml(hit.photographerUrl)}" rel="noreferrer">${escapeHtml(hit.photographer)}</a></p>`;
        })
        .join(""),
  );
}

export async function discover(patrimonio: string, key: string, dir = IMAGE_DIR, transport?: ImageTransport) {
  const item = itemFor(patrimonio);
  await ensure(dir);
  let cache: z.infer<typeof cacheSchema> | undefined;
  try {
    cache = await readCache(dir, patrimonio, true);
  } catch (error) {
    // A valid but expired cache is refreshed; malformed data is never used as provenance.
    if (!(error instanceof Error)) throw error;
  }
  if (!cache) {
    if (!key.trim()) fail("PIXABAY_API_KEY ausente no ambiente humano.");
    const searchTransport: ImageTransport = (url, limit, signal) => {
      url.searchParams.set("q", item.busca);
      for (const [name, value] of Object.entries({
        image_type: "photo",
        safesearch: "true",
        per_page: "3",
        page: "1",
        min_width: "800",
        min_height: "600",
      }))
        url.searchParams.set(name, value);
      return (transport ?? pinnedTransport)(url, limit, signal);
    };
    const response = await safeRequest("https://pixabay.com/api/", {
      apiKey: key,
      transport: searchTransport,
    });
    const payload = z
      .object({
        hits: z
          .array(
            z.object({
              id: idSchema,
              type: z.literal("photo"),
              pageURL: pageUrl,
              user: z.string().min(1).max(200),
              user_id: idSchema,
              largeImageURL: sourceUrl,
            }),
          )
          .max(3),
      })
      .parse(JSON.parse(response.body.toString("utf8")));
    const hits = payload.hits.map((hit) =>
      hitSchema.parse({
        photoId: hit.id,
        pageUrl: hit.pageURL,
        photographer: hit.user,
        photographerUrl: `https://pixabay.com/users/${encodeURIComponent(hit.user)}-${hit.user_id}/`,
        downloadUrl: hit.largeImageURL,
        sourceEndpoint: "https://pixabay.com/api/",
      }),
    );
    cache = { version: 1, patrimonio, query: item.busca, fetchedAt: new Date().toISOString(), hits };
    await save(join(dir, `cache-${patrimonio}.json`), cache);
  }
  await writeFile(join(dir, `suggestions-${patrimonio}.html`), suggestionsHtml(patrimonio, cache.hits), {
    mode: 0o600,
  });
  return cache;
}

const selectionsSchema = z
  .object({
    version: z.literal(1),
    selections: z.array(z.object({ patrimonio: z.string(), photoId: idSchema }).strict()),
  })
  .strict();
export async function selectPhoto(patrimonio: string, photoId: number, dir = IMAGE_DIR) {
  const cache = await readCache(dir, patrimonio, true);
  if (!cache.hits.some((hit) => hit.photoId === photoId)) fail("ID não pertence às sugestões em cache.");
  let selections: z.infer<typeof selectionsSchema> = { version: 1, selections: [] };
  try {
    selections = selectionsSchema.parse(await json(join(dir, "selection.json")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (selections.selections.some((entry) => entry.photoId === photoId && entry.patrimonio !== patrimonio))
    fail("ID já selecionado para outro item.");
  selections.selections = selections.selections.filter((entry) => entry.patrimonio !== patrimonio);
  selections.selections.push({ patrimonio, photoId });
  await save(join(dir, "selection.json"), selections);
}

export async function transformImage(input: Buffer) {
  if (input.length > MAX_BYTES) fail("Imagem excede limite de bytes.");
  const image = sharp(input, { limitInputPixels: 40_000_000, failOn: "warning", animated: false });
  const metadata = await image.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) !== 1)
    fail("Formato de imagem não permitido.");
  return image
    .rotate()
    .resize(800, 600, { fit: "cover", position: "centre" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}
async function prepared(dir: string): Promise<PreparedImage[]> {
  try {
    return z.array(preparedEntrySchema).parse(await json(join(dir, "prepared.json")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
export function galleryHtml(entries: PreparedImage[]) {
  return htmlPage(
    entries
      .map((entry) => {
        z.union([preparedEntrySchema, manifestEntrySchema]).parse(entry);
        return `<section><h2>${escapeHtml(entry.patrimonio)} — ${escapeHtml(entry.nome)}</h2><p>${escapeHtml(entry.photographer)} / Pixabay; ID ${entry.photoId}</p><h3>Original</h3><img src="${escapeHtml(entry.originalFile)}" alt="Original ${escapeHtml(entry.nome)}"><h3>Recorte 800×600</h3><img width="800" height="600" src="${escapeHtml(entry.file)}" alt="Recorte ${escapeHtml(entry.nome)}"><p>SHA-256 ${entry.sha256}</p></section>`;
      })
      .join(""),
  );
}
export async function preparePhoto(patrimonio: string, dir = IMAGE_DIR, transport?: ImageTransport) {
  const item = itemFor(patrimonio);
  const cache = await readCache(dir, patrimonio, true);
  const selection = selectionsSchema
    .parse(await json(join(dir, "selection.json")))
    .selections.filter((entry) => entry.patrimonio === patrimonio);
  if (selection.length !== 1) fail("Selecione explicitamente um ID antes de preparar.");
  const hit =
    cache.hits.find((entry) => entry.photoId === selection[0].photoId) ??
    fail("Seleção não pertence ao cache atual.");
  const old = await prepared(dir);
  if (old.some((entry) => entry.patrimonio !== patrimonio && entry.photoId === hit.photoId))
    fail("ID de foto duplicado.");
  const response = await safeRequest(hit.downloadUrl, { transport });
  const output = await transformImage(response.body);
  const hash = sha256(output);
  if (old.some((entry) => entry.patrimonio !== patrimonio && entry.sha256 === hash))
    fail("Arquivo final duplicado.");
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[response.mime]!;
  const entry = preparedEntrySchema.parse({
    ...hit,
    patrimonio,
    nome: item.nome,
    file: `${patrimonio}.jpg`,
    storagePath: `equipment/${patrimonio}.jpg`,
    source: "Pixabay",
    licenseName: "Pixabay Content License",
    licenseUrl: LICENSE_URL,
    sha256: hash,
    originalSha256: sha256(response.body),
    originalFile: `original-${patrimonio}.${ext}`,
    width: 800,
    height: 600,
  });
  await writeFile(join(dir, entry.originalFile), response.body, { mode: 0o600 });
  await writeFile(join(dir, entry.file), output, { mode: 0o600 });
  const entries = [...old.filter((entry) => entry.patrimonio !== patrimonio), entry].sort((a, b) =>
    a.patrimonio.localeCompare(b.patrimonio),
  );
  await save(join(dir, "prepared.json"), entries);
  await writeFile(join(dir, "gallery.html"), galleryHtml(entries), { mode: 0o600 });
  return entry;
}

function exactEntries(entries: PreparedImage[]) {
  if (
    entries.length !== 12 ||
    entries.some(
      (entry, index) =>
        entry.patrimonio !== equipment[index].patrimonio ||
        entry.nome !== equipment[index].nome ||
        entry.file !== `${entry.patrimonio}.jpg` ||
        entry.storagePath !== `equipment/${entry.patrimonio}.jpg` ||
        !entry.originalFile.startsWith(`original-${entry.patrimonio}.`),
    )
  )
    fail("São obrigatórios os doze itens literais ordenados e seus caminhos exatos.");
  if (
    new Set(entries.map((e) => e.photoId)).size !== 12 ||
    new Set(entries.map((e) => e.sha256)).size !== 12 ||
    new Set(entries.map((e) => e.originalSha256)).size !== 12
  )
    fail("IDs e hashes devem ser únicos.");
}
async function regularFile(dir: string, name: string) {
  const path = join(dir, name);
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_BYTES) fail("Arquivo local inválido.");
  return readFile(path);
}
async function checkFiles(entries: PreparedImage[], dir: string) {
  exactEntries(entries);
  for (const entry of entries) {
    const file = await regularFile(dir, entry.file);
    const original = await regularFile(dir, entry.originalFile);
    if (sha256(file) !== entry.sha256 || sha256(original) !== entry.originalSha256)
      fail("Hash alterado; preparação e revisão devem ser refeitas.");
    const meta = await sharp(file).metadata();
    if (
      meta.format !== "jpeg" ||
      meta.width !== 800 ||
      meta.height !== 600 ||
      meta.exif ||
      meta.icc ||
      meta.iptc ||
      meta.xmp ||
      (meta.pages ?? 1) !== 1
    )
      fail("JPEG deve ter 800×600 sem metadados.");
    if (sha256(await transformImage(original)) !== entry.sha256) fail("Recorte não corresponde ao original.");
    const cache = await readCache(dir, entry.patrimonio, false);
    if (
      !cache.hits.some((hit) =>
        Object.entries(hit).every(([key, value]) => entry[key as keyof PreparedImage] === value),
      )
    )
      fail("Proveniência não corresponde à resposta API em cache.");
  }
}
export async function createReviewTemplate(dir = IMAGE_DIR) {
  const entries = await prepared(dir);
  await checkFiles(entries, dir);
  const blank = {
    noPeople: null,
    noLogos: null,
    noText: null,
    noScreenContent: null,
    equipmentMatch: null,
    licenseRead: null,
  };
  const review = {
    version: 1,
    preparationSha256: sha256(JSON.stringify(entries)),
    entries: entries.map((entry) => ({
      patrimonio: entry.patrimonio,
      photoId: entry.photoId,
      sha256: entry.sha256,
      originalSha256: entry.originalSha256,
      reviewer: "",
      reviewedAt: "",
      originalInspection: { ...blank },
      finalCropInspection: { ...blank },
    })),
  };
  await save(join(dir, "review.json"), review, true);
  return review;
}
function bindReview(entries: PreparedImage[], value: unknown) {
  exactEntries(entries);
  const review = reviewSchema.parse(value);
  if (review.preparationSha256 !== sha256(JSON.stringify(entries)))
    fail("Revisão pertence a outra preparação.");
  return entries.map((entry, index) => {
    const inspected = review.entries[index];
    if (
      inspected.patrimonio !== entry.patrimonio ||
      inspected.photoId !== entry.photoId ||
      inspected.sha256 !== entry.sha256 ||
      inspected.originalSha256 !== entry.originalSha256 ||
      Date.parse(inspected.reviewedAt) > Date.now()
    )
      fail("Revisão não corresponde ao arquivo, ID ou data.");
    return { ...entry, reviewer: inspected.reviewer, reviewedAt: inspected.reviewedAt, review: inspected };
  });
}
export function validateManifest(value: unknown): ImageManifest {
  const manifest = manifestSchema.parse(value);
  const entries = manifest.entries.map((entry) =>
    preparedEntrySchema.parse(
      Object.fromEntries(
        Object.entries(entry).filter(([key]) => !["reviewer", "reviewedAt", "review"].includes(key)),
      ),
    ),
  );
  const bound = bindReview(entries, {
    version: 1,
    preparationSha256: manifest.preparationSha256,
    entries: manifest.entries.map((entry) => entry.review),
  });
  if (
    bound.some(
      (entry, index) =>
        entry.reviewer !== manifest.entries[index].reviewer ||
        entry.reviewedAt !== manifest.entries[index].reviewedAt,
    )
  )
    fail("Identidade/data divergentes da revisão.");
  return manifest;
}
export async function validateManifestFiles(value: unknown, dir = IMAGE_DIR): Promise<ImageManifest> {
  const manifest = validateManifest(value);
  await checkFiles(manifest.entries, dir);
  const current = await prepared(dir);
  const bound = bindReview(current, await json(join(dir, "review.json")));
  if (JSON.stringify(bound) !== JSON.stringify(manifest.entries))
    fail("Manifesto não corresponde à preparação/revisão atual.");
  return manifest;
}
export async function finalize(dir = IMAGE_DIR): Promise<ImageManifest> {
  const entries = await prepared(dir);
  const review = await json(join(dir, "review.json"));
  const manifest = await validateManifestFiles(
    { version: 1, preparationSha256: sha256(JSON.stringify(entries)), entries: bindReview(entries, review) },
    dir,
  );
  await save(join(dir, "manifest.json"), manifest);
  return manifest;
}
export async function verify(dir = IMAGE_DIR) {
  return validateManifestFiles(await json(join(dir, "manifest.json")), dir);
}
export function manifestToSeedImages(value: ImageManifest) {
  const manifest = validateManifest(value);
  return manifest.entries.map((entry) => ({
    patrimonio: entry.patrimonio,
    imagePath: entry.storagePath,
    photoId: String(entry.photoId),
    photoPage: entry.pageUrl,
    photographer: entry.photographer,
    photographerUrl: entry.photographerUrl,
    licenseName: entry.licenseName,
    licenseUrl: entry.licenseUrl,
    imageHash: entry.sha256,
  }));
}
