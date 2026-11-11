import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const cssDir = join(process.cwd(), ".next", "static", "css");
const files = (await readdir(cssDir)).filter((file) => file.endsWith(".css"));

if (files.length === 0) {
  throw new Error("Nenhum arquivo CSS foi gerado pelo build.");
}

const css = await Promise.all(
  files.map((file) => readFile(join(cssDir, file), "utf8")),
);

const bundle = css.join("\n");
const hasUtilities = bundle.includes(".bg-bg") && bundle.includes(".flex");
const hasUnprocessedTailwind =
  bundle.includes("@theme") || bundle.includes("@utility");

if (!hasUtilities || hasUnprocessedTailwind) {
  throw new Error(
    "Tailwind não foi compilado: o bundle final ainda não contém utilities esperadas ou contém @theme/@utility.",
  );
}

console.info(
  `CSS verificado: ${files.length} arquivo(s), utilities Tailwind presentes.`,
);