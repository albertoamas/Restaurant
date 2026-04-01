import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UploadModule } from './modules/upload/upload.module';
import { BranchModule } from './modules/branch/branch.module';
import { CashSessionModule } from './modules/cash-session/cash-session.module';
import { EventsModule } from './modules/events/events.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { CustomersModule } from './modules/customers/customers.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ name: 'global', ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    TenantModule,
    BranchModule,
    CatalogModule,
    OrdersModule,
    ReportsModule,
    UploadModule,
    CashSessionModule,
    EventsModule,
    ExpensesModule,
    CustomersModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
