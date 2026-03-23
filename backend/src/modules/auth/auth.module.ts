import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantModule } from '../tenant/tenant.module';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { AuthController } from './infrastructure/controllers/auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '7d'),
        },
      }),
    }),
    TenantModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepository,
    },
    JwtStrategy,
    LoginUseCase,
    RegisterUseCase,
    GetProfileUseCase,
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
