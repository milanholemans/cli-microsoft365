import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  cpSync,
  rmSync,
  readFileSync
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const docsRoot = resolve(repoRoot, 'docs');

// Get the last git tag
let lastTag;
try {
  lastTag = execSync('git describe --tags --abbrev=0', {
    encoding: 'utf-8',
    cwd: repoRoot
  }).trim();
}
catch {
  console.log('No git tags found. Skipping stable version preparation.');
  process.exit(0);
}

console.log(`Preparing stable version from tag: ${lastTag}`);

// Create temp directory
const tempDir = mkdtempSync(join(tmpdir(), 'stable-docs-'));

try {
  // Extract docs from the tag into the temp directory
  const archivePath = join(tempDir, 'stable.tar');
  execSync(
    `git archive -o "${archivePath}" "${lastTag}" -- docs/docs/ docs/src/config/sidebars.ts`,
    { cwd: repoRoot }
  );
  execSync(`tar -xf "${archivePath}"`, { cwd: tempDir });

  // Clean any existing versioned files
  for (const p of ['versioned_docs', 'versioned_sidebars']) {
    const fullPath = join(docsRoot, p);
    if (existsSync(fullPath)) {
      rmSync(fullPath, { recursive: true });
    }
  }

  const versionedDocsDir = join(docsRoot, 'versioned_docs', `version-${lastTag}`);
  const versionedSidebarsDir = join(docsRoot, 'versioned_sidebars');

  mkdirSync(versionedDocsDir, { recursive: true });
  mkdirSync(versionedSidebarsDir, { recursive: true });

  // Copy the docs content from the tag
  cpSync(join(tempDir, 'docs', 'docs'), versionedDocsDir, { recursive: true });

  // Convert sidebar TypeScript to JSON
  const sidebarContent = readFileSync(
    join(tempDir, 'docs', 'src', 'config', 'sidebars.ts'),
    'utf-8'
  );

  const jsContent = sidebarContent
    // Remove TypeScript type imports
    .replace(/^import\s+type\s+.*$/gm, '')
    // Remove type annotations
    .replace(/:\s*SidebarsConfig/g, '')
    // Replace export default with module.exports
    .replace(/export\s+default\s+(\w+)\s*;?\s*$/m, 'module.exports = $1;');

  const tempCjsPath = join(tempDir, 'sidebars.cjs');
  writeFileSync(tempCjsPath, jsContent);

  const sidebars = require(tempCjsPath);
  writeFileSync(
    join(versionedSidebarsDir, `version-${lastTag}-sidebars.json`),
    JSON.stringify(sidebars, null, 2) + '\n'
  );

  // Create versions.json
  writeFileSync(join(docsRoot, 'versions.json'), JSON.stringify([lastTag], null, 2) + '\n');

  console.log(`Stable version prepared successfully from tag ${lastTag}`);
}
finally {
  // Clean up temp directory
  rmSync(tempDir, { recursive: true, force: true });
}
