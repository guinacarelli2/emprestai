import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createReviewTemplate,
  discover,
  finalize,
  IMAGE_DIR,
  preparePhoto,
  selectPhoto,
  verify,
} from "./equipment-images";

export async function main(args = process.argv.slice(2)) {
  const [command, ...rest] = args;
  const human = rest.includes("--human");
  const positional = rest.filter((arg) => arg !== "--human");
  const network = command === "discover" || command === "prepare";
  if (network && (!human || !process.stdin.isTTY || !process.stdout.isTTY)) {
    throw new Error(
      "Rede exige --human e terminal interativo humano. O agente não deve executar este comando.",
    );
  }
  if (command === "discover" && positional.length === 1) {
    // The environment is read only after the explicit human/TTY gate. Never load .env.
    await discover(positional[0], process.env.PIXABAY_API_KEY ?? "");
  } else if (command === "select" && positional.length === 2 && /^\d+$/.test(positional[1])) {
    await selectPhoto(positional[0], Number(positional[1]));
  } else if (command === "prepare" && positional.length === 1) {
    await preparePhoto(positional[0]);
  } else if (command === "review-template" && !positional.length) {
    await createReviewTemplate();
  } else if (command === "finalize" && !positional.length) {
    await finalize();
  } else if (command === "verify" && !positional.length) {
    await verify();
  } else if (command === "help" || !command) {
    console.log(
      "Uso: tsx scripts/equipment-images-cli.ts discover TI-0001 --human | select TI-0001 ID | prepare TI-0001 --human | review-template | finalize | verify",
    );
    return;
  } else throw new Error("Comando/argumentos inválidos. Consulte help.");
  console.log(`Etapa ${command} concluída localmente em ${IMAGE_DIR}. Nenhum upload realizado.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    // API payloads, parser errors and nested network errors may carry credential-bearing URLs.
    console.error(
      "Pipeline não concluído. Verifique comando, --human/TTY, cache, seleção, arquivos e revisão. Nenhuma aprovação ou upload foi efetuado por este erro; nenhuma URL/credencial é exibida.",
    );
    process.exitCode = 1;
  });
}
