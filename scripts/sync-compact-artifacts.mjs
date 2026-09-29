import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const sourceRoot = resolve('managed/kora');
const publicRoot = resolve('public/contract/compiled/kora');

for (const artifactDirectory of ['keys', 'zkir']) {
  const source = resolve(sourceRoot, artifactDirectory);
  const destination = resolve(publicRoot, artifactDirectory);

  if (!existsSync(source)) {
    throw new Error(`Missing Compact ${artifactDirectory} artifacts at ${source}. Run compact compile first.`);
  }

  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
}

console.log('Synced generated Compact keys and ZKIR into public/contract/compiled/kora.');
