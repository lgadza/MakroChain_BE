import { register } from 'tsconfig-paths';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

register({
  baseUrl: __dirname,
  paths: {
    '@/*': ['src/*']
  }
});
