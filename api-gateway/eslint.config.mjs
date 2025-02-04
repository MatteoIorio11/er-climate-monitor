import globals from 'globals';
import pluginJs from '@eslint/js';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
import tsEslintParser from '@typescript-eslint/parser';
import eslintPluginPrettier from 'eslint-plugin-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            parser: tsEslintParser, // Use the TypeScript parser
        },
        plugins: {
            '@typescript-eslint': tsEslintPlugin,
            prettier: eslintPluginPrettier,
        },
        rules: {
            ...tsEslintPlugin.configs.recommended.rules, // Import TypeScript rules
            'prettier/prettier': 'error', // Enable Prettier formatting rules
<<<<<<<< HEAD:api-gateway/eslint.config.mjs
            // note you must disable the base rule
            // as it can report incorrect errors
            "@typescript-eslint/no-explicit-any": ["off"],
            'no-unused-vars': [
                'warn', // or "error"
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
========
            "@typescript-eslint/no-explicit-any": ["off"],
>>>>>>>> feat/sensor-registry:sensor-registry/eslint.config.mjs
        },
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs', // Explicitly set sourceType for JS files
        },
    },
    pluginJs.configs.recommended, // Use eslint's JS recommended config
];