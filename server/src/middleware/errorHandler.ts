import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { MulterError } from "multer";

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof MulterError) {
    const code = (err as { code: string }).code;
    return res.status(code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
      success: false,
      message: code === "LIMIT_FILE_SIZE" ? "File exceeds upload size limit" : "Invalid multipart upload"
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(env.nodeEnv === "development" && err.details ? { details: err.details } : {})
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.flatten().fieldErrors
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Record not found"
      });
    }

    return res.status(400).json({
      success: false,
      message: env.nodeEnv === "development" ? err.message : "Database error"
    });
  }

  logger.error({ err }, "Unhandled error");

  return res.status(500).json({
    success: false,
    message: env.nodeEnv === "development" && err instanceof Error ? err.message : "Internal server error"
  });
};
