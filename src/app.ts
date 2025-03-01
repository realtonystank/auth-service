import "reflect-metadata";
import express, { NextFunction, Request, Response } from "express";
import logger from "./config/logger";
import authRouter from "./routes/auth";
import { HttpError } from "http-errors";

const app = express();

app.use(express.json());
app.get("/", (_req: Request, res: Response) => {
  res.send("Welcome to auth service.");
});
app.use("/auth", authRouter);

//eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    errors: [{ type: err.name, msg: err.message, path: "", location: "" }],
  });
});

export default app;
