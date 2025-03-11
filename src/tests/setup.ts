// This file sets up the test environment

// Import Jest types but don't redeclare globals
import "@types/jest";

// Import Jest functions but don't expose them globally to avoid conflicts
import {
  jest,
  expect,
  test,
  describe,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "@jest/globals";

// Configure Jest
jest.setTimeout(30000); // Set a longer timeout for tests

// Setup any global test hooks
beforeAll(() => {
  // Code to run before all tests
  console.log("Starting test suite...");
});

afterAll(() => {
  // Code to run after all tests
  console.log("Test suite complete.");
});

// Note: We're not assigning Jest functions to global to avoid conflicts
// They should be imported directly in each test file
