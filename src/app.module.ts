import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CompaniesModule } from './companies/companies.module';
import { ContactsModule } from './contacts/contacts.module';
import { UserModule } from './user/user.module';
import { OtpModule } from './otp/otp.module';
import { ContractsModule } from './contracts/contracts.module';
import { LabourModule } from './labour/labour.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { PasswordModule } from './password/password.module';
import { InventoryModule } from './inventory/inventory.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { LabourPaymentModule } from './labour_payment/labour_payment.module';
import { TasksModule } from './tasks/tasks.module';
import { AdminModule } from './admin/admin.module';
import { FlockModule } from './flock/flock.module';
import { PoultryHealthModule } from './poultry-health/poultry-health.module';
import { FisheryModule } from './fishery/fishery.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CompaniesModule,
    ContactsModule,
    UserModule,
    OtpModule,
    ContractsModule,
    TasksModule,
    LabourModule,
    InventoryModule,
    WarehouseModule,
    LabourPaymentModule,
    ReceiptsModule,
    PasswordModule,
    FlockModule,
    PoultryHealthModule,
    FisheryModule,
    SalesModule,
    AdminModule,
  ],
})
export class AppModule {}
