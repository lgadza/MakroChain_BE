export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '@/(.*)': '<rootDir>/src/$1',
    '@config/(.*)': '<rootDir>/config/$1',
    '@controllers/(.*)': '<rootDir>/src/controllers/$1',
    '@models/(.*)': '<rootDir>/models/$1',
    '@middleware/(.*)': '<rootDir>/src/middleware/$1',
    '@utils/(.*)': '<rootDir>/src/utils/$1',
    '@types/(.*)': '<rootDir>/src/types/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
    }]
  },
  setupFilesAfterEnv: ['./src/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/tests/**',
    '!**/node_modules/**',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  testMatch: ['**/tests/**/*.test.ts'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  globals: {
    'ts-jest': {
      useESM: true,
      isolatedModules: true, // This helps avoid declaration conflicts
    },
  },
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  // We'll handle globals through imports rather than global injection
  injectGlobals: false,
}
