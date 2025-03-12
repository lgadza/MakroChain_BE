/**
 * Address type constants
 */
export enum AddressType {
  HOME = "HOME",
  WORK = "WORK",
  SHIPPING = "SHIPPING",
  BILLING = "BILLING",
}

/**
 * Get all available address types
 */
export const getAddressTypes = (): string[] => {
  return Object.values(AddressType);
};
