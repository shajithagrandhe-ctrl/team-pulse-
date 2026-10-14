import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

interface ValidationSchema {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export const validate = (schema: ValidationSchema) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }

    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }

    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }

    return next();
  } catch (error) {
    return next(error as Error);
  }
};