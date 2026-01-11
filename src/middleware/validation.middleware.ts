import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

import { ValidationError } from "../common/errors";
import { validate } from "../common/utils";

type ValidationConfig = Partial<{
  body: ZodSchema;
  query: ZodSchema;
  params: ZodSchema;
}>;

export const validateRequest = (config: ValidationConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, any> = {};

    for (const [property, schema] of Object.entries(config)) {
      const { data, error } = validate(schema, req[property as keyof Request]);

      if (error) errors[property] = error;
      else Object.assign(req[property as keyof Request], data);
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("Validation failed", errors);
    }

    next();
  };
};
