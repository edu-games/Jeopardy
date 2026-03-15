import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { build as esbuild } from 'esbuild';
import { existsSync, renameSync, writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'inject-durable-objects',
			apply: 'build',
			async closeBundle() {
				const root = process.cwd();
				const outDir = resolve(root, '.svelte-kit/cloudflare');
				const workerFile = resolve(outDir, '_worker.js');

				if (!existsSync(workerFile)) return;

				const skFile = resolve(outDir, '_worker_sk.js');
				const entryFile = resolve(outDir, '_do_entry.js');

				renameSync(workerFile, skFile);

				writeFileSync(
					entryFile,
					[
						`export { default } from './_worker_sk.js';`,
						`export { GameHub } from '../../src/lib/server/game-hub.ts';`
					].join('\n')
				);

				await esbuild({
					entryPoints: [entryFile],
					outfile: workerFile,
					bundle: true,
					format: 'esm',
					target: 'es2022',
					platform: 'browser',
					conditions: ['workerd', 'worker', 'browser'],
					external: ['node:*', 'cloudflare:*'],
					alias: { $lib: resolve(root, 'src/lib') }
				});

				unlinkSync(entryFile);
				unlinkSync(skFile);

				console.log('✓ Injected GameHub into _worker.js');
			}
		}
	]
});
