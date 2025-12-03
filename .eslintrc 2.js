module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  settings: { react: { version: 'detect' } },
  ignorePatterns: ['node_modules', 'dist', 'build', 'public', 'docs', 'api', 'scripts', 'payhub-frontend/.next', '**/*.js'],
  rules: { 'no-eval': 'error', '@typescript-eslint/no-explicit-any': 'off', 'react/react-in-jsx-scope': 'off', 'react/no-unescaped-entities': 'off' }
}
