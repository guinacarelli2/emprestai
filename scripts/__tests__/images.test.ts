// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { main } from "../equipment-images-cli";
import {
  CACHE_MS,
  createReviewTemplate,
  discover,
  equipment,
  escapeHtml,
  finalize,
  galleryHtml,
  manifestToSeedImages,
  MAX_BYTES,
  preparePhoto,
  publicAddress,
  safeRequest,
  safeUrl,
  selectPhoto,
  suggestionsHtml,
  transformImage,
  validateManifest,
  validateManifestFiles,
  type ImageTransport,
  type PreparedImage,
} from "../equipment-images";

const directories: string[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});
async function temporary() {
  const dir = await mkdtemp(join(tmpdir(), "equipment-images-test-"));
  directories.push(dir);
  return dir;
}
const response = (body: Buffer, mime = "image/jpeg", status = 200, location?: string) => ({
  status,
  headers: { "content-type": mime, ...(location ? { location } : {}) },
  body,
});
function photo(id = 1, author = "Author") {
  return {
    id,
    type: "photo",
    pageURL: `https://pixabay.com/photos/item-${id}/`,
    user: author,
    user_id: id,
    largeImageURL: `https://cdn.pixabay.com/photo/item-${id}.jpg`,
  };
}
const api: ImageTransport = async () =>
  response(Buffer.from(JSON.stringify({ hits: [photo(1), photo(2), photo(3)] })), "application/json");
const inspected = {
  noPeople: true,
  noLogos: true,
  noText: true,
  noScreenContent: true,
  equipmentMatch: true,
  licenseRead: true,
};
async function fixture() {
  const dir = await temporary();
  const entries: PreparedImage[] = [];
  // Synthetic fixtures exist exclusively in OS temp directories, never in the inventory/app.
  for (const [index, item] of equipment.entries()) {
    const original = await sharp({
      create: { width: 1000, height: 700, channels: 3, background: { r: index * 18, g: 50, b: 100 } },
    })
      .jpeg()
      .toBuffer();
    await discover(item.patrimonio, "TEST-KEY", dir, async () =>
      response(Buffer.from(JSON.stringify({ hits: [photo(index + 1)] })), "application/json"),
    );
    await selectPhoto(item.patrimonio, index + 1, dir);
    entries.push(await preparePhoto(item.patrimonio, dir, async () => response(original)));
  }
  const template = await createReviewTemplate(dir);
  const review = {
    ...template,
    entries: template.entries.map((entry) => ({
      ...entry,
      reviewer: "Test reviewer",
      reviewedAt: new Date().toISOString(),
      originalInspection: { ...inspected },
      finalCropInspection: { ...inspected },
    })),
  };
  await writeFile(join(dir, "review.json"), JSON.stringify(review));
  return { dir, entries, review };
}

describe("002/CA-05 CA-07 local image pipeline", () => {
  it("test_ca_05_inventory_matches_literal_reference_html", async () => {
    const source = await readFile("references/pratica-sdd.html", "utf8");
    const block = source
      .match(/<pre>(\[\s*\{ &quot;patrimonio&quot;[\s\S]*?\])<\/pre>/)![1]
      .replaceAll("&quot;", '"');
    expect(equipment).toEqual(JSON.parse(block));
    expect(equipment[0].nome).toBe("Notebook 14 polegadas");
  });
  it.each([
    "http://pixabay.com/a",
    "https://evil.test/a",
    "https://pixabay.com.evil.test/a",
    "https://127.0.0.1/a",
    "https://pixabay.com@evil.test/a",
    "https://x:y@pixabay.com/a",
    "https://pixabay.com:444/a",
    "https://cdn.pixabay.com/a?key=secret",
    "https://pixabay.com/a#fragment",
    "https://pixabay.com\\@evil.test/a",
  ])("test_ca_07_rejects_untrusted_url_%s", (value) => expect(() => safeUrl(value)).toThrow());
  it("test_ca_07_rejects_nonpublic_dns_and_allows_global", () => {
    for (const address of [
      "127.0.0.1",
      "10.1.2.3",
      "192.168.1.1",
      "169.254.1.2",
      "100.64.0.1",
      "::1",
      "fc00::1",
      "::ffff:127.0.0.1",
      "2001:db8::1",
    ])
      expect(publicAddress(address)).toBe(false);
    expect(publicAddress("8.8.8.8")).toBe(true);
    expect(publicAddress("2606:4700:4700::1111")).toBe(true);
  });
  it("test_ca_07_validates_each_redirect_and_caps_at_three", async () => {
    const evil = vi.fn(async () =>
      response(Buffer.alloc(0), "image/jpeg", 302, "https://evil.test/image.jpg"),
    );
    await expect(safeRequest("https://cdn.pixabay.com/a.jpg", { transport: evil })).rejects.toThrow();
    expect(evil).toHaveBeenCalledTimes(1);
    const loop = vi.fn(async () => response(Buffer.alloc(0), "image/jpeg", 302, "/next.jpg"));
    await expect(safeRequest("https://cdn.pixabay.com/a.jpg", { transport: loop })).rejects.toThrow();
    expect(loop).toHaveBeenCalledTimes(4);
    let count = 0;
    const transport: ImageTransport = async () =>
      ++count <= 3
        ? response(Buffer.alloc(0), "image/jpeg", 302, "/next.jpg")
        : response(Buffer.from("test"));
    await expect(safeRequest("https://cdn.pixabay.com/a.jpg", { transport })).resolves.toHaveProperty(
      "finalUrl",
      "https://cdn.pixabay.com/next.jpg",
    );
  });
  it("test_ca_07_rejects_mime_size_errors_and_svg_decoding", async () => {
    for (const mime of ["image/svg+xml", "text/html", "application/octet-stream"]) {
      await expect(
        safeRequest("https://cdn.pixabay.com/a.jpg", {
          transport: async () => response(Buffer.from("data"), mime),
        }),
      ).rejects.toThrow("MIME");
    }
    await expect(
      safeRequest("https://cdn.pixabay.com/a.jpg", {
        transport: async () => response(Buffer.alloc(MAX_BYTES + 1)),
      }),
    ).rejects.toThrow("limite");
    await expect(
      safeRequest("https://cdn.pixabay.com/a.jpg", {
        transport: async () => response(Buffer.from("429 error"), "text/plain", 429),
      }),
    ).rejects.toThrow("retry");
    await expect(
      transformImage(
        Buffer.from(
          '<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
        ),
      ),
    ).rejects.toThrow();
    await expect(transformImage(Buffer.from("not an image"))).rejects.toThrow();
  });
  it("test_ca_07_timeout_covers_response_body_without_retry", async () => {
    vi.useFakeTimers();
    try {
      const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation((milliseconds) => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), milliseconds);
        return controller.signal;
      });
      const transport = vi.fn<ImageTransport>(
        async (_url, _limit, signal) =>
          new Promise((_accept, reject) => {
            signal.addEventListener("abort", () => reject(new Error("timeout")), { once: true });
          }),
      );
      const result = expect(safeRequest("https://cdn.pixabay.com/a.jpg", { transport })).rejects.toThrow(
        "timeout",
      );
      await vi.advanceTimersByTimeAsync(10_001);
      await result;
      expect(timeout).toHaveBeenCalledWith(10_000);
      expect(transport).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
  it("test_ca_07_transform_rotates_resizes_and_strips_exif", async () => {
    const source = await sharp({ create: { width: 1200, height: 600, channels: 3, background: "red" } })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    expect((await sharp(source).metadata()).exif).toBeDefined();
    const final = await transformImage(source);
    const metadata = await sharp(final).metadata();
    expect([metadata.width, metadata.height, metadata.format]).toEqual([800, 600, "jpeg"]);
    for (const field of ["exif", "icc", "iptc", "xmp", "orientation"] as const)
      expect(metadata[field]).toBeUndefined();
  });
  it("test_ca_05_discover_caches_24h_sanitizes_and_no_key_or_images_in_html", async () => {
    const dir = await temporary();
    const transport = vi.fn(api);
    const result = await discover("TI-0001", "TEST-SECRET", dir, transport);
    await discover("TI-0001", "", dir, transport);
    expect(transport).toHaveBeenCalledTimes(1);
    const query = transport.mock.calls[0][0];
    expect(query.searchParams.get("q")).toBe(equipment[0].busca);
    expect(query.searchParams.get("per_page")).toBe("3");
    expect(query.searchParams.get("safesearch")).toBe("true");
    const cache = await readFile(join(dir, "cache-TI-0001.json"), "utf8");
    const html = await readFile(join(dir, "suggestions-TI-0001.html"), "utf8");
    expect(cache + html).not.toContain("TEST-SECRET");
    expect(html).not.toContain("<img");
    expect(cache).not.toContain('"key"');
    await writeFile(
      join(dir, "cache-TI-0001.json"),
      JSON.stringify({ ...result, fetchedAt: new Date(Date.now() - CACHE_MS - 100).toISOString() }),
    );
    await discover("TI-0001", "TEST-SECRET", dir, transport);
    expect(transport).toHaveBeenCalledTimes(2);
  });
  it("test_ca_05_download_only_explicit_cached_selection", async () => {
    const dir = await temporary();
    await discover("TI-0001", "TEST", dir, api);
    await expect(selectPhoto("TI-0001", 99, dir)).rejects.toThrow("cache");
    await expect(preparePhoto("TI-0001", dir, api)).rejects.toThrow();
    await selectPhoto("TI-0001", 1, dir);
    await discover("TI-0002", "TEST", dir, api);
    await expect(selectPhoto("TI-0002", 1, dir)).rejects.toThrow("outro item");
    const source = await sharp({ create: { width: 900, height: 700, channels: 3, background: "blue" } })
      .png()
      .toBuffer();
    const download = vi.fn(async () => response(source, "image/png"));
    const entry = await preparePhoto("TI-0001", dir, download);
    expect(download.mock.calls).toHaveLength(1);
    expect(entry.file).toBe("TI-0001.jpg");
    expect(entry.storagePath).toBe("equipment/TI-0001.jpg");
  });
  it("test_ca_07_escapes_html_labels_and_attributes", async () => {
    const dir = await temporary();
    const cache = await discover("TI-0001", "TEST", dir, async () =>
      response(
        Buffer.from(JSON.stringify({ hits: [photo(1, '<img onerror="alert(1)">')] })),
        "application/json",
      ),
    );
    const html = suggestionsHtml("TI-0001", cache.hits);
    expect(html).toContain("&lt;img onerror=&quot;alert(1)&quot;&gt;");
    expect(html).not.toContain('<img onerror="');
    expect(escapeHtml("'&<>\"")).toBe("&#39;&amp;&lt;&gt;&quot;");
  });
  it("test_ca_07_cli_blocks_authenticated_discovery_without_human_tty", async () => {
    await expect(main(["discover", "TI-0001"])).rejects.toThrow("--human");
  });
  it("test_ca_05_manifest_binds_review_hash_provenance_and_maps_exact_seed_contract", async () => {
    const { dir, review } = await fixture();
    await expect(createReviewTemplate(dir)).rejects.toThrow(); // Never overwrite human work.
    const manifest = await finalize(dir);
    expect((await validateManifestFiles(manifest, dir)).entries).toHaveLength(12);
    const images = manifestToSeedImages(manifest);
    expect(images[0]).toEqual({
      patrimonio: "TI-0001",
      imagePath: "equipment/TI-0001.jpg",
      photoId: "1",
      photoPage: "https://pixabay.com/photos/item-1/",
      photographer: "Author",
      photographerUrl: "https://pixabay.com/users/Author-1/",
      licenseName: "Pixabay Content License",
      licenseUrl: "https://pixabay.com/service/license-summary/",
      imageHash: manifest.entries[0].sha256,
    });
    const duplicate = structuredClone(manifest);
    duplicate.entries[1].photoId = duplicate.entries[0].photoId;
    expect(() => validateManifest(duplicate)).toThrow();
    const duplicateHash = structuredClone(manifest);
    duplicateHash.entries[1].sha256 = duplicateHash.entries[0].sha256;
    expect(() => validateManifest(duplicateHash)).toThrow();
    const reordered = structuredClone(manifest);
    reordered.entries.reverse();
    expect(() => validateManifest(reordered)).toThrow();
    const unreviewed = structuredClone(manifest);
    (unreviewed.entries[0].review.originalInspection.noPeople as unknown) = null;
    expect(() => validateManifest(unreviewed)).toThrow();
    const traversal = structuredClone(manifest);
    traversal.entries[0].file = "../TI-0001.jpg";
    expect(() => validateManifest(traversal)).toThrow();
    const html = galleryHtml(manifest.entries);
    expect(html).toContain('src="TI-0001.jpg"');
    expect(html).not.toMatch(/src="https?:/);
    const editedReview = structuredClone(review);
    editedReview.entries[0].sha256 = "0".repeat(64);
    await writeFile(join(dir, "review.json"), JSON.stringify(editedReview));
    await expect(finalize(dir)).rejects.toThrow();
    await writeFile(join(dir, "TI-0001.jpg"), Buffer.from("tampered"));
    await expect(validateManifestFiles(manifest, dir)).rejects.toThrow("Hash");
  });
  it("test_ca_05_rejects_blank_review_template_and_changed_provenance", async () => {
    const { dir, review } = await fixture();
    await writeFile(
      join(dir, "review.json"),
      JSON.stringify({
        ...review,
        entries: review.entries.map((entry) => ({
          ...entry,
          reviewer: "",
          originalInspection: { ...inspected, noPeople: null },
        })),
      }),
    );
    await expect(finalize(dir)).rejects.toThrow();
    await writeFile(join(dir, "review.json"), JSON.stringify(review));
    const manifest = await finalize(dir);
    const cache = JSON.parse(await readFile(join(dir, "cache-TI-0001.json"), "utf8"));
    cache.hits[0].photographer = "Changed";
    await writeFile(join(dir, "cache-TI-0001.json"), JSON.stringify(cache));
    await expect(validateManifestFiles(manifest, dir)).rejects.toThrow("Proveniência");
  });
});
