const BLENDER_SHELL = /^\s*(?:&\s*)?(?:(?:start-process|cmd(?:\.exe)?\s+\/c|python(?:\.exe)?)\s+(?:-filepath\s+)?)?["']?(?:[^"'\r\n]*[\\/])?(?:blender(?:-launcher)?(?:\.exe)?|start-blender(?:-log)?\.(?:cmd|ps1)|start_blender_mcp\.py|new-blender-project\.(?:cmd|ps1))(?=["'\s]|$)/i;
const BLENDER_VERSION = /^\s*(?:&\s*)?["']?(?:[^"'\r\n]*[\\/])?blender(?:\.exe)?["']?\s+--version\s*$/i;

const POWERSHELL_READ_ONLY = new Set([
  'get-childitem', 'get-content', 'get-item', 'get-itemproperty', 'get-filehash', 'get-location',
  'get-date', 'get-command', 'get-help', 'get-member', 'get-module', 'get-process', 'get-service',
  'get-variable', 'test-path', 'resolve-path', 'split-path', 'join-path', 'select-string',
  'select-object', 'where-object', 'sort-object', 'measure-object', 'group-object', 'compare-object',
  'format-table', 'format-list', 'out-string', 'write-output', 'write-host', 'echo', 'start-sleep',
  'select', 'where', 'sort', 'measure', 'group', 'compare', 'ft', 'fl', 'sls', 'dir', 'ls', 'cat',
  'type', 'pwd',
]);
const UNIX_READ_ONLY = new Set([
  'ls', 'dir', 'cat', 'type', 'head', 'tail', 'wc', 'pwd', 'grep', 'egrep', 'fgrep', 'rg',
  'findstr', 'where', 'which', 'basename', 'dirname', 'realpath', 'stat', 'file', 'du', 'df',
  'whoami', 'hostname', 'printenv', 'uname', 'date', 'sort', 'uniq', 'cut', 'tr', 'jq', 'printenv',
]);
const GIT_READ_ONLY = new Set([
  'status', 'diff', 'log', 'show', 'rev-parse', 'rev-list', 'cat-file', 'ls-files', 'ls-tree',
  'grep', 'show-ref', 'describe', 'merge-base', 'name-rev', 'blame', 'whatchanged', 'shortlog',
  'for-each-ref', 'check-ignore', 'check-attr', 'count-objects', 'fsck', 'help', 'version', 'hash-object',
]);
const GIT_UNSAFE_FLAGS = new Set([
  '--output', '--open-files-in-pager', '-O', '--exec', '--exec-path', '--upload-pack',
  '--receive-pack', '--ext-diff', '--textconv', '--no-index', '--paginate', '--man-path',
  '--info-path',
]);
const TRUSTED_NODE = /^(?:node|nodejs)(?:\.exe)?$/i;
const TRUSTED_PYTHON = /^(?:python|python3|py)(?:\.exe)?$/i;
const SHELL_WRAPPER = /^(?:cmd|powershell|pwsh|bash|sh|zsh|fish|wsl)(?:\.exe)?$/i;
const NESTED_EXECUTION = /^(?:invoke-expression|iex)$/i;

export function shellSegments(command) {
  const segments = [];
  let start = 0, quote = null;
  for (let index = 0; index < command.length; index += 1) {
    const char = command[index];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") quote = char;
    else if (char === ';' || char === '&' || char === '|' || char === '\r' || char === '\n') {
      segments.push(command.slice(start, index));
      start = index + 1;
    }
  }
  segments.push(command.slice(start));
  return segments.map((segment) => segment.trim()).filter(Boolean);
}

export function unsafeBlenderShell(command) {
  const segments = shellSegments(command);
  if (!segments.some((segment) => BLENDER_SHELL.test(segment))) return false;
  return !(segments.length === 1 && BLENDER_VERSION.test(segments[0]));
}

function unquoted(command) {
  return command.replace(/"(?:\\.|[^"\\])*"|'(?:''|[^'])*'/g, ' ');
}

function tokens(segment) {
  const values = [];
  for (const match of segment.matchAll(/"((?:\\.|[^"\\])*)"|'((?:''|[^'])*)'|(\S+)/g)) {
    values.push((match[1] ?? match[2] ?? match[3]).replace(/\\(["\\])/g, '$1'));
  }
  return values;
}

function commandName(value) {
  return value.toLowerCase().replace(/^.*[\\/]/, '').replace(/\.exe$/, '');
}

function gitPolicy(args) {
  if (args.some((arg) => GIT_UNSAFE_FLAGS.has(arg) || [...GIT_UNSAFE_FLAGS].some((flag) => flag.startsWith('--') && arg.startsWith(`${flag}=`)))) {
    return { kind: 'confirm', reason: 'Git flag can write or execute' };
  }
  let index = 0;
  while (index < args.length) {
    const arg = args[index];
    if (arg === '-C' || arg === '--git-dir' || arg === '--work-tree') {
      if (arg !== '-C') return { kind: 'confirm', reason: 'Git directory override is not read-only' };
      index += 2;
      continue;
    }
    if (arg === '--no-pager' || arg === '--literal-pathspecs' || arg === '--no-optional-locks') { index += 1; continue; }
    if (arg === '-c') return { kind: 'confirm', reason: 'Git config override can execute an alias' };
    if (arg.startsWith('-')) return { kind: 'confirm', reason: 'Git global option is not read-only' };
    break;
  }
  const subcommand = args[index];
  const rest = args.slice(index + 1);
  if (!subcommand) return { kind: 'confirm', reason: 'Git needs a read-only subcommand' };
  if (GIT_READ_ONLY.has(subcommand)) {
    if (subcommand === 'grep' && rest.includes('--open-files-in-pager')) return { kind: 'confirm', reason: 'Git grep pager can execute' };
    if (subcommand === 'hash-object' && rest.some((arg) => arg === '-w' || arg === '--write')) return { kind: 'confirm', reason: 'Git hash-object can write objects' };
    return { kind: 'read-only' };
  }
  if (subcommand === 'branch') {
    const readOnly = rest.length > 0 && rest.every((arg) => ['--show-current', '-a', '--all', '-r', '--remotes', '-v', '--verbose', '--list', '-l', '--no-color', '--column'].includes(arg));
    return readOnly ? { kind: 'read-only' } : { kind: 'confirm', reason: 'Git branch can mutate refs' };
  }
  if (subcommand === 'config') {
    const reading = rest.some((arg) => ['--get', '--get-all', '--get-regexp', '--list', '-l'].includes(arg));
    const writing = rest.some((arg) => ['--add', '--unset', '--unset-all', '--replace-all', '--rename-section', '--remove-section', '-e', '--edit', '--file'].includes(arg));
    return reading && !writing ? { kind: 'read-only' } : { kind: 'confirm', reason: 'Git config is writable unless read-only flags are explicit' };
  }
  if (subcommand === 'remote') {
    const readOnly = rest.length === 0 || rest[0] === 'get-url' || rest[0] === 'show'
      || rest.every((arg) => ['-v', '--verbose'].includes(arg));
    return readOnly ? { kind: 'read-only' } : { kind: 'confirm', reason: 'Git remote can change remotes' };
  }
  if (subcommand === 'tag') {
    const readOnly = rest.length === 0 || rest[0] === '-l' || rest[0] === '--list';
    return readOnly ? { kind: 'read-only' } : { kind: 'confirm', reason: 'Git tag can create or delete tags' };
  }
  if (subcommand === 'stash') return ['list', 'show'].includes(rest[0]) ? { kind: 'read-only' } : { kind: 'confirm', reason: 'Git stash can change the working tree' };
  if (subcommand === 'worktree') return rest[0] === 'list' ? { kind: 'read-only' } : { kind: 'confirm', reason: 'Git worktree can change checkouts' };
  if (subcommand === 'reflog') return rest.length === 0 || ['show', 'list'].includes(rest[0]) ? { kind: 'read-only' } : { kind: 'confirm', reason: 'Git reflog can expire history' };
  return { kind: 'confirm', reason: `git ${subcommand} can mutate the repository` };
}

function segmentPolicy(segment) {
  let parts = tokens(segment);
  if (parts[0] === '&') parts = parts.slice(1);
  if (!parts.length) return { kind: 'read-only' };
  const name = commandName(parts[0]);
  if (NESTED_EXECUTION.test(name)) return { kind: 'deny', reason: 'nested command execution is not allowed; run the intended command directly' };
  if (SHELL_WRAPPER.test(name)) return { kind: 'deny', reason: 'nested shell execution is not allowed; run the intended command directly' };
  if (name === 'git') return gitPolicy(parts.slice(1));
  if (TRUSTED_NODE.test(name)) {
    const rest = parts.slice(1);
    if (rest.length === 1 && ['--version', '-v'].includes(rest[0])) return { kind: 'read-only' };
    if (rest[0] === 'tools/harness/cli.mjs' || rest[0] === 'tools\\harness\\cli.mjs') {
      return ['scaffold', 'doctor'].includes(rest[1]) ? { kind: 'trusted' } : { kind: 'confirm', reason: 'unknown harness CLI action' };
    }
    if (rest[0] === '--test' && /^tools[\\/]harness[\\/].*\.test\.mjs$/i.test(rest[1] ?? '')) return { kind: 'trusted' };
    return { kind: 'confirm', reason: 'Node can execute arbitrary code' };
  }
  if (TRUSTED_PYTHON.test(name)) {
    const rest = parts.slice(1).map((part) => part.replaceAll('\\', '/'));
    return rest[0] === '-m' && rest[1] === 'pytest' && rest[2] === 'tools/test_blender_tools.py'
      ? { kind: 'trusted' } : { kind: 'confirm', reason: 'Python can execute arbitrary code' };
  }
  if (name === 'find') {
    return parts.slice(1).some((arg) => ['-exec', '-execdir', '-ok', '-okdir', '-delete', '-fprint', '-fprintf', '-fls'].includes(arg))
      ? { kind: 'confirm', reason: 'find can execute or write' } : { kind: 'read-only' };
  }
  if (name === 'rg' && parts.slice(1).some((arg) => ['--pre', '--pre-glob', '--hostname-bin'].includes(arg))) {
    return { kind: 'confirm', reason: 'ripgrep preprocessor can execute' };
  }
  if (name === 'sort' && parts.slice(1).some((arg) => arg === '-o' || arg === '--output')) {
    return { kind: 'confirm', reason: 'sort output file is writable' };
  }
  if (name === 'date' && parts.slice(1).some((arg) => arg === '-s' || arg === '--set')) {
    return { kind: 'confirm', reason: 'date can set the clock' };
  }
  if (name === 'env' && parts.slice(1).some((arg) => !arg.startsWith('-') && !arg.includes('='))) {
    return { kind: 'confirm', reason: 'env can execute another command' };
  }
  if (POWERSHELL_READ_ONLY.has(name) || UNIX_READ_ONLY.has(name)) return { kind: 'read-only' };
  return { kind: 'confirm', reason: `${name} is not a known read-only command` };
}

export function projectPathInCommand(command) {
  for (const segment of shellSegments(command)) {
    for (const token of tokens(segment)) {
      for (const part of token.split('=')) {
        if (/^Blender[\\/]/i.test(part) || /^Blender[\\/]/i.test(part.replace(/^[.][\\/]/, ''))) return true;
      }
    }
  }
  return false;
}

export function shellPolicy(command) {
  if (typeof command !== 'string' || !command.trim()) return { kind: 'deny', reason: 'shell command is empty' };
  if (unsafeBlenderShell(command)) return { kind: 'deny', reason: 'Blender launches only through blender_workflow launch/stop' };
  const raw = unquoted(command);
  if (raw.includes('`') || raw.includes('$(')) return { kind: 'deny', reason: 'command substitution is not allowed' };
  const segments = shellSegments(command);
  if (!segments.length) return { kind: 'deny', reason: 'shell command is empty' };
  if (segments.length === 1 && BLENDER_VERSION.test(segments[0])) return { kind: 'read-only', segments };
  const results = segments.map(segmentPolicy);
  const denied = results.find((result) => result.kind === 'deny');
  if (denied) return { ...denied, segments };
  const confirm = results.find((result) => result.kind === 'confirm');
  const redirected = /[<>]/.test(raw);
  if (redirected && !confirm) return { kind: 'confirm', reason: 'input or output redirection is not read-only', segments };
  if (confirm) return { ...confirm, segments };
  return { kind: results.some((result) => result.kind === 'trusted') ? 'trusted' : 'read-only', segments };
}
