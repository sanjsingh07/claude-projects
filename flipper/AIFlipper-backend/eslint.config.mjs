import tseslint from 'typescript-eslint';

// Flat config (ESLint 10). The point of linting here is the floating-promise
// class of bugs: the Iteration 3 async conversion had three that TypeScript
// compiled clean — a spread of an un-awaited Promise, res.json() of a Promise,
// and a truthy-Promise branch. no-floating-promises + no-misused-promises catch
// that statically. Those two need type information, so we take the type-checked
// base and then quiet the no-unsafe-* family, which fires constantly at the
// intentional `any` boundaries (req.body, third-party API responses) where
// zod/coercion validates at runtime instead.
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // This flat-config file isn't part of tsconfig's src rootDir; let the
          // project service type-check it under a default project rather than error.
          allowDefaultProject: ['eslint.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // Wire-boundary `any` is deliberate; runtime validation guards it.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    // node:test's test() returns a promise the runner tracks; callers are not
    // meant to await it, so the floating-promise rule is noise in test files.
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  }
);
