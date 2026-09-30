import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const sourceRoot = resolve('managed/kora');
const publicRoot = resolve('public/contract/compiled/kora');

for (const artifactDirectory of ['keys', 'zkir']) {
  const source = resolve(sourceRoot, artifactDirectory);
  const destination = resolve(publicRoot, artifactDirectory);

  if (!existsSync(source)) {
    throw new Error(`Missing Compact ${artifactDirectory} artifacts at ${source}. Run compact compile first.`);
  }

  mkdirSync(destination, { recursive: true });
  for (const filename of readdirSync(source)) {
    // Midnight.js requests artifacts by the bare Compact circuit name; it adds the contract tag only to diagnostics.
    copyFileSync(resolve(source, filename), resolve(destination, filename));
  }
}

console.log('Synced Compact keys and ZKIR into public/contract/compiled/kora.');
