/**
 * Define user roles for the application
 */
export enum Roles {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  USER = "USER",
  GUEST = "GUEST",
}

/**
 * Define permissions for resources
 */
export enum Permissions {
  READ = "read",
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  FULL = "full",
}

/**
 * Resource types in the application
 */
export enum Resources {
  USERS = "users",
  PRODUCTS = "products",
  ORDERS = "orders",
  REPORTS = "reports",
  SETTINGS = "settings",
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
 */
export const RBAC_MATRIX: RbacMatrix = {
  [Roles.ADMIN]: {
    [Resources.USERS]: [
      Permissions.READ,
      Permissions.CREATE,
      Permissions.UPDATE,
      Permissions.DELETE,
    ],
    [Resources.PRODUCTS]: [
      Permissions.READ,
      Permissions.CREATE,
      Permissions.UPDATE,
      Permissions.DELETE,
    ],
    [Resources.ORDERS]: [
      Permissions.READ,
      Permissions.CREATE,
      Permissions.UPDATE,
      Permissions.DELETE,
    ],
    [Resources.REPORTS]: [
      Permissions.READ,
      Permissions.CREATE,
      Permissions.UPDATE,
      Permissions.DELETE,
    ],
    [Resources.SETTINGS]: [Permissions.READ, Permissions.UPDATE],
  },
  [Roles.MANAGER]: {
    [Resources.USERS]: [Permissions.READ],
    [Resources.PRODUCTS]: [
      Permissions.READ,
      Permissions.CREATE,
      Permissions.UPDATE,
    ],
    [Resources.ORDERS]: [Permissions.READ, Permissions.UPDATE],
    [Resources.REPORTS]: [Permissions.READ],
    [Resources.SETTINGS]: [Permissions.READ],
  },
  [Roles.USER]: {
    [Resources.USERS]: [],
    [Resources.PRODUCTS]: [Permissions.READ],
    [Resources.ORDERS]: [Permissions.READ, Permissions.CREATE],
    [Resources.REPORTS]: [],
    [Resources.SETTINGS]: [],
  },
  [Roles.GUEST]: {
    [Resources.USERS]: [],
    [Resources.PRODUCTS]: [Permissions.READ],
    [Resources.ORDERS]: [],
    [Resources.REPORTS]: [],
    [Resources.SETTINGS]: [],
  },
};
