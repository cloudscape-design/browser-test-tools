// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import headerPlugin from '@tony.ganchev/eslint-plugin-header';
import eslintPrettier from 'eslint-plugin-prettier/recommended';
import unicornPlugin from 'eslint-plugin-unicorn';
import globals from 'globals';
import path from 'node:path';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  includeIgnoreFile(path.resolve('.gitignore')),
  eslint.configs.recommended,
  tsEslint.configs.recommended,
  eslintPrettier,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      unicorn: unicornPlugin,
      header: headerPlugin,
    },
    rules: {
      'unicorn/filename-case': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      curly: 'error',
      'header/header': [
        'error',
        'line',
        [' Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.', ' SPDX-License-Identifier: Apache-2.0'],
      ],
    },
  },
  {
    files: ['**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['__mocks__/**/*.js', 'test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    files: ['src/browser-scripts/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-var': 'off',
    },
  }
);
