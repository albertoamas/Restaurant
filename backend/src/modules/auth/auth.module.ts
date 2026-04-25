import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PlansModule } from '../plans/plans.module';
import { CommonModule } from '../../common/common.module';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { CreateCashierUseCase } from './application/use-cases/create-cashier.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { ToggleUserUseCase } from './application/use-cases/toggle-user.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { UpdateUserBranchUseCase } from './application/use-cases/update-user-branch.use-case';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { AuthController } from './infrastructure/controllers/auth.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '7d') as unknown as number,
        },
      }),
    }),
    PlansModule,
    CommonModule,
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
    CreateCashierUseCase,
    ListUsersUseCase,
    ToggleUserUseCase,
    ChangePasswordUseCase,
    UpdateUserBranchUseCase,
  ],
  exports: [JwtStrategy, PassportModule, RegisterUseCase, 'UserRepositoryPort'],
})
export class AuthModule {}
