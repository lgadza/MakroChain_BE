/**
 * User roles for the application
 */
export enum Roles {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  FARMER = "FARMER",
  BUYER = "BUYER",
  GUEST = "GUEST",
}

/**
 * Resources that can be accessed
 */
export enum Resources {
  USERS = "USERS",
  HARVESTS = "HARVESTS",
  TRANSACTIONS = "TRANSACTIONS",
  REPORTS = "REPORTS",
  SETTINGS = "SETTINGS",
  LOANS = "LOANS",
}

/**
 * Permissions that can be granted on resources
 */
export enum Permissions {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
}

/**
 * Type definition for the RBAC matrix
 */
export type RbacMatrix = {
  [role in Roles]: {
    [resource in Resources]: Permissions[];
  };
};

/**
 * Role-based access control matrix
 * Maps roles to resources and their permitted actions
 */
export const RBAC_MATRIX: RbacMatrix = {
  [Roles.ADMIN]: {
    [Resources.USERS]: [
      Permissions.CREATE,
      Permissions.READ,
      Permissions.UPDATE,
      Permissions.DELETE,
      Permissions.EXPORT,
      Permissions.IMPORT,
    ],
    [Resources.HARVESTS]: [
      Permissions.CREATE,
      Permissions.READ,
      Permissions.UPDATE,
      Permissions.DELETE,
      Permissions.EXPORT,
      Permissions.IMPORT,
      Permissions.APPROVE,
      Permissions.REJECT,
    ],
    [Resources.TRANSACTIONS]: [
      Permissions.CREATE,
      Permissions.READ,
      Permissions.UPDATE,
      Permissions.DELETE,
      Permissions.EXPORT,
      Permissions.APPROVE,
      Permissions.REJECT,
    ],
    [Resources.REPORTS]: [
      Permissions.CREATE,
      Permissions.READ,
      Permissions.EXPORT,
    ],
    [Resources.SETTINGS]: [Permissions.READ, Permissions.UPDATE],
    [Resources.LOANS]: [
      Permissions.CREATE,
      Permissions.READ,
      Permissions.UPDATE,
      Permissions.DELETE,
      Permissions.EXPORT,
      Permissions.APPROVE,
      Permissions.REJECT,
    ],
  },
  [Roles.MANAGER]: {
    [Resources.USERS]: [
      Permissions.CREATE,
      Permissions.READ,
      Permissions.UPDATE,
    ],
    [Resources.HARVESTS]: [
      Permissions.CREATE,
      Permissions.READ,
      Permissions.UPDATE,
      Permissions.DELETE,
      Permissions.EXPORT,
      Permissions.APPROVE,
      Permissions.REJECT,
    ],
    [Resources.TRANSACTIONS]: [
      Permissions.CREATE,
      Permissions.READ,
      Permissions.UPDATE,
      Permissions.EXPORT,
      Permissions.APPROVE,
      Permissions.REJECT,
    ],
    [Resources.REPORTS]: [
      Permissions.CREATE,
      Permissions.READ,
      Permissions.EXPORT,
    ],
    [Resources.SETTINGS]: [Permissions.READ],
    [Resources.LOANS]: [
      Permissions.CREATE,
      Permissions.READ,
      Permissions.UPDATE,
      Permissions.EXPORT,
      Permissions.APPROVE,
      Permissions.REJECT,
    ],
  },
  [Roles.FARMER]: {
    [Resources.USERS]: [Permissions.READ, Permissions.UPDATE],
    [Resources.HARVESTS]: [
      Permissions.CREATE,
      Permissions.READ,
      Permissions.UPDATE,
      Permissions.DELETE,
    ],
    [Resources.TRANSACTIONS]: [
      Permissions.CREATE,
      Permissions.READ,
      Permissions.UPDATE,
    ],
    [Resources.REPORTS]: [Permissions.READ],
    [Resources.SETTINGS]: [Permissions.READ],
    [Resources.LOANS]: [
      Permissions.CREATE,
      Permissions.READ,
      Permissions.UPDATE,
    ],
  },
  [Roles.BUYER]: {
    [Resources.USERS]: [Permissions.READ, Permissions.UPDATE],
    [Resources.HARVESTS]: [Permissions.READ],
    [Resources.TRANSACTIONS]: [Permissions.CREATE, Permissions.READ],
    [Resources.REPORTS]: [],
    [Resources.SETTINGS]: [Permissions.READ],
    [Resources.LOANS]: [],
  },
  [Roles.GUEST]: {
    [Resources.USERS]: [],
    [Resources.HARVESTS]: [Permissions.READ],
    [Resources.TRANSACTIONS]: [],
    [Resources.REPORTS]: [],
    [Resources.SETTINGS]: [],
    [Resources.LOANS]: [],
  },
};

/**
 * Check if a role has a specific permission for a resource
 */
export const hasPermission = (
  role: Roles,
  resource: Resources,
  permission: Permissions
): boolean => {
  if (!RBAC_MATRIX[role] || !RBAC_MATRIX[role][resource]) {
    return false;
  }
  return RBAC_MATRIX[role][resource].includes(permission);
};
