import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	js.configs.recommended,
	// Root config files (vite, svelte, tailwind, etc.)
	{
		files: ['*.js', '*.cjs', '*.mjs', '*.ts'],
		plugins: { '@typescript-eslint': ts },
		languageOptions: {
			parser: tsParser,
			globals: { ...globals.node }
		},
		rules: {
			...ts.configs.recommended.rules,
			'no-undef': 'off'
		}
	},
	// Source TypeScript/JS files
	{
		files: ['src/**/*.ts', 'src/**/*.js'],
		plugins: { '@typescript-eslint': ts, 'unused-imports': unusedImports },
		languageOptions: {
			parser: tsParser,
			globals: { ...globals.browser }
		},
		rules: {
			...ts.configs.recommended.rules,
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'unused-imports/no-unused-imports': 'error',
			'unused-imports/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	},
	// Svelte files
	{
		files: ['**/*.svelte'],
		plugins: { svelte, '@typescript-eslint': ts, 'unused-imports': unusedImports },
		languageOptions: {
			parser: svelteParser,
			parserOptions: { parser: tsParser },
			globals: { ...globals.browser }
		},
		rules: {
			...svelte.configs.recommended.rules,
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'unused-imports/no-unused-imports': 'error',
			'unused-imports/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	},
	{
		ignores: [
			'.svelte-kit/**',
			'.wrangler/**',
			'dist/**',
			'build/**',
			'node_modules/**',
			'drizzle/**'
		]
	}
];
