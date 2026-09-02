import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'mobile/kurukoo-mobile',
);
process.chdir(mobileRoot);
