import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/**
 * The `lint` script has existed in package.json since the project was created, but eslint was
 * never installed and no config was ever committed — so `npm run lint` has never run. This makes
 * it real.
 *
 * Pinned to eslint 9: eslint-plugin-react 7.x does not yet declare a peer range covering eslint 10.
 */
export default [
    {
        ignores: ['dist/**', 'dist-ssr/**', 'node_modules/**', 'Claude Design/**'],
    },

    // ── Browser code ────────────────────────────────────────────────────────────
    {
        files: ['src/**/*.{js,jsx}'],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.browser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        settings: { react: { version: 'detect' } },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.flat.recommended.rules,
            ...react.configs.flat['jsx-runtime'].rules,
            ...reactHooks.configs.flat.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

            // Props are documented by the components themselves; prop-types are not used anywhere
            // in this codebase and adding them now would be a large unrelated diff.
            'react/prop-types': 'off',

            // The rule assumes React 19, where the prop is `fetchPriority`. On React 18.3 — what
            // this project runs — passing camelCase logs "React does not recognize the
            // fetchPriority prop … spell it as lowercase fetchpriority instead" on every render.
            // Verified against react-dom 18.3.1. Drop this ignore when the project moves to React 19.
            'react/no-unknown-property': ['error', { ignore: ['fetchpriority'] }],

            // 2026-08-03: deliberately off for now, not forever.
            //
            // Satisfying it means adding dependencies to existing effects, which changes when they
            // re-run. Several of those effects are in BookingPage.jsx (~1 500 lines) and drive the
            // live booking flow — real money, real calendar writes. That is a behavioural change and
            // does not belong in an SEO pass whose whole premise is changing nothing a visitor sees.
            //
            // Turn this on and work through it as its own piece of work, with the booking flow
            // exercised end to end.
            'react-hooks/exhaustive-deps': 'off',

            // Same reasoning: react-hooks 7 adds compiler-driven rules that flag long-standing
            // patterns here. Worth adopting deliberately, not as a side effect of this pass.
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/refs': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/purity': 'off',
            'react-hooks/preserve-manual-memoization': 'off',

            'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        },
    },

    // ── Node: serverless functions, build scripts, config ───────────────────────
    {
        files: ['api/**/*.js', 'scripts/**/*.{js,mjs}', '*.config.js', 'vercel.config.test.js'],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.node,
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        },
    },

    // ── Tests ───────────────────────────────────────────────────────────────────
    {
        files: ['**/*.test.{js,jsx}'],
        languageOptions: {
            globals: { ...globals.node, ...globals.browser },
        },
    },
];
