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
            // note you must disable the base rule
            // as it can report incorrect errors
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn', // or "error"
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
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