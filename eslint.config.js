import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
export default tseslint.config({ ignores: ['dist', 'node_modules', '.pytest_cache'] }, { extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooks.configs['recommended-latest'], reactRefresh.configs.vite], files: ['**/*.{ts,tsx}'], languageOptions: { ecmaVersion: 2020, globals: { window: 'readonly', localStorage: 'readonly', crypto: 'readonly', setTimeout: 'readonly' } } });
