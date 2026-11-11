import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CHECK_IDS = ['tests', 'typecheck', 'build'];
export const STATUSES = ['ATENDIDO', 'REPROVADO', 'SEM TESTE', 'AMBÍGUO', 'OUTRO REPOSITÓRIO'];
export const sha256 = value => createHash('sha256').update(value).digest('hex');
const excludedDirs = new Set(['node_modules', '.git', '.local', '.work', '.next', '.turbo', 'coverage', 'test-results', 'playwright-report']);

export function excluded(relative) {
  const parts = relative.split('/');
  return parts.at(-1) === 'next-env.d.ts' || parts.at(-1).endsWith('.tsbuildinfo')
    || parts.some(part => excludedDirs.has(part) || (part.startsWith('.env') && part !== '.env.example') || /^(?:\.npmrc|\.netrc|\.ssh|\.aws|credentials.*|secrets?.*|.*\.(?:pem|key|p12|pfx))$/i.test(part))
    || relative === 'docs/verificacao' || relative.startsWith('docs/verificacao/');
}

export async function sourceFiles(root) {
  const files = [];
  async function walk(dir, prefix = '') {
    for (const entry of (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (excluded(relative)) continue;
      if (entry.isSymbolicLink()) throw new Error(`Symlink de fonte não permitido: ${relative}`);
      if (entry.isDirectory()) await walk(path.join(dir, entry.name), relative);
      else if (entry.isFile()) files.push(relative);
      else throw new Error(`Arquivo especial não permitido: ${relative}`);
    }
  }
  await walk(root);
  return files.sort();
}

export async function sourceDigest(root) {
  const files = await sourceFiles(root);
  const manifest = [];
  for (const file of files) manifest.push([file, sha256(await fs.readFile(path.join(root, file)))]);
  return { hash: sha256(JSON.stringify(manifest)), manifest };
}

export function criteriaFromSpec(text, specId) {
  const criteria = [...text.matchAll(/^\s*-\s*\*\*(CA-\d{2})\s*[—–:-]([^\n]*)/gm)].map(match => ({ id: `${specId}/${match[1]}`, text: match[0].trim() }));
  if (!criteria.length || new Set(criteria.map(ca => ca.id)).size !== criteria.length) throw new Error('Spec sem critérios únicos no formato CA-NN');
  return criteria;
}

export function cleanEnvironment(temp) {
  return { PATH: `${path.join(ROOT, '.work/runtime/node_modules/.bin')}:${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: path.join(temp, 'home'), TMPDIR: path.join(temp, 'tmp'), TERM: 'dumb', NODE_ENV: 'test', CI: '1', NEXT_TELEMETRY_DISABLED: '1' };
}

export function sandboxProfile({ temp, modules, node = process.execPath, esbuild }) {
  const q = value => JSON.stringify(value);
  // Allow only OS/runtime reads, the sanitized copy and installed packages. Never the user's HOME.
  return `(version 1)\n(deny default)\n(allow process-fork)\n(allow process-exec (literal ${q(node)})${esbuild ? ` (literal ${q(esbuild)})` : ''})\n(allow signal (target children))\n(allow signal (target self))\n(allow sysctl-read)\n(allow mach-lookup)\n(allow file-read-metadata)\n(allow file-read* (literal "/") (subpath "/opt/homebrew/etc/openssl@3"))\n(allow file-read*\n  (subpath ${q(temp)})\n  (subpath ${q(modules)})\n  (subpath "/System") (subpath "/usr/lib") (subpath "/usr/share")\n  (subpath "/Library/Apple") (subpath "/opt/homebrew/Cellar") (subpath "/opt/homebrew/opt")\n  (literal "/dev/null") (literal "/dev/urandom") (literal "/dev/random")\n  (literal "/private/etc/localtime") (literal "/private/etc/hosts")\n  (literal ${q(node)}))\n(allow file-write* (subpath ${q(temp)}))\n(deny network*)\n`;
}

export async function createSandbox(root) {
  if (process.platform !== 'darwin') throw new Error('Launcher exige macOS sandbox-exec; não há fallback sem isolamento');
  await fs.access('/usr/bin/sandbox-exec');
  const temp = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'emprestai-review-')));
  const copy = path.join(temp, 'project');
  await fs.mkdir(copy);
  for (const file of await sourceFiles(root)) {
    const dest = path.join(copy, file);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(path.join(root, file), dest);
  }
  const modules = await fs.realpath(path.join(root, 'node_modules'));
  // The link resolves to original packages, but sandbox permits NO writes there.
  await fs.symlink(modules, path.join(copy, 'node_modules'), 'dir');
  for (const dir of ['home', 'tmp']) await fs.mkdir(path.join(temp, dir));
  const node = await fs.realpath(process.execPath);
  const require = createRequire(path.join(modules, 'esbuild', 'lib', 'main.js'));
  const esbuild = await fs.realpath(require.resolve(`@esbuild/${process.platform}-${process.arch}/bin/esbuild`));
  if (!esbuild.startsWith(`${modules}${path.sep}`) || !(await fs.stat(esbuild)).isFile()) throw new Error('esbuild instalado precisa resolver dentro de node_modules');
  await fs.access(esbuild, fs.constants.X_OK);
  const profile = sandboxProfile({ temp, modules, node, esbuild });
  await fs.writeFile(path.join(temp, 'review.sb'), profile);
  return { temp, copy, modules, node, esbuild, profile, env: cleanEnvironment(temp) };
}

export function fixedCommand(id, box) {
  const cli = (...segments) => path.join(box.modules, ...segments);
  switch (id) {
    case 'tests': return [cli('vitest', 'vitest.mjs'), 'run', '--pool=threads', '--reporter=json', `--outputFile=${path.join(box.temp, 'tests.json')}`];
    case 'typecheck': return [cli('typescript', 'bin', 'tsc'), '--noEmit'];
    case 'build': return [cli('next', 'dist', 'bin', 'next'), 'build', '--webpack'];
    default: throw new Error('Comando fora da allowlist');
  }
}

export async function runCheck(id, box) {
  const args = fixedCommand(id, box);
  const startedAt = new Date().toISOString();
  const env = { ...box.env, NODE_ENV: id === 'build' ? 'production' : 'test' };
  return new Promise(resolve => {
    let stdout = '', stderr = '', settled = false, timedOut = false;
    const child = spawn('/usr/bin/sandbox-exec', ['-f', path.join(box.temp, 'review.sb'), box.node, ...args], { cwd: box.copy, env, shell: false, detached: true });
    // Output is bounded; a noisy/malicious test cannot exhaust the supervisor.
    const collect = (current, chunk) => (current + chunk.toString()).slice(-2_000_000);
    child.stdout.on('data', chunk => { stdout = collect(stdout, chunk); });
    child.stderr.on('data', chunk => { stderr = collect(stderr, chunk); });
    const timer = setTimeout(() => { timedOut = true; try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 600_000);
    const finish = (code, error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { process.kill(-child.pid, 'SIGKILL'); } catch {}
      if (error) stderr += error.message;
      const result = { id, command: [box.node, ...args], startedAt, finishedAt: new Date().toISOString(), status: code === 0 && !timedOut ? 'passed' : 'failed', exitCode: code, timedOut, stdoutHash: sha256(stdout), stderrHash: sha256(stderr) };
      result.hash = sha256(JSON.stringify(result));
      resolve({ ...result, stdout, stderr });
    };
    child.on('error', error => finish(null, error));
    child.on('close', code => finish(code));
  });
}

export function checksDigest(checks) {
  return sha256(JSON.stringify(checks.map(({ id, hash }) => ({ id, hash }))));
}

export function assertionResults(data, copy) {
  if (!data || !Array.isArray(data.testResults)) return [];
  return data.testResults.flatMap(suite => (suite.assertionResults ?? []).map(test => ({
    file: path.relative(copy, suite.name).split(path.sep).join('/'),
    name: test.fullName ?? test.title,
    status: test.status,
  })));
}

function exactKeys(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join('|') !== [...keys].sort().join('|')) throw new Error(`Schema inválido: ${label}`);
}

export function validateReview(review, report) {
  exactKeys(review, ['schemaVersion', 'spec', 'round', 'sourceHash', 'checksHash', 'reviewer', 'scope', 'criteria', 'outOfScope'], 'review');
  if (review.schemaVersion !== 1 || review.spec !== report.spec || review.round !== report.round || review.sourceHash !== report.sourceHash || review.checksHash !== report.checksHash) throw new Error('Revisão stale ou não corresponde à rodada/checks/fonte');
  exactKeys(review.reviewer, ['id', 'independent', 'kind'], 'reviewer');
  if (typeof review.reviewer.id !== 'string' || !review.reviewer.id.trim() || review.reviewer.independent !== true || !['human', 'subagent'].includes(review.reviewer.kind)) throw new Error('Revisão independente humana/subagent obrigatória');
  if (review.scope !== report.scope || !Array.isArray(review.outOfScope) || !review.outOfScope.every(item => typeof item === 'string') || !Array.isArray(review.criteria)) throw new Error('Escopo/revisão inválido');
  const expected = new Set(report.criteria.map(ca => ca.id));
  const seen = new Set();
  for (const ca of review.criteria) {
    exactKeys(ca, ['id', 'status', 'evidence', 'observation'], 'criterion');
    if (!expected.has(ca.id) || seen.has(ca.id) || !STATUSES.includes(ca.status) || typeof ca.observation !== 'string' || !Array.isArray(ca.evidence)) throw new Error('CA desconhecido, duplicado ou status inválido');
    seen.add(ca.id);
    for (const evidence of ca.evidence) {
      exactKeys(evidence, ['file', 'line', 'test', 'assertion'], 'evidence');
      if (!Number.isInteger(evidence.line) || evidence.line < 1 || typeof evidence.assertion !== 'string' || evidence.assertion.trim().length < 12 || typeof evidence.file !== 'string' || typeof evidence.test !== 'string') throw new Error('Evidência precisa de arquivo:linha, teste exato e afirmação revisada');
      if (!report.manifest.some(([file]) => file === evidence.file)) throw new Error('Evidência fora do manifesto de fonte');
      if (ca.status === 'ATENDIDO' && !report.assertions.some(test => test.file === evidence.file && test.name === evidence.test && test.status === 'passed')) throw new Error('ATENDIDO exige teste realmente executado e passado nesta rodada');
      const caNumber = ca.id.split('CA-')[1];
      if (ca.status === 'ATENDIDO' && !evidence.test.toLowerCase().includes(`test_ca_${caNumber}_`)) throw new Error('Teste não cita o CA');
    }
    if (ca.status === 'ATENDIDO' && (!ca.evidence.length || !ca.observation.trim())) throw new Error('ATENDIDO sem justificativa/evidência semântica');
  }
  if (seen.size !== expected.size) throw new Error('Revisão incompleta: CAs ausentes');
  return review;
}

export function reportProblems(report) {
  const problems = [];
  if (!/^v22\./.test(report.runtime?.node ?? '')) problems.push('Runtime Node22 exigido pelo projeto não comprovado');
  if (report.schemaVersion !== 1 || !Array.isArray(report.criteria) || !report.criteria.length) problems.push('Relatório inválido/incompleto');
  if (!Array.isArray(report.checks) || report.checks.map(check => check.id).join(',') !== CHECK_IDS.join(',') || report.checks.some(check => check.status !== 'passed' || check.exitCode !== 0)) problems.push('Tests/typecheck/build incompletos ou falharam');
  if (report.checksHash !== checksDigest(report.checks ?? [])) problems.push('Digest de checks inválido');
  if (report.sourceHash !== report.sourceHashAfter) problems.push('Fonte mudou durante execução');
  if (report.snapshotHash !== report.sourceHash) problems.push('Cópia não corresponde à fonte');
  if (report.git?.status !== 'passed') problems.push('Git/status/escopo não verificados');
  if (!report.review) problems.push('Revisão independente ausente');
  else {
    try { validateReview(report.review, report); } catch (error) { problems.push(error.message); }
    if (report.review.criteria.some(ca => ca.status !== 'ATENDIDO')) problems.push('Há CA não atendido');
    if (report.review.outOfScope.length) problems.push('Achados fora de escopo');
  }
  return problems;
}

export function markdownReport(report) {
  const rows = report.criteria.map(ca => {
    const reviewed = report.review?.criteria.find(item => item.id === ca.id);
    const escape = text => String(text).replaceAll('|', '\\|').replaceAll('\n', ' ');
    return `| ${ca.id} | ${reviewed?.status ?? 'SEM TESTE'} | ${escape(reviewed?.evidence.map(e => `${e.file}:${e.line} — ${e.assertion}`).join('; ') ?? 'Inventário não é evidência')} | ${escape(reviewed?.observation ?? 'Revisão independente pendente')} |`;
  });
  return `# Verificação ${report.spec} — ${report.round}\n\nFonte: \`${report.sourceHash}\`\nChecks: \`${report.checksHash}\`\nEscopo: ${report.scope}\n\n| CA | Status | Evidência | Observação |\n|---|---|---|---|\n${rows.join('\n')}\n\n${report.checks.map(c => `- ${c.id}: ${c.status} (exit ${c.exitCode})`).join('\n')}\n\nVeredito local: **${report.localVerdict}**\nProdução: **NÃO PRONTA** — exige evidências humanas separadas.\n\n${report.problems.map(p => `- ${p}`).join('\n')}\n\nNão houve execução remota, migration, commit, push, tag ou invocação automática de IA.\n`;
}

export function parseArgs(argv, allowed) {
  const result = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    if (!argv[i]?.startsWith('--') || !allowed.includes(key) || !argv[i + 1] || argv[i + 1].startsWith('--') || key in result) throw new Error('Argumentos inválidos');
    result[key] = argv[i + 1];
  }
  return result;
}

export async function verify(argv = process.argv.slice(2), root = ROOT) {
  const args = parseArgs(argv, ['spec', 'round', 'review', 'scope']);
  if (!args.spec || !args.round || !/^[a-zA-Z0-9_-]{1,64}$/.test(args.round)) throw new Error('Uso: --spec docs/specs/NNN-nome/spec.md --round ID [--scope descrição] [--review arquivo.json]');
  const relative = path.relative(root, path.resolve(root, args.spec)).split(path.sep).join('/');
  const match = relative.match(/^docs\/specs\/(\d{3})-[^/]+\/spec\.md$/);
  if (!match) throw new Error('Spec precisa estar em docs/specs/NNN-nome/spec.md');
  const digest = await sourceDigest(root);
  const criteria = criteriaFromSpec(await fs.readFile(path.join(root, relative), 'utf8'), match[1]);
  const output = path.join(root, 'docs', 'verificacao', 'harness', match[1], args.round);
  await fs.mkdir(output, { recursive: true });
  const reportPath = path.join(output, 'report.json');
  let report;
  if (args.review) {
    report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    if (report.sourceHash !== digest.hash) throw new Error('Fonte stale: execute nova rodada antes de revisar');
    report.review = validateReview(JSON.parse(await fs.readFile(path.resolve(root, args.review), 'utf8')), report);
  } else {
    try { await fs.access(reportPath); throw new Error('Rodada já existe; use outra ID ou --review'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    report = { schemaVersion: 1, runtime: { node: process.version, platform: process.platform }, spec: relative, specId: match[1], round: args.round, scope: args.scope ?? 'tudo que implementa esta spec (manifesto completo)', sourceHash: digest.hash, manifest: digest.manifest, sourceHashAfter: null, snapshotHash: null, criteria, inventory: [], assertions: [], checks: [], checksHash: null, git: { status: 'blocked', reason: 'Status Git não comprovado; não executar Git no original pelo launcher de revisão' }, review: null };
    for (const [file] of digest.manifest.filter(([file]) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(file))) {
      const text = await fs.readFile(path.join(root, file), 'utf8');
      report.inventory.push({ file, candidates: criteria.filter(ca => text.toLowerCase().includes(`test_ca_${ca.id.split('CA-')[1]}_`)).map(ca => ca.id) });
    }
    let box;
    try {
      box = await createSandbox(root);
      report.snapshotHash = (await sourceDigest(box.copy)).hash;
      await fs.writeFile(path.join(output, 'sandbox.sb'), box.profile);
      for (const id of CHECK_IDS) {
        const { stdout, stderr, ...check } = await runCheck(id, box);
        await fs.writeFile(path.join(output, `${id}.stdout.log`), stdout);
        await fs.writeFile(path.join(output, `${id}.stderr.log`), stderr);
        report.checks.push(check);
      }
      try {
        const raw = await fs.readFile(path.join(box.temp, 'tests.json'), 'utf8');
        await fs.writeFile(path.join(output, 'tests.json'), raw);
        report.assertions = assertionResults(JSON.parse(raw), box.copy);
      } catch { /* Missing/malformed results never grant CA approval. */ }
    } catch (error) { report.launcherError = error.message; }
    report.sourceHashAfter = (await sourceDigest(root)).hash;
    report.checksHash = checksDigest(report.checks);
    // Preserve temporary artifacts for review; no deletion of project/user data.
    report.sandboxTemp = box?.temp ?? null;
  }
  report.problems = reportProblems(report);
  if (report.launcherError) report.problems.push(report.launcherError);
  report.localVerdict = report.problems.length ? 'NÃO PRONTA' : 'PRONTA LOCAL';
  report.productionVerdict = 'NÃO PRONTA';
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(output, 'report.md'), markdownReport(report));
  console.log(`${report.localVerdict}: ${path.relative(root, reportPath)}`);
  return report.problems.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verify().then(code => { process.exitCode = code; }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
