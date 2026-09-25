import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Hosts without rewrite rules (e.g. GitHub Pages) serve 404.html for unknown paths.
// Making it a copy of index.html lets direct links like /drink/11007 load the app.
function spaFallback() {
  let outDir;
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
    }
  };
}

export default defineConfig({
  plugins: [react(), spaFallback()]
});
