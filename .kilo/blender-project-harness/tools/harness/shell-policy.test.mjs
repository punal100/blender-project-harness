import assert from 'node:assert/strict';
import test from 'node:test';
import { projectPathInCommand, shellPolicy, unsafeBlenderShell } from './shell-policy.mjs';

test('read-only shell families run without approval', () => {
  for (const command of [
    'git status --short --branch',
    'git log --oneline -8',
    'git ls-tree -r --name-only HEAD',
    'git show HEAD; echo done',
    'git status --short; echo bypass',
    'git diff --stat | Select-String plugin',
    'Get-ChildItem .kilo/blender-project-harness/tools/harness',
    'Get-Content .kilo/blender-project-harness/tools/harness/plugin.mjs | Select-String safe',
    'Select-String -Path .kilo/blender-project-harness/tools/harness/plugin.mjs -Pattern safe',
    'Get-ChildItem .kilo/blender-project-harness/tools/harness | Where-Object { $_.Name -like "*.mjs" }',
    'rg -n "safeShellSegment" .kilo/blender-project-harness/tools/harness',
    'find . -name "*.mjs"',
    'Start-Sleep -Seconds 1',
    'cat README.md',
    'node --version',
    'node .kilo/blender-project-harness/tools/harness/cli.mjs doctor',
    'node .kilo/blender-project-harness/tools/harness/cli.mjs development on',
    'node .kilo/blender-project-harness/tools/harness/cli.mjs development off',
    'node --test .kilo/blender-project-harness/tools/harness/plugin.test.mjs',
    'python -m pytest .kilo/blender-project-harness/tools/test_blender_tools.py',
  ]) {
    assert.ok(['read-only', 'trusted'].includes(shellPolicy(command).kind), command);
  }
});

test('non-read-only workspace commands require reasoned confirmation', () => {
  for (const command of [
    'python -c "print(1)"',
    'node -e "process.exit(1)"',
    'Set-Content notes.txt "changed"',
    'git switch main',
    'git stash push',
    'git commit -m "docs: change"',
    'git diff --output=scene.blend',
    'npm install',
    'Invoke-WebRequest https://example.invalid',
  ]) {
    assert.equal(shellPolicy(command).kind, 'confirm', command);
  }
});

test('Blender launches and command substitution stay blocked', () => {
  for (const command of [
    'blender.exe --background',
    '& "C:\\Program Files\\Blender Foundation\\Blender\\blender.exe" --background',
    'cmd /c blender.exe --background',
    'echo $(Get-Content file.txt)',
    'echo `whoami`',
    'cmd /c whoami',
    'Invoke-Expression "whoami"',
  ]) {
    assert.equal(shellPolicy(command).kind, 'deny', command);
  }
  assert.equal(unsafeBlenderShell('blender.exe --version'), false);
});

test('project path detection ignores commit messages and finds real paths', () => {
  assert.equal(projectPathInCommand('git commit -m "docs: Blender harness notes"'), false);
  assert.equal(projectPathInCommand('git add -- "Blender/Test Project/README.md"'), true);
  assert.equal(projectPathInCommand('Set-Content "Blender\\Test Project\\README.md" "x"'), true);
  assert.equal(projectPathInCommand('git log -- Blender/Test Project/README.md'), true);
});
