import { Request } from "express";
import { expressjwt } from "express-jwt";
import { Config } from "../config";
import { AuthCookie } from "../types";

export default expressjwt({
  secret: Config.REFRESH_TOKEN_SECRET!,
  algorithms: ["HS256"],
  getToken(req: Request) {
    const authHeader = req.headers.authorizaton;
    if (
      authHeader &&
      typeof authHeader === "string" &&
      authHeader.split(" ")[1] !== "undefined"
    ) {
      const token = authHeader.split(" ")[1];
      if (token) return token;
    }

    const { refreshToken } = req.cookies as AuthCookie;

    return refreshToken;
  },
});
