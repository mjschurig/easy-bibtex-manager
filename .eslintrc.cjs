module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off', // Allow any types for now
    'no-useless-catch': 'warn', // Downgrade to warning
    'no-case-declarations': 'warn', // Downgrade to warning
    'no-prototype-builtins': 'warn', // Downgrade to warning
    'no-useless-escape': 'warn', // Downgrade to warning
    'react-hooks/exhaustive-deps': 'warn', // Keep as warning
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
}
