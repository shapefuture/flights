module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Disable warnings for unused variables during development
    '@typescript-eslint/no-unused-vars': 'off',
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'off', // We're using TypeScript for type checking
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'off', // Allow console logs for development
  },
  overrides: [
    {
      files: ['**/*.test.tsx', '**/*.test.ts', '**/__tests__/**/*.tsx', '**/__tests__/**/*.ts'],
      env: {
        jest: true,
        'vitest-globals/env': true,
      },
      // Disable specific rules for test files
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};