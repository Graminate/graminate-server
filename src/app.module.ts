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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CompaniesModule,
    ContactsModule,
    UserModule,
    OtpModule,
    ContractsModule,
    LabourModule,
    ReceiptsModule,
    PasswordModule,
  ],
})
export class AppModule {}
