import path from "node:path";
import { randomUUID } from "node:crypto";
import { HttpError } from "./httpError.js";

const extensions: Record<string, string[]> = {
  "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/jpg": [".jpg", ".jpeg"],
  "image/webp": [".webp"], "image/svg+xml": [".svg"], "application/pdf": [".pdf"]
};

export const validatedUploadName = (file: { mimetype: string; originalname: string }, kind: "layout" | "photo") => {
  const allowed = extensions[file.mimetype];
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowed?.includes(extension) || (kind === "photo" && [".svg", ".pdf"].includes(extension))) {
    throw new HttpError(400, "Unsupported file type or extension");
  }
  return `${kind}-${randomUUID()}${allowed[0]}`;
};
