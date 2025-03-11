// Central location for test utilities and standardized imports

import {
  jest,
  expect,
  test,
  describe,
  it,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "@jest/globals";

// Re-export everything to make imports consistent across test files
export {
  jest,
  expect,
  test,
  describe,
  it,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
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
