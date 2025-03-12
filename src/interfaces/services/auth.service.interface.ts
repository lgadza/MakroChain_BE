import { LoginDto, RegisterDto } from "../../dto/auth.dto.js";

// Define the return types
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface IAuthService {
  login(
    loginData: LoginDto
  ): Promise<{ user: UserResponse; tokens: AuthTokens }>;

  register(
    userData: RegisterDto
  ): Promise<{ user: UserResponse; tokens: AuthTokens }>;

  refreshToken(token: string): Promise<AuthTokens>;

  logout(userId: string): Promise<void>;

  getUserById(userId: string): Promise<UserResponse>;
}
