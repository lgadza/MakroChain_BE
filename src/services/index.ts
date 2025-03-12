import UserService from "./user.service.js";
import { AuthService } from "./auth.service.js";

// Export both default instances and classes
export { UserService, AuthService };

// Export the instances as default exports for backward compatibility
export default {
  UserService,
  AuthService: new AuthService(),
};
