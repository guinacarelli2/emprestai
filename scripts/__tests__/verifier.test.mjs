import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { criteriaFromSpec, excluded, sourceDigest, sourceFiles, cleanEnvironment, sandboxProfile, createSandbox, fixedCommand, runCheck, validateReview, checksDigest, reportProblems, sha256 } from '../verify-spec.mjs';
import { validateArtifacts } from '../check-delivery.mjs';

const tempDir = () => fs.mkdtemp(path.join(os.tmpdir(), 'emprestai-verifier-selftest-'));
const criteria = [{ id: '004/CA-10', text: 'launcher' }];
function reportFixture() {
  const checks = ['tests', 'typecheck', 'build'].map(id => ({ id, hash: sha256(id), status: 'passed', exitCode: 0 }));
  return { schemaVersion: 1, runtime: { node: 'v22.0.0', platform: 'darwin' }, spec: 'docs/specs/004-auth-persistencia/spec.md', round: 'selftest', scope: 'fixture', sourceHash: 'fresh', sourceHashAfter: 'fresh', snapshotHash: 'fresh', manifest: [['src/fixture.test.ts', 'abc']], criteria, checks, checksHash: checksDigest(checks), assertions: [{ file: 'src/fixture.test.ts', name: 'test_ca_10_blocks_original_write', status: 'passed' }], git: { status: 'passed' }, review: null };
}
function reviewFixture(report) {
  return { schemaVersion: 1, spec: report.spec, round: report.round, sourceHash: report.sourceHash, checksHash: report.checksHash, scope: report.scope, reviewer: { id: 'self-test-reviewer-not-real-approval', independent: true, kind: 'human' }, outOfScope: [], criteria: [{ id: '004/CA-10', status: 'ATENDIDO', evidence: [{ file: 'src/fixture.test.ts', line: 1, test: 'test_ca_10_blocks_original_write', assertion: 'Afirma a rejeição de escrita no projeto original.' }], observation: 'Revisão simulada exclusiva do teste de schema.' }] };
}

test('test_ca_10_strips_credentials_and_environment', async () => {
  for (const file of ['.env', '.env.local', '.env.production', '.git/config', '.work/token', '.local/auth', '.npmrc', 'x/secret.json', 'x/server.key', 'docs/verificacao/x.json']) assert.equal(excluded(file), true, file);
  assert.equal(excluded('.env.example'), false);
  const env = cleanEnvironment('/private/tmp/test');
  assert.deepEqual(Object.keys(env).sort(), ['CI', 'HOME', 'NEXT_TELEMETRY_DISABLED', 'NODE_ENV', 'PATH', 'TERM', 'TMPDIR'].sort());
  assert.equal(env.HOME, '/private/tmp/test/home');
  assert.equal(env.DATABASE_URL, undefined);
  assert.equal(env.NEXT_TELEMETRY_DISABLED, '1');
  assert.match(env.PATH.split(':')[0], /\.work\/runtime\/node_modules\/\.bin$/);
});

test('test_ca_10_digest_excludes_evidence_but_tracks_source_specs_schema', async () => {
  const root = await tempDir();
  for (const directory of ['src', 'prisma/migrations', 'docs/specs', 'docs/verificacao']) await fs.mkdir(path.join(root, directory), { recursive: true });
  await fs.writeFile(path.join(root, 'src/test.ts'), 'original');
  const first = await sourceDigest(root);
  await fs.writeFile(path.join(root, '.env.local'), 'SECRET=not copied');
  await fs.writeFile(path.join(root, 'docs/verificacao/report.json'), '{}');
  for (const file of ['next-env.d.ts', 'tsconfig.tsbuildinfo', 'src/cache.tsbuildinfo']) {
    assert.equal(excluded(file), true, file);
    await fs.writeFile(path.join(root, file), 'generated');
  }
  assert.equal(excluded('src/env.d.ts'), false);
  assert.equal(excluded('src/next-env.ts'), false);
  assert.equal(excluded('tsconfig.json'), false);
  assert.equal((await sourceDigest(root)).hash, first.hash);
  assert.deepEqual(await sourceFiles(root), ['src/test.ts']);
  const packageCopy = await tempDir();
  for (const file of await sourceFiles(root)) {
    await fs.mkdir(path.dirname(path.join(packageCopy, file)), { recursive: true });
    await fs.copyFile(path.join(root, file), path.join(packageCopy, file));
  }
  assert.equal((await sourceDigest(packageCopy)).hash, first.hash);
  await fs.writeFile(path.join(root, 'next-env.d.ts'), 'regenerated');
  assert.equal((await sourceDigest(root)).hash, first.hash);
  await fs.writeFile(path.join(root, 'prisma/migrations/test.sql'), 'migration');
  assert.notEqual((await sourceDigest(root)).hash, first.hash);
  await fs.symlink('/private/etc/hosts', path.join(root, 'external'));
  await assert.rejects(sourceFiles(root), /Symlink/);
});

test('test_ca_10_profile_deny_network_write_original_and_fixed_commands', () => {
  const profile = sandboxProfile({ temp: '/private/tmp/copy', modules: '/project/node_modules', node: '/node', esbuild: '/project/node_modules/@esbuild/darwin-arm64/bin/esbuild' });
  assert.match(profile, /\(deny default\)/);
  assert.match(profile, /\(deny network\*\)/);
  assert.match(profile, /\(allow file-write\* \(subpath "\/private\/tmp\/copy"\)\)/);
  assert.doesNotMatch(profile, /allow file-write.*node_modules/);
  assert.deepEqual(fixedCommand('build', { modules: '/project/node_modules' }), ['/project/node_modules/next/dist/bin/next', 'build', '--webpack']);
  assert.match(profile, /\(allow signal \(target children\)\)/);
  assert.match(profile, /\(allow signal \(target self\)\)/);
  assert.doesNotMatch(profile, /\(allow signal\)/);
  assert.match(profile, /\(allow process-exec \(literal "\/node"\) \(literal "\/project\/node_modules\/@esbuild\/darwin-arm64\/bin\/esbuild"\)\)/);
  assert.throws(() => fixedCommand('bash', {}), /allowlist/);
  assert.throws(() => fixedCommand('migrate', {}), /allowlist/);
});

test('test_ca_10_no_false_pass_from_test_names', () => {
  const report = reportFixture();
  report.inventory = [{ candidates: ['004/CA-10'], file: 'src/fixture.test.ts' }];
  assert.ok(reportProblems(report).includes('Revisão independente ausente'));
  const review = reviewFixture(report);
  report.assertions = [];
  assert.throws(() => validateReview(review, report), /realmente executado/);
});

test('test_ca_10_review_rejects_unknown_missing_stale_and_fake_assertions', () => {
  const report = reportFixture();
  const valid = reviewFixture(report);
  assert.equal(validateReview(valid, report), valid);
  for (const mutate of [r => { r.sourceHash = 'old'; }, r => { r.checksHash = 'old'; }, r => { r.round = 'other'; }, r => { r.criteria[0].id = '004/CA-99'; }, r => { r.criteria = []; }, r => { r.criteria[0].evidence = []; }, r => { r.criteria[0].evidence[0].assertion = 'exists'; }, r => { r.criteria[0].evidence[0].file = '../outside'; }, r => { r.reviewer.independent = false; }, r => { r.extra = true; }]) {
    const review = structuredClone(valid);
    mutate(review);
    assert.throws(() => validateReview(review, report));
  }
  report.review = valid;
  assert.deepEqual(reportProblems(report), []);
  report.sourceHashAfter = 'changed';
  report.git.status = 'blocked';
  assert.ok(reportProblems(report).includes('Fonte mudou durante execução'));
  assert.ok(reportProblems(report).includes('Git/status/escopo não verificados'));
  report.checks.pop();
  assert.ok(reportProblems(report).some(error => error.includes('incompletos')));
});

test('test_ca_10_criteria_inventory_requires_unique_scoped_ids', () => {
  const text = '- **CA-01 — primeiro.** prova\n- **CA-02 — segundo.** prova';
  assert.deepEqual(criteriaFromSpec(text, '002').map(ca => ca.id), ['002/CA-01', '002/CA-02']);
  assert.throws(() => criteriaFromSpec('', '002'));
  assert.throws(() => criteriaFromSpec(`${text}\n${text}`, '002'));
});

test('test_ca_10_delivery_refuses_missing_artifacts', async () => {
  const errors = await validateArtifacts(reportFixture(), await tempDir());
  assert.ok(errors.length >= 4);
  assert.ok(errors.some(error => error.includes('JSON')));
});

// A controlled Node CLI and the installed esbuild prove execution boundaries.
// It proves OS enforcement rather than claiming a prompt can restrict an agent's tools.
test('test_ca_10_real_macos_sandbox_enforces_boundaries_and_red_green_hashes', { skip: process.platform !== 'darwin' }, async () => {
  const root = await tempDir();
  await fs.mkdir(path.join(root, 'node_modules/vitest'), { recursive: true });
  await fs.mkdir(path.join(root, 'src'));
  const require = createRequire(import.meta.url);
  const binary = require.resolve(`@esbuild/${process.platform}-${process.arch}/bin/esbuild`);
  const installed = path.join(root, 'node_modules', `@esbuild/${process.platform}-${process.arch}/bin/esbuild`);
  await fs.mkdir(path.dirname(installed), { recursive: true });
  await fs.copyFile(binary, installed);
  const external = spawn(process.execPath, ['-e', "process.on('SIGUSR1',()=>console.log('unexpected signal')); console.log('ready'); setInterval(()=>{},1000);"], { stdio: ['ignore', 'pipe', 'pipe'] });
  await once(external.stdout, 'data');
  let externalOutput = '';
  external.stdout.on('data', chunk => { externalOutput += chunk; });
  try {
    await fs.writeFile(path.join(root, '.env.local'), 'SECRET=must-not-copy');
    await fs.writeFile(path.join(root, 'src/original.txt'), 'untouched');
    await fs.writeFile(path.join(root, 'node_modules/immutable.txt'), 'immutable');
    const outside = path.join(await tempDir(), 'private.txt');
    await fs.writeFile(outside, 'private');
    const fixtureSource = `import assert from 'node:assert/strict';\nassert.equal(false, true, 'intentional CA-10 planted error');\n`;
    await fs.writeFile(path.join(root, 'src/fixture.test.mjs'), fixtureSource);
    const cli = `import { promises as fs } from 'node:fs';\nimport net from 'node:net';\nimport { spawn } from 'node:child_process';\nimport { once } from 'node:events';\nimport assert from 'node:assert/strict';\nawait assert.rejects(fs.writeFile(${JSON.stringify(path.join(root, 'src/original.txt'))}, 'damage'));\nawait assert.rejects(fs.writeFile(${JSON.stringify(path.join(root, 'node_modules/immutable.txt'))}, 'damage'));\nawait assert.rejects(fs.readFile(${JSON.stringify(outside)}));\nawait assert.rejects(fs.readFile(${JSON.stringify(path.join(root, 'src/original.txt'))}));\nawait assert.rejects(fs.readFile(${JSON.stringify(path.join(root, '.env.local'))}));\nawait assert.rejects(fs.readFile('.env.local'));\nassert.equal(process.env.SECRET, undefined);\nassert.equal(process.env.NEXT_TELEMETRY_DISABLED, '1');\nassert.throws(()=>process.kill(${process.pid},0),{code:'EPERM'});\nassert.throws(()=>process.kill(${external.pid},0),{code:'EPERM'});\nassert.throws(()=>process.kill(${external.pid},'SIGUSR1'),{code:'EPERM'});\nprocess.kill(process.pid,0);\nfor(const tool of ['/bin/sh','/usr/bin/true','/usr/bin/curl']){ let child; try{child=spawn(tool,tool==='/bin/sh'?['-c','exit 0']:[]);}catch(error){assert.equal(error.code,'EPERM',tool);continue;} const [error]=await once(child,'error'); assert.equal(error.code,'EPERM',tool); }\nconst esbuild=spawn(${JSON.stringify(installed)},['--version']); const [esbuildCode]=await once(esbuild,'close'); assert.equal(esbuildCode,0);\nconst child=spawn(process.execPath,['-e','setInterval(()=>{},1000)']); await once(child,'spawn'); const closed=once(child,'close'); assert.equal(child.kill('SIGTERM'),true); await closed;\nawait fs.writeFile('allowed-temp.txt', 'ok');\nawait new Promise((resolve,reject)=>{ const server=net.createServer(); server.once('error',resolve); server.listen(0,'127.0.0.1',()=>{server.close();reject(new Error('network allowed'));}); });\nawait new Promise((resolve,reject)=>{const socket=net.connect(9,'127.0.0.1');socket.once('error',error=>{try{assert.equal(error.code,'EPERM');resolve();}catch(e){reject(e);}});socket.once('connect',()=>{socket.destroy();reject(new Error('loopback connection allowed'));});});\nawait import(process.cwd()+'/src/fixture.test.mjs');\nconsole.log('sandbox boundaries enforced');\n`;
    await fs.writeFile(path.join(root, 'node_modules/vitest/vitest.mjs'), cli);
    const redHash = (await sourceDigest(root)).hash;
    const redBox = await createSandbox(root);
    assert.equal((await sourceDigest(redBox.copy)).hash, redHash);
    const red = await runCheck('tests', redBox);
    assert.equal(red.status, 'failed', red.stderr);
    assert.match(red.stderr, /intentional CA-10 planted error/);
    await fs.writeFile(path.join(root, 'src/fixture.test.mjs'), fixtureSource.replace('false, true', 'true, true'));
    const greenHash = (await sourceDigest(root)).hash;
    assert.notEqual(redHash, greenHash);
    const greenBox = await createSandbox(root);
    const green = await runCheck('tests', greenBox);
    assert.equal(green.status, 'passed', green.stderr);
    assert.match(green.stdout, /boundaries enforced/);
    assert.equal(await fs.readFile(path.join(root, 'src/original.txt'), 'utf8'), 'untouched');
    assert.equal(await fs.readFile(path.join(root, 'node_modules/immutable.txt'), 'utf8'), 'immutable');
    assert.equal(externalOutput, '', 'sandbox must not signal the external helper');
    console.log(JSON.stringify({ fixtureOnly: true, redHash, greenHash, redExitCode: red.exitCode, greenExitCode: green.exitCode, redCheckHash: red.hash, greenCheckHash: green.hash }));
  } finally {
    external.kill('SIGTERM');
    await once(external, 'close');
  }
});
