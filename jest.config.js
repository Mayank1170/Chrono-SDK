module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    collectCoverage: true,
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/types.ts',
      '!src/**/constants.ts',
      '!src/index.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  };