import { Request } from "express";
export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

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
