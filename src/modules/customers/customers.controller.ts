import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  QueryCustomersDto,
  ConvertProspectDto,
  UpdateKYCDto,
  UpdateRiskProfileDto,
} from './dto/customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, CustomerType, CustomerStatus } from '@prisma/client';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.LOAN_OFFICER, UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new customer/prospect' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Customer already exists' })
  create(
    @Body() createCustomerDto: CreateCustomerDto,
    @CurrentUser('id') createdBy: string,
  ) {
    return this.customersService.create(createCustomerDto, createdBy);
  }

  @Get()
  @Roles(
    UserRole.LOAN_OFFICER,
    UserRole.BRANCH_MANAGER,
    UserRole.ADMIN,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get all customers with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false, enum: CustomerType })
  @ApiQuery({ name: 'status', required: false, enum: CustomerStatus })
  @ApiQuery({ name: 'branchId', required: false })
  findAll(@Query() query: QueryCustomersDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Roles(
    UserRole.LOAN_OFFICER,
    UserRole.BRANCH_MANAGER,
    UserRole.ADMIN,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.LOAN_OFFICER, UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate customer (soft delete)' })
  @ApiResponse({ status: 200, description: 'Customer deactivated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete customer with active loans' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  @Post(':id/convert-to-customer')
  @Roles(UserRole.LOAN_OFFICER, UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Convert prospect to active customer' })
  @ApiResponse({ status: 200, description: 'Prospect converted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid conversion - KYC not complete' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  convertToCustomer(@Param('id') id: string, @Body() _convertDto: ConvertProspectDto) {
    return this.customersService.convertToCustomer(id);
  }

  @Patch(':id/kyc')
  @Roles(UserRole.LOAN_OFFICER, UserRole.BRANCH_MANAGER, UserRole.COMPLIANCE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update customer KYC profile' })
  @ApiResponse({ status: 200, description: 'KYC updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer or KYC profile not found' })
  updateKYC(
    @Param('id') id: string,
    @Body() updateKYCDto: UpdateKYCDto,
    @CurrentUser('id') verifiedBy: string,
  ) {
    return this.customersService.updateKYC(id, updateKYCDto, verifiedBy);
  }

  @Patch(':id/risk-profile')
  @Roles(UserRole.LOAN_OFFICER, UserRole.BRANCH_MANAGER, UserRole.COMPLIANCE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update customer risk profile' })
  @ApiResponse({ status: 200, description: 'Risk profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer or risk profile not found' })
  updateRiskProfile(
    @Param('id') id: string,
    @Body() updateRiskProfileDto: UpdateRiskProfileDto,
    @CurrentUser('id') assessedBy: string,
  ) {
    return this.customersService.updateRiskProfile(id, updateRiskProfileDto, assessedBy);
  }

  @Get(':id/history')
  @Roles(
    UserRole.LOAN_OFFICER,
    UserRole.BRANCH_MANAGER,
    UserRole.ADMIN,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get customer history (loans, documents)' })
  @ApiResponse({ status: 200, description: 'Customer history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  getHistory(@Param('id') id: string) {
    return this.customersService.getCustomerHistory(id);
  }
}
