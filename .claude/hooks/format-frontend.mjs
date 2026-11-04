import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const FORMATTABLE = new Set(['.ts', '.html', '.css', '.json']);

const input = JSON.parse(readFileSync(0, 'utf8'));
const filePath = input.tool_input?.file_path;
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const frontendDir = path.join(projectDir, 'frontend');
const prettier = path.join(frontendDir, 'node_modules', 'prettier', 'bin', 'prettier.cjs');

function isInsideFrontendSources(file) {
  const relative = path.relative(path.join(frontendDir, 'src'), file);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

if (filePath && FORMATTABLE.has(path.extname(filePath)) && existsSync(prettier)) {
  const file = path.resolve(filePath);
  if (isInsideFrontendSources(file)) {
    spawnSync(process.execPath, [prettier, '--write', file], { cwd: frontendDir, stdio: 'ignore' });
  }
}
