import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const DEFAULT_MAX_SIZE_MB = 10;

const createUploadMiddleware = (fieldName: string) => async (req: Request, res: Response, next: NextFunction) => {
  let maxSizeMb = DEFAULT_MAX_SIZE_MB;
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: 'maxFileSize' } });
    if (setting) {
      const parsed = parseFloat(setting.value);
      if (!isNaN(parsed) && parsed > 0) {
        maxSizeMb = parsed;
      }
    }
  } catch { /* use default */ }

  const uploader = multer({
    storage,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter,
  });

  uploader.single(fieldName)(req, res, next);
};

export const upload = {
  single: (fieldName: string) => createUploadMiddleware(fieldName),
};
