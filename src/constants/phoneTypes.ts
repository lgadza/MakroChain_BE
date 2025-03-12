/**
 * Phone type constants
 */
export enum PhoneType {
  MOBILE = "MOBILE",
  HOME = "HOME",
  WORK = "WORK",
  FAX = "FAX",
  OTHER = "OTHER",
}

/**
 * Get all available phone types
 */
export const getPhoneTypes = (): string[] => {
  return Object.values(PhoneType);
};
