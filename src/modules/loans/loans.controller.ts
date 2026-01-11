import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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
import { LoansService } from './loans.service';
import {
  CreateLoanDto,
  UpdateLoanDto,
  QueryLoansDto,
  SubmitLoanApplicationDto,
  CreateAppraisalDto,
  UpdateAppraisalDto,
} from './dto/loan.dto';
import {
  CreateApprovalDecisionDto,
  CreateDisbursementDto,
  VerifyDisbursementDto,
  CompleteDisbursementDto,
  CloseLoanDto,
} from './dto/approval-disbursement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, LoanStatus, LoanPurpose } from '@prisma/client';

@ApiTags('Loans')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @Roles(UserRole.LOAN_OFFICER, UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new loan application' })
  @ApiResponse({ status: 201, description: 'Loan created successfully' })
  @ApiResponse({ status: 403, description: 'KYC not complete' })
  create(
    @Body() createLoanDto: CreateLoanDto,
    @CurrentUser('id') createdBy: string,
  ) {
    return this.loansService.create(createLoanDto, createdBy);
  }

  @Get()
  @Roles(
    UserRole.LOAN_OFFICER,
    UserRole.BRANCH_MANAGER,
    UserRole.ADMIN,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
    UserRole.CEO,
  )
  @ApiOperation({ summary: 'Get all loans with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Loans retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: LoanStatus })
  @ApiQuery({ name: 'purpose', required: false, enum: LoanPurpose })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'loanOfficerId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  findAll(@Query() query: QueryLoansDto) {
    return this.loansService.findAll(query);
  }

  @Get(':id')
  @Roles(
    UserRole.LOAN_OFFICER,
    UserRole.BRANCH_MANAGER,
    UserRole.ADMIN,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get loan by ID with full details' })
  @ApiResponse({ status: 200, description: 'Loan retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.LOAN_OFFICER, UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update loan (only in DRAFT status)' })
  @ApiResponse({ status: 200, description: 'Loan updated successfully' })
  @ApiResponse({ status: 403, description: 'Can only update loans in DRAFT status' })
  update(@Param('id') id: string, @Body() updateLoanDto: UpdateLoanDto) {
    return this.loansService.update(id, updateLoanDto);
  }

  @Post(':id/submit')
  @Roles(UserRole.LOAN_OFFICER, UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit loan application for appraisal' })
  @ApiResponse({ status: 200, description: 'Loan application submitted' })
  @ApiResponse({ status: 403, description: 'KYC not complete or invalid status' })
  submitApplication(@Param('id') id: string, @Body() _dto: SubmitLoanApplicationDto) {
    return this.loansService.submitApplication(id);
  }

  // ===== APPRAISAL ENDPOINTS =====

  @Post(':id/appraisal')
  @Roles(UserRole.LOAN_OFFICER, UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create loan appraisal' })
  @ApiResponse({ status: 201, description: 'Appraisal created successfully' })
  @ApiResponse({ status: 403, description: 'Loan not in correct status' })
  createAppraisal(
    @Param('id') id: string,
    @Body() createAppraisalDto: CreateAppraisalDto,
    @CurrentUser('id') appraisedBy: string,
  ) {
    return this.loansService.createAppraisal(id, createAppraisalDto, appraisedBy);
  }

  @Patch(':id/appraisal')
  @Roles(UserRole.LOAN_OFFICER, UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update loan appraisal' })
  @ApiResponse({ status: 200, description: 'Appraisal updated successfully' })
  @ApiResponse({ status: 404, description: 'Appraisal not found' })
  updateAppraisal(@Param('id') id: string, @Body() updateAppraisalDto: UpdateAppraisalDto) {
    return this.loansService.updateAppraisal(id, updateAppraisalDto);
  }

  @Post(':id/appraisal/complete')
  @Roles(UserRole.LOAN_OFFICER, UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete loan appraisal and move to approval' })
  @ApiResponse({ status: 200, description: 'Appraisal completed successfully' })
  @ApiResponse({ status: 403, description: 'Missing required appraisal fields' })
  completeAppraisal(@Param('id') id: string, @CurrentUser('id') appraisedBy: string) {
    return this.loansService.completeAppraisal(id, appraisedBy);
  }

  // ===== APPROVAL ENDPOINTS =====

  @Post(':id/approval')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.ADMIN, UserRole.CEO)
  @ApiOperation({ summary: 'Create approval decision' })
  @ApiResponse({ status: 201, description: 'Approval decision created' })
  @ApiResponse({ status: 403, description: 'Appraisal not completed' })
  createApprovalDecision(
    @Param('id') id: string,
    @Body() createApprovalDto: CreateApprovalDecisionDto,
    @CurrentUser('id') approvedBy: string,
  ) {
    return this.loansService.createApprovalDecision(id, createApprovalDto, approvedBy);
  }

  // ===== DISBURSEMENT ENDPOINTS =====

  @Post(':id/disbursement')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create loan disbursement' })
  @ApiResponse({ status: 201, description: 'Disbursement created successfully' })
  @ApiResponse({ status: 403, description: 'Loan not approved or conditions not met' })
  createDisbursement(
    @Param('id') id: string,
    @Body() createDisbursementDto: CreateDisbursementDto,
  ) {
    return this.loansService.createDisbursement(id, createDisbursementDto);
  }

  @Post(':id/disbursement/verify')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.COMPLIANCE, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify disbursement documents and details' })
  @ApiResponse({ status: 200, description: 'Disbursement verified successfully' })
  verifyDisbursement(
    @Param('id') id: string,
    @Body() _dto: VerifyDisbursementDto,
    @CurrentUser('id') verifiedBy: string,
  ) {
    return this.loansService.verifyDisbursement(id, verifiedBy);
  }

  @Post(':id/disbursement/complete')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete loan disbursement and activate loan' })
  @ApiResponse({ status: 200, description: 'Disbursement completed, loan activated' })
  @ApiResponse({ status: 403, description: 'Disbursement not verified' })
  completeDisbursement(
    @Param('id') id: string,
    @Body() dto: CompleteDisbursementDto,
    @CurrentUser('id') disbursedBy: string,
  ) {
    return this.loansService.completeDisbursement(id, disbursedBy, dto.referenceNumber);
  }

  // ===== CLOSURE ENDPOINT =====

  @Post(':id/close')
  @Roles(UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close loan with final rating' })
  @ApiResponse({ status: 200, description: 'Loan closed successfully' })
  @ApiResponse({ status: 403, description: 'Loan not in closeable status' })
  closeLoan(@Param('id') id: string, @Body() closeLoanDto: CloseLoanDto) {
    return this.loansService.closeLoan(id, closeLoanDto);
  }
}
