// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = require('eslint-plugin-boundaries');

const element = (type) => ({ element: { type } });

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/use-component-view-encapsulation': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-console': ['error', { allow: ['error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/no-inline-styles': 'error',
      '@angular-eslint/template/no-any': 'error',
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/prefer-ngsrc': 'error',
      '@angular-eslint/template/eqeqeq': 'error',
    },
  },
  {
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.app.json' },
      },
      'boundaries/elements': [
        { type: 'core', pattern: 'src/app/core/**', partialMatch: false },
        { type: 'shared', pattern: 'src/app/shared/**', partialMatch: false },
        { type: 'layout', pattern: 'src/app/layout/**', partialMatch: false },
        {
          type: 'feature',
          pattern: 'src/app/features/*/**',
          partialMatch: false,
          capture: ['feature'],
        },
        { type: 'env', pattern: 'src/environments/**', partialMatch: false },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              allow: { to: { module: { origin: 'external' } } },
            },
            {
              from: element('layout'),
              allow: { to: { element: { types: { anyOf: ['layout', 'core', 'shared', 'env'] } } } },
            },
            {
              from: element('feature'),
              allow: [
                { to: { element: { types: { anyOf: ['core', 'shared', 'env'] } } } },
                {
                  to: {
                    element: {
                      type: 'feature',
                      captured: { feature: '{{ from.element.captured.feature }}' },
                    },
                  },
                },
              ],
            },
            {
              from: element('core'),
              allow: { to: { element: { types: { anyOf: ['core', 'env'] } } } },
            },
            {
              from: element('shared'),
              allow: { to: element('shared') },
            },
          ],
        },
      ],
    },
  },
]);
