import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Harness, git } from './engine.mjs';

export function fixture(t, { partial = false, review = 'Off' } = {}) {
  const tempBase = process.platform === 'win32' ? path.join(os.tmpdir(), 'kilo') : os.tmpdir();
  const temp = fs.mkdtempSync(path.join(tempBase, 'workflow-integration-'));
  t.after(() => fs.rmSync(temp, { force: true, recursive: true }));
  const root = path.join(temp, 'workspace');
  fs.mkdirSync(root);
  const project = 'Blender/Test Project', scene = `${project}/scene.blend`, goal = 'Documents/Goals/01-test.md';
  const write = (name, text) => {
    const full = path.join(root, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
    return full;
  };
  const objectiveText = '# Test Goal\n' + 'Confirmed fixture requirements and observable acceptance checks. '.repeat(4);
  write(`${project}/README.md`, [
    '# Fixture project',
    'Status: Confirmed',
    'Last updated: 2026-10-31',
    '',
    ...['Purpose', 'What this project is', 'Requirements', 'Visual direction', 'Deliverables', 'Project structure', 'Blender', 'Workflow', 'External assets', 'Goals', 'References', 'Open questions', 'Next steps'].flatMap((name) => [`## ${name}`, `Fixture ${name.toLowerCase()}.`, '']),
  ].join('\n'));
  write(`${project}/Documents/REQUIREMENTS.md`, [
    '# Requirements',
    'Status: Confirmed',
    'Defined: 2026-10-31',
    'Last updated: 2026-10-31',
    'Confirmed: 2026-10-31',
    'Confirmation: Confirm fixture requirements.',
    '',
    ...['Core value', 'Confirmed requirements', 'Constraints', 'Deferred', 'Out of scope', 'Open questions', 'Research notes', 'Change log'].flatMap((name) => [`## ${name}`, `Fixture ${name.toLowerCase()}.`, '']),
  ].join('\n'));
  write(`${project}/Documents/WORKFLOW.md`, [
    '# Workflow',
    `Mode: ${partial ? 'Partially' : 'Fully'} Autonomous`,
    'Selected: 2026-10-31',
    'Last changed: 2026-10-31',
    '',
    ...['Current mode', 'Rules', 'Change log'].flatMap((name) => [`## ${name}`, `Fixture ${name.toLowerCase()}.`, '']),
  ].join('\n'));
  write(`${project}/Documents/REVIEW.md`, [
    '# Review Mode',
    `Mode: ${review}`,
    'Selected: 2026-10-31',
    'Last changed: 2026-10-31',
    'Single grader: visual',
    '',
    ...['Modes', 'Change log'].flatMap((name) => [`## ${name}`, `Fixture ${name.toLowerCase()}.`, '']),
  ].join('\n'));
  write(`${project}/Documents/ASSETS.md`, '# No external assets\n\n## Rules\n\nFixture asset rules.\n');
  write(`${project}/Documents/DECISIONS.md`, '# Fixture decisions\n');
  write(`${project}/Documents/TASKS.md`, '# Task Ledger\n\nStatus: Active\nLast updated: 2026-10-31\n\n## Tasks\n\n| Task | Change | Operation | Objects | Ticket | Worker | State | Created | Finished | Result |\n|---|---|---|---|---|---|---|---|---|---|\n| — | — | — | — | — | — | — | — | — | — |\n');
  const goalBody = objectiveText.replace(/^#\s+.*\r?\n/, '');
  const objective = [
    '# Goal: Fixture',
    ...['Mission', 'Project', 'Visual outcome', 'Scope', 'Deliverables', 'Acceptance', 'Workflow', 'Done'].flatMap((name) => [`## ${name}`, goalBody, '']),
  ].join('\n');
  write(`${project}/${goal}`, objective);
  write(scene, 'fixture blend bytes\n');
  write(`${project}/Documents/Reviews/README.md`, '# Review Index\n\n## Index\n\nFixture index.\n\n## Rules\n\nFixture rules.\n');
  write('.gitignore', '**/_evidence/**\n/config.json\n');
  if (review !== 'Off') write('config.json', JSON.stringify({ blender_subagents: { graders: {
    enabled: true, agent: 'blender-grader', max_parallel: 1, max_rounds: 2,
    graders: [{ name: 'visual', focus: 'composition', provider: 'test', model: 'test-model', variant: 'test-variant', max_steps: 12, max_minutes: 5 }],
  } } }));
  git(root, ['init', '--quiet']);
  git(root, ['add', '--', '.']);
  const commit = (message = 'test: fixture checkpoint') => git(root, ['-c', 'user.name=Harness Test', '-c', 'user.email=harness-test@example.invalid', 'commit', '--quiet', '-m', message]);
  commit('test: fixture scaffold');
  const harness = new Harness(root, { stateRoot: path.join(temp, 'state') });
  const session = 'ses_orchestrator';
  const questionArgs = (question, labels) => ({ questions: [{ question, custom: false, multiple: false, options: labels.map((label) => ({ label, description: label })) }] });
  const registration = harness.prepare(session, { project, scene: 'scene.blend', goal });
  harness.question(session, questionArgs(registration.question, registration.labels), [['Confirm registration']]);
  const begin = () => {
    harness.command(session, 'goal-active', { objective });
    return harness.command(session, 'begin', { outcome: 'Create fixture composition', objects: ['Cube'], paths: ['notes.txt', 'Documents/DECISIONS.md'] });
  };
  return { root, project, scene, goal, objective, write, commit, harness, session, questionArgs, begin };
}
