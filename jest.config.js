// Runs the backend and frontend tests from the root.
// The teacher's TDD scripts (script/ and .husky/) call `jest` here on every test run and commit.
const shared = { '^@shared/(.*)$': '<rootDir>/shared/$1' };

export default {
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      roots: ['<rootDir>/backend/src'],
      setupFiles: ['<rootDir>/backend/src/setupTests.ts'],
      moduleNameMapper: shared,
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/frontend/src'],
      setupFilesAfterEnv: ['<rootDir>/frontend/src/setupTests.ts'],
      moduleNameMapper: shared,
    },
  ],
  collectCoverageFrom: [
    'backend/src/**/*.ts',
    'frontend/src/**/*.{ts,tsx}',
    'shared/**/*.ts',
    '!**/*.test.{ts,tsx}',
    '!backend/src/server.ts',
    '!backend/src/setupTests.ts',
    '!frontend/src/main.tsx',
    '!frontend/src/setupTests.ts',
  ],
};
