import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { LoansModule } from './modules/loans/loans.module';
import configuration from './config/configuration';
import { BranchesModule } from './modules/branches/branches.module';
import { DocumentsModule } from './modules/documents/documents.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 10, // 10 requests
    }]),
    
    // Database
    PrismaModule,
    
    // Feature modules
    AuthModule,
    UsersModule,
    BranchesModule,
    DocumentsModule,
    CustomersModule,
    LoansModule,
  ],
})
export class AppModule {}
