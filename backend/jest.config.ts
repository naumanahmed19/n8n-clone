import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",

  // Test file patterns
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.integration.test.ts",
    "**/__tests__/**/*.performance.test.ts",
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/__tests__/**/*",
    "!src/index.ts", // Entry point typically excluded
    "!src/cli/**/*", // CLI scripts excluded
    "!src/scripts/**/*", // Utility scripts excluded
  ],

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],

  // Module path mapping
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@types/(.*)$": "<rootDir>/src/types/$1",
  },

  // Transform configuration
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },

  // Test timeout
  testTimeout: 30000, // 30 seconds for integration tests

  // Globals
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },

  // Test suites organization
  projects: [
    {
      displayName: "Unit Tests",
      testMatch: ["<rootDir>/src/__tests__/unit/**/*.test.ts"],
      testTimeout: 10000,
    },
    {
      displayName: "Integration Tests",
      testMatch: ["<rootDir>/src/__tests__/integration/**/*.test.ts"],
      testTimeout: 30000,
      setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.integration.ts"],
    },
    {
      displayName: "Performance Tests",
      testMatch: ["<rootDir>/src/__tests__/performance/**/*.test.ts"],
      testTimeout: 60000,
      setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.performance.ts"],
    },
  ],

  // Module resolution
  moduleFileExtensions: ["ts", "js", "json"],

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/coverage/"],

  // Watch plugins for development
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],

  // Reporter configuration
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "coverage",
        outputName: "junit.xml",
        suiteNameTemplate: "{filepath}",
        classNameTemplate: "{classname}",
        titleTemplate: "{title}",
      },
    ],
  ],

  // Cache configuration
  cacheDirectory: "<rootDir>/.jest-cache",

  // Error handling
  errorOnDeprecated: true,
  verbose: true,

  // Parallel execution
  maxWorkers: "50%", // Use 50% of available CPU cores

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Detect leaked timers
  detectLeaks: true,
};

export default config;
