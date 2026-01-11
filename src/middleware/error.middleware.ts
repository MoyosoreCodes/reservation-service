import { NextFunction, Request, Response } from "express";

import { ClientError, ValidationError } from "../common/errors";
import logger from "../common/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.setHeader("Content-Type", "application/json");

  if (err instanceof ValidationError) {
    res.status(err.statusCode).send(
      JSON.stringify({
        message: err.message,
        errors: err.errors,
      }),
    );
    return;
  }

  if (err instanceof ClientError) {
    res.status(err.statusCode).send(
      JSON.stringify({
        message: err.message,
      }),
    );
    return;
  }

  logger.error(`${req.url} failed - ${err}`);
  res.status(500).send(
    JSON.stringify({
      message: "Internal Server Error",
    }),
  );
  return;
};
