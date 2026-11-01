const README_SECTIONS = [
  'Purpose',
  'What this project is',
  'Requirements',
  'Visual direction',
  'Deliverables',
  'Project structure',
  'Blender',
  'Workflow',
  'External assets',
  'Goals',
  'References',
  'Open questions',
  'Next steps',
];

const GOAL_SECTIONS = [
  'Mission',
  'Project',
  'Visual outcome',
  'Scope',
  'Deliverables',
  'Acceptance',
  'Workflow',
  'Done',
];

export const DOCUMENT_FORMATS = Object.freeze([
  {
    id: 'readme',
    path: 'README.md',
    fields: ['Status', 'Last updated'],
    sections: README_SECTIONS,
  },
  {
    id: 'requirements',
    path: 'Documents/REQUIREMENTS.md',
    fields: ['Status', 'Defined', 'Last updated', 'Confirmed', 'Confirmation'],
    sections: ['Core value', 'Confirmed requirements', 'Constraints', 'Deferred', 'Out of scope', 'Open questions', 'Research notes', 'Change log'],
  },
  {
    id: 'workflow',
    path: 'Documents/WORKFLOW.md',
    fields: ['Mode', 'Selected', 'Last changed'],
    sections: ['Current mode', 'Rules', 'Change log'],
  },
  {
    id: 'review',
    path: 'Documents/REVIEW.md',
    fields: ['Mode', 'Selected', 'Last changed', 'Single grader'],
    sections: ['Modes', 'Change log'],
  },
  {
    id: 'assets',
    path: 'Documents/ASSETS.md',
    fields: [],
    sections: ['Rules'],
  },
  {
    id: 'decisions',
    path: 'Documents/DECISIONS.md',
    fields: [],
    sections: [],
  },
  {
    id: 'goal',
    pattern: /^Documents\/Goals\/\d+-[a-z0-9-]+\.md$/,
    fields: [],
    sections: GOAL_SECTIONS,
  },
  {
    id: 'documents-index',
    path: 'Documents/README.md',
    fields: [],
    sections: ['Rules'],
  },
  {
    id: 'reviews-index',
    path: 'Documents/Reviews/README.md',
    fields: [],
    sections: ['Index', 'Rules'],
  },
  {
    id: 'references-index',
    path: 'Documents/References/README.md',
    fields: [],
    sections: ['Index'],
  },
]);

export function documentFormat(relative) {
  return DOCUMENT_FORMATS.find((format) => format.path === relative || format.pattern?.test(relative)) ?? null;
}

export function isBootstrapDocument(relative) {
  if (typeof relative !== 'string' || !relative.endsWith('.md')) return false;
  if (relative.startsWith('Documents/Reviews/') && relative !== 'Documents/Reviews/README.md') return false;
  return true;
}

export function describeDocumentFormats() {
  return DOCUMENT_FORMATS.map((format) => ({
    id: format.id,
    path: format.path ?? String(format.pattern),
    fields: [...format.fields],
    sections: [...format.sections],
  }));
}

const field = (text, key) => [...text.matchAll(new RegExp(`^${key}:[ \\t]*([^\\r\\n]*)`, 'gm'))];

export function validateDocument(relative, content) {
  if (typeof content !== 'string') throw new Error(`document gate: ${relative} content must be markdown text`);
  if (!content.trim()) throw new Error(`document gate: ${relative} is empty`);
  if (content.length > 1_000_000) throw new Error(`document gate: ${relative} exceeds 1,000,000 characters`);
  const text = content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (text.includes('{{')) throw new Error(`document gate: ${relative} contains unresolved template tokens`);

  const headings = [...text.matchAll(/^#(?!#)[ \t]+(.+)$/gm)];
  if (headings.length !== 1) throw new Error(`document gate: ${relative} requires exactly one level-1 heading`);

  const format = documentFormat(relative);
  if (!format) return { format: null };
  for (const name of format.fields) {
    const matches = field(text, name);
    if (matches.length !== 1 || !matches[0][1].trim()) throw new Error(`document gate: ${relative} requires exactly one filled ${name}: field`);
  }
  for (const name of format.sections) {
    const count = [...text.matchAll(new RegExp(`^##[ \\t]+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[ \\t]*$`, 'gm'))].length;
    if (count !== 1) throw new Error(`document gate: ${relative} requires exactly one "## ${name}" section`);
  }
  return { format: format.id };
}

export const BOOTSTRAP_FILE = /(?:^|\/)(?:\.gitkeep|\.gitignore|\.gitattributes|README\.md|SOURCE\.md|SOURCE_TEMPLATE\.md|LICENSE(?:\.[A-Za-z0-9._-]+)?)$/i;

export function isBootstrapFile(relative) {
  if (typeof relative !== 'string' || !relative) return false;
  if (relative.endsWith('.md')) return isBootstrapDocument(relative);
  return BOOTSTRAP_FILE.test(relative);
}
