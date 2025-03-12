import { Request } from "express";
export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  tenantId?: number;
}

export type UpdateUserData = Omit<UserData, "password">;

export interface RegisterUserRequest extends Request {
  body: UserData;
}

export interface AuthRequest extends Request {
  auth: {
    sub: string;
    role: string;
    id: number;
  };
}

export type AuthCookie = {
  accessToken: string;
  refreshToken: string;
};

export interface IRefreshTokenPayload {
  id: string;
}

export interface Headers {
  ["set-cookie"]: string[];
}

export interface ITenant {
  name: string;
  address: string;
}

export interface TenantRequest extends Request {
  body: ITenant;
}

export interface CreateUserRequest extends Request {
  body: UserData;
}

export interface UpdateUserRequest extends Request {
  body: UserData;
}
