import createHttpError from "http-errors";
import { JwtPayload, sign } from "jsonwebtoken";
import { Config } from "../config";
import { Repository } from "typeorm";
import { RefreshToken } from "../entity/RefreshToken";
import { MS_IN_7DAY } from "../constants";
import { User } from "../entity/User";

export class TokenService {
  constructor(private refreshTokenRepository: Repository<RefreshToken>) {}
  generateAccessToken(payload: JwtPayload) {
    if (!Config.PRIVATE_KEY) {
      const error = createHttpError(500, "SECRET_KEY is not set");
      throw error;
    }
    const privateKey = Config.PRIVATE_KEY;

    const accessToken = sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: "1h",
      issuer: "auth-service",
    });

    return accessToken;
  }
  generateRefreshToken(payload: JwtPayload) {
    const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
      algorithm: "HS256",
      expiresIn: "7d",
      issuer: "auth-service",
      jwtid: String(payload.id),
    });

    return refreshToken;
  }
  async persistRefreshToken(user: User) {
    const newRefreshToken = await this.refreshTokenRepository.save({
      user: user,
      expiresAt: new Date(Date.now() + MS_IN_7DAY),
    });

    return newRefreshToken;
  }
  async deleteRefreshToken(id: number) {
    return await this.refreshTokenRepository.delete({ id });
  }
}
