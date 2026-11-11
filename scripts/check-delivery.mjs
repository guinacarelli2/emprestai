import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, CHECK_IDS, sha256, sourceDigest, reportProblems, assertionResults, parseArgs } from './verify-spec.mjs';

export async function validateArtifacts(report, directory) {
  const errors = [];
  for (const id of CHECK_IDS) {
    const check = report.checks?.find(item => item.id === id);
    if (!check) { errors.push(`${id}: check ausente`); continue; }
    try {
      const stdout = await fs.readFile(path.join(directory, `${id}.stdout.log`));
      const stderr = await fs.readFile(path.join(directory, `${id}.stderr.log`));
      const { hash, ...body } = check;
      if (sha256(stdout) !== check.stdoutHash || sha256(stderr) !== check.stderrHash || sha256(JSON.stringify(body)) !== hash) errors.push(`${id}: hash/log alterado`);
    } catch { errors.push(`${id}: logs ausentes`); }
  }
  try {
    const data = JSON.parse(await fs.readFile(path.join(directory, 'tests.json'), 'utf8'));
    const assertions = assertionResults(data, path.join(report.sandboxTemp, 'project'));
    if (!assertions.length || JSON.stringify(assertions) !== JSON.stringify(report.assertions)) errors.push('Resultados reais do runner ausentes/alterados');
    if (data.success !== true || data.numFailedTests !== 0 || data.numPassedTests < 1) errors.push('Runner não comprovou suíte verde');
  } catch { errors.push('Resultado JSON do runner ausente/inválido'); }
  return errors;
}

export async function checkDelivery(argv = process.argv.slice(2), root = ROOT) {
  const args = parseArgs(argv, ['reports']);
  if (!args.reports) throw new Error('Uso: node scripts/check-delivery.mjs --reports arquivo002.json,arquivo003.json,arquivo004.json,arquivo005.json');
  const current = await sourceDigest(root);
  const errors = [];
  const seen = new Set();
  for (const name of args.reports.split(',')) {
    try {
      const filename = path.resolve(root, name);
      const report = JSON.parse(await fs.readFile(filename, 'utf8'));
      if (!['002', '003', '004', '005'].includes(report.specId) || seen.has(report.specId)) throw new Error('Spec inesperada/duplicada');
      seen.add(report.specId);
      if (report.sourceHash !== current.hash || JSON.stringify(report.manifest) !== JSON.stringify(current.manifest)) errors.push(`${report.specId}: hash/manifesto stale`);
      // Recompute actual CA inventory rather than trusting the submitted report's list.
      const { criteriaFromSpec } = await import('./verify-spec.mjs');
      if (!/^docs\/specs\/00[2-5]-[^/]+\/spec\.md$/.test(report.spec) || !report.spec.includes(`/${report.specId}-`)) throw new Error('Caminho de spec inválido');
      const criteria = criteriaFromSpec(await fs.readFile(path.join(root, report.spec), 'utf8'), report.specId);
      if (JSON.stringify(criteria) !== JSON.stringify(report.criteria)) errors.push(`${report.specId}: critérios do relatório divergem da spec`);
      errors.push(...reportProblems(report).map(error => `${report.specId}: ${error}`));
      errors.push(...(await validateArtifacts(report, path.dirname(filename))).map(error => `${report.specId}: ${error}`));
    } catch (error) { errors.push(`${name}: ${error.message}`); }
  }
  for (const id of ['002', '003', '004', '005']) if (!seen.has(id)) errors.push(`${id}: relatório obrigatório ausente`);
  // This launcher deliberately has no authority to accept deployment/credentials/academic approval.
  errors.push('Produção: evidências humanas de Auth/professor/fotos/migrations/deploy e credenciais provisionadas pendentes de validação externa');
  errors.push('Prática: dois commits reais e tag pendentes; hashes de fixtures não substituem commits; execução atual não autoriza commit/tag');
  const result = { schemaVersion: 1, sourceHash: current.hash, verdict: 'NÃO PRONTA', problems: errors };
  console.log(JSON.stringify(result, null, 2));
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkDelivery().then(code => { process.exitCode = code; }).catch(error => { console.error(`NÃO PRONTA: ${error.message}`); process.exitCode = 1; });
}
