import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'pos_user',
  password: process.env.DB_PASSWORD || 'pos_password',
  database: process.env.DB_DATABASE || 'pos_db',
  autoLoadEntities: true,
  synchronize: true, // Only for development - use migrations in production
});
