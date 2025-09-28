#!/usr/bin/env node
/*
  ساده‌ترین ولیدیشن JSONهای ماژول definition-editor
  - یکتایی id ها
  - درستی parentId (وجود والد قبل از فرزند در traversal)
  - نبود حلقه (DFS با stack)
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JSON_DIR = path.join(ROOT, 'src', 'modules', 'definition-editor', 'data', 'json');

const files = [
  'geographical.json',
  'military_ranks.json',
  'time_definitions.json',
  'equipment.json',
  'logistics.json',
];

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function validateData(data, filename) {
  const nodes = data.nodes || [];
  const errors = [];

  const idSet = new Set();

  function dfs(node, stack) {
    if (idSet.has(node.id)) {
      // اجازه تکرار id در traversal به‌معنای duplicate است
      errors.push(`Duplicate id '${node.id}'`);
    }
    idSet.add(node.id);

    if (stack.includes(node.id)) {
      errors.push(`Cycle detected at '${node.id}'`);
      return;
    }

    const nextStack = stack.concat(node.id);
    const children = Array.isArray(node.children) ? node.children : [];
    for (const child of children) {
      if (child.parentId !== node.id) {
        errors.push(`Invalid parentId for child '${child.id}' -> expected '${node.id}', got '${child.parentId}'`);
      }
      dfs(child, nextStack);
    }
  }

  for (const root of nodes) {
    if (root.parentId !== null && root.parentId !== undefined) {
      errors.push(`Root node '${root.id}' must have parentId null`);
    }
    dfs(root, []);
  }

  return errors;
}

let hasError = false;

for (const f of files) {
  const filePath = path.join(JSON_DIR, f);
  try {
    const data = readJson(filePath);
    const errs = validateData(data, f);
    if (errs.length) {
      hasError = true;
      console.log(`\n[${f}]`);
      for (const e of errs) console.log(` - ${e}`);
    } else {
      console.log(`[OK] ${f}`);
    }
  } catch (e) {
    hasError = true;
    console.log(`\n[${f}]`);
    console.log(` - Failed to read/parse: ${e.message}`);
  }
}

process.exit(hasError ? 1 : 0);



