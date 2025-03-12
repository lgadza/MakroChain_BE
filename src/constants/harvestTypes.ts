/**
 * Quality grade constants for harvests
 */
export enum QualityGrade {
  PREMIUM = "PREMIUM",
  A = "A",
  B = "B",
  C = "C",
  ORGANIC = "ORGANIC",
  EXPORT = "EXPORT",
  PROCESSING = "PROCESSING",
}

/**
 * Market status constants for harvests
 */
export enum MarketStatus {
  AVAILABLE = "AVAILABLE",
  SOLD = "SOLD",
  RESERVED = "RESERVED",
  PROCESSING = "PROCESSING",
  REJECTED = "REJECTED",
}

/**
 * Common units of measurement for harvest quantities
 */
export enum UnitOfMeasure {
  KILOGRAM = "kg",
  TON = "ton",
  METRIC_TON = "metric_ton",
  POUND = "lb",
  LITER = "liter",
  BUSHEL = "bushel",
}

/**
 * Get all available quality grades
 */
export const getQualityGrades = (): string[] => {
  return Object.values(QualityGrade);
};

/**
 * Get all available market statuses
 */
export const getMarketStatuses = (): string[] => {
  return Object.values(MarketStatus);
};

/**
 * Get all available units of measure
 */
export const getUnitsOfMeasure = (): string[] => {
  return Object.values(UnitOfMeasure);
};
