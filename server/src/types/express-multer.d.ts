import "express";

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        originalname: string;
        mimetype: string;
        filename: string;
      }
    }

    interface Request {
      file?: Multer.File;
    }
  }
}

export {};

