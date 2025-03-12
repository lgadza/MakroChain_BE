export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      // No other ts-jest config here - all moved to transformOptions
    }],
  },
  transformOptions: {
    useESM: true,
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  setupFilesAfterEnv: ['./src/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/tests/**',
    '!**/node_modules/**',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  injectGlobals: true,
  // Adding restoreMocks to reset any mocks between tests
  restoreMocks: true,
  // Clear mocks between tests
  clearMocks: true,
}
