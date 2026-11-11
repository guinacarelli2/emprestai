// @vitest-environment node
import { expect, test } from "vitest";
import { humanConfirmation } from "../human-production";

test("test_ca_07_spec002_remote_actions_require_interactive_human_terminal", async () => {
  await expect(humanConfirmation("seed")).rejects.toThrow("terminal humano interativo");
  await expect(humanConfirmation("images")).rejects.toThrow("terminal humano interativo");
  await expect(humanConfirmation("migrate")).rejects.toThrow("terminal humano interativo");
  await expect(humanConfirmation("runtime-password")).rejects.toThrow("terminal humano interativo");
  await expect(humanConfirmation("unknown")).rejects.toThrow("terminal humano interativo");
});
