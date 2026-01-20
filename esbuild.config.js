import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugin to resolve path aliases
const aliasPlugin = {
  name: 'alias',
  setup(build) {
    build.onResolve({ filter: /^@shared\// }, (args) => {
      return {
        path: path.resolve(__dirname, 'shared', args.path.replace('@shared/', '')),
      };
    });
    build.onResolve({ filter: /^@\// }, (args) => {
      return {
        path: path.resolve(__dirname, 'client/src', args.path.replace('@/', '')),
      };
    });
  },
};

await build({
  entryPoints: ['server/_core/index.ts'],
  platform: 'node',
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  mainFields: ['module', 'main'],
  resolveExtensions: ['.ts', '.js', '.json'],
  plugins: [aliasPlugin],
  banner: {
    js: `import { createRequire } from 'module'; import { fileURLToPath } from 'url'; import { dirname } from 'path'; const require = createRequire(import.meta.url); const __filename = fileURLToPath(import.meta.url); const __dirname = dirname(__filename);`,
  },
}).catch(() => process.exit(1));
