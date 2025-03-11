import { jest as jestType } from "@jest/globals";

declare global {
  const jest: typeof jestType;
  // Add other Jest globals if needed

  // Explicitly define the expect function
  function expect(value: any): jest.Matchers<any>;
  namespace expect {
    // Include any expect extensions you need
    function extend(matchers: Record<string, any>): void;
  }
}

// This file augments the existing Jest types without redeclaring them

// We're only declaring types that might be missing from the standard Jest types
// but not redeclaring existing ones

// If you need to add custom matchers, you can do it like this:
declare namespace jest {
  interface Matchers<R> {
    // Add any custom matchers here
    // For example: toBeWithinRange(min: number, max: number): R;
  }
}

// Only export types that don't conflict with standard Jest types
export {};
