import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('uploads')
export class UploadController {
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
      fileFilter: (_req, file, cb) => {
        const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const ALLOWED_EXT  = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_MIME.includes(file.mimetype) || !ALLOWED_EXT.includes(ext)) {
          return cb(new BadRequestException('Solo se permiten imágenes JPG, PNG, WEBP o GIF'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return { url: `/uploads/${file.filename}` };
  }
}
