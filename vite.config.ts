import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		nodePolyfills({
			globals: {
				Buffer: true,
				global: true,
				process: true
			},
			protocolImports: true
		})
	],
	server: {
		fs: {
			allow: ['..']
		}
	},
	optimizeDeps: {
		include: ['@massalabs/massa-web3', '@massalabs/wallet-provider']
	},
	resolve: {
		alias: {
			// Fix ES module resolution issues
			'@massalabs/wallet-provider/dist/esm/errors':
				'@massalabs/wallet-provider/dist/esm/errors/index.js'
		}
	},
	build: {
		commonjsOptions: {
			include: [/node_modules/]
		}
	}
});
