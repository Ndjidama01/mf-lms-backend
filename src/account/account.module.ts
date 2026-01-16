import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AccountService } from './services/account.service';
import { ProductService } from './services/product.service';
import { AccountNumberGeneratorService } from './services/account-number-generator.service';
import { AccountEligibilityService } from './services/account-eligibility.service';
import { AccountController } from './controllers/account.controller';
import { ProductController } from './controllers/product.controller';

@Module({
  controllers: [AccountController, ProductController],
  providers: [
    PrismaService,
    AccountService,
    ProductService,
    AccountNumberGeneratorService,
    AccountEligibilityService,
  ],
  exports: [AccountService, ProductService],
})
export class AccountModule {}
