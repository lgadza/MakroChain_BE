import UserService from "./user.service.js";
import { AuthService } from "./auth.service.js";
import TokenService from "./token.service.js";

// Export both default instances and classes
export { UserService, AuthService, TokenService };

// Export the instances as default exports for backward compatibility
export default {
  UserService,
  AuthService: new AuthService(),
  TokenService,
};
