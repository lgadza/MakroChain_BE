// Central location for test utilities and standardized imports

// Re-export Jest functions for consistent imports across test files
import {
  describe,
  expect,
  test,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";

// Re-export for convenience
export {
  describe,
  expect,
  test,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  jest,
};

// Add any custom test utilities below
export const createMockResponse = () => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
    end: jest.fn(),
  };
};

export const createMockRequest = (overrides = {}) => {
  return {
    params: {},
    query: {},
    body: {},
    ...overrides,
  };
};

export const createMockNext = () => jest.fn();
