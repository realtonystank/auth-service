import "reflect-metadata";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import logger from "./config/logger";
import authRouter from "./routes/auth";
import tenantRouter from "./routes/tenant";
import userRouter from "./routes/user";
import { HttpError } from "http-errors";
import { Config } from "./config";

const app = express();
app.use(
  cors({
    origin: [Config.ADMIN_CLIENT_URL!],
    credentials: true,
  }),
);
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());
app.get("/", (_req: Request, res: Response) => {
  res.send("Welcome to auth service.");
});
app.use("/auth", authRouter);
app.use("/tenants", tenantRouter);
app.use("/users", userRouter);

//eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    errors: [{ type: err.name, msg: err.message, path: "", location: "" }],
  });
});

export default app;
