export default {
    preset: 'ts-jest/presets/js-with-ts-esm',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
      '^(\.{1,2}/.*)\.js$': '$1',
    },
    transform: {
      '^.+\.tsx?$': ['ts-jest', {
        useESM: true,
      }],
    },
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