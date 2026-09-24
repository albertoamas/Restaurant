import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { StorageQuotaService } from './application/storage-quota.service';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXT  = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

@Controller('uploads')
export class UploadController {
  constructor(private readonly storageQuota: StorageQuotaService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  // 20 uploads por minuto por IP — suficiente para uso legítimo, bloquea spam que sature CPU/disco
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB raw — Sharp will compress it down
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_MIME.includes(file.mimetype) || !ALLOWED_EXT.includes(ext)) {
          return cb(new BadRequestException('Solo se permiten imágenes JPG, PNG, WEBP o GIF'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentTenant() tenantId: string,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');

    // Se comprime primero para medir el tamaño real que va a ocupar: cobrar la
    // cuota sobre el original (hasta 10 MB) sería mucho más estricto que la
    // realidad, porque sharp suele dejarlo en una fracción.
    let webp: Buffer;
    try {
      webp = await sharp(file.buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new InternalServerErrorException('Error al procesar la imagen');
    }

    await this.storageQuota.assertFits(tenantId, webp.byteLength);

    // Cada tenant escribe en su propia carpeta: permite medir su uso y, el día
    // que un cliente se vaya, borrar o migrar lo suyo sin tocar lo de otros.
    // `useStaticAssets` sirve `uploads/` recursivamente, así que la URL nueva
    // funciona sin cambios de infraestructura y las viejas siguen vivas.
    const dir = this.storageQuota.tenantDir(tenantId);
    await mkdir(dir, { recursive: true });

    const filename = `${uuidv4()}.webp`;
    try {
      await writeFile(join(dir, filename), webp);
    } catch {
      throw new InternalServerErrorException('Error al guardar la imagen');
    }

    return { url: `/uploads/${tenantId}/${filename}` };
  }
}
