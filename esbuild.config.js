import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugin to resolve path aliases
const aliasPlugin = {
  name: 'alias',
  setup(build) {
    build.onResolve({ filter: /^@shared\// }, (args) => {
      const importPath = args.path.replace('@shared/', '');
      const basePath = path.resolve(__dirname, 'shared');
      
      // Try to find the file with extensions (check if file exists)
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
      for (const ext of extensions) {
        const fullPath = path.resolve(basePath, importPath + ext);
        try {
          if (existsSync(fullPath)) {
            return { path: fullPath };
          }
        } catch {
          // Continue to next extension
        }
      }
      
      // If file checking fails (e.g., on Heroku build), default to .ts extension
      // This is safe since we're using TypeScript
      const defaultPath = path.resolve(basePath, importPath + '.ts');
      return { path: defaultPath };
    });
    
    build.onResolve({ filter: /^@\// }, (args) => {
      const importPath = args.path.replace('@/', '');
      const basePath = path.resolve(__dirname, 'client/src');
      
      // Try to find the file with extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
      for (const ext of extensions) {
        const fullPath = path.resolve(basePath, importPath + ext);
        try {
          if (existsSync(fullPath)) {
            return { path: fullPath };
          }
        } catch {
          // Continue to next extension
        }
      }
      
      return { path: path.resolve(basePath, importPath) };
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
