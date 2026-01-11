import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsArray,
} from 'class-validator';
import {
  LoanStatus,
  LoanPurpose,
  InterestRateType,
  RepaymentFrequency,
  AppraisalStatus,
  ApprovalLevel,
  ApprovalDecisionType,
  DisbursementMethod,
} from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateLoanDto {
  @ApiProperty({ example: 'customer-uuid' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'Micro Business Loan' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({ enum: LoanPurpose, example: LoanPurpose.AGRICULTURE })
  @IsEnum(LoanPurpose)
  @IsNotEmpty()
  purpose: LoanPurpose;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(100)
  @IsNotEmpty()
  @Type(() => Number)
  requestedAmount: number;

  @ApiProperty({ example: 15.5, description: 'Interest rate in percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  @Type(() => Number)
  interestRate: number;

  @ApiProperty({ enum: InterestRateType, example: InterestRateType.REDUCING_BALANCE })
  @IsEnum(InterestRateType)
  @IsNotEmpty()
  interestRateType: InterestRateType;

  @ApiProperty({ example: 12, description: 'Loan tenure in months' })
  @IsNumber()
  @Min(1)
  @Max(60)
  @IsNotEmpty()
  @Type(() => Number)
  tenure: number;

  @ApiProperty({ enum: RepaymentFrequency, example: RepaymentFrequency.MONTHLY })
  @IsEnum(RepaymentFrequency)
  @IsNotEmpty()
  repaymentFrequency: RepaymentFrequency;

  @ApiProperty({ example: 'loan-officer-uuid' })
  @IsString()
  @IsNotEmpty()
  loanOfficerId: string;

  @ApiProperty({ example: 'branch-uuid' })
  @IsString()
  @IsNotEmpty()
  branchId: string;
}

export class UpdateLoanDto {
  @ApiPropertyOptional({ example: 'Micro Business Loan' })
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional({ enum: LoanPurpose })
  @IsEnum(LoanPurpose)
  @IsOptional()
  purpose?: LoanPurpose;

  @ApiPropertyOptional({ example: 10000 })
  @IsNumber()
  @Min(100)
  @IsOptional()
  @Type(() => Number)
  requestedAmount?: number;

  @ApiPropertyOptional({ example: 15.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  interestRate?: number;

  @ApiPropertyOptional({ enum: InterestRateType })
  @IsEnum(InterestRateType)
  @IsOptional()
  interestRateType?: InterestRateType;

  @ApiPropertyOptional({ example: 12 })
  @IsNumber()
  @Min(1)
  @Max(60)
  @IsOptional()
  @Type(() => Number)
  tenure?: number;

  @ApiPropertyOptional({ enum: RepaymentFrequency })
  @IsEnum(RepaymentFrequency)
  @IsOptional()
  repaymentFrequency?: RepaymentFrequency;

  @ApiPropertyOptional({ example: 'loan-officer-uuid' })
  @IsString()
  @IsOptional()
  loanOfficerId?: string;

  @ApiPropertyOptional({ enum: LoanStatus })
  @IsEnum(LoanStatus)
  @IsOptional()
  status?: LoanStatus;
}

export class QueryLoansDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'search-term' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: LoanStatus })
  @IsEnum(LoanStatus)
  @IsOptional()
  status?: LoanStatus;

  @ApiPropertyOptional({ enum: LoanPurpose })
  @IsEnum(LoanPurpose)
  @IsOptional()
  purpose?: LoanPurpose;

  @ApiPropertyOptional({ example: 'customer-uuid' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 'loan-officer-uuid' })
  @IsString()
  @IsOptional()
  loanOfficerId?: string;

  @ApiPropertyOptional({ example: 'branch-uuid' })
  @IsString()
  @IsOptional()
  branchId?: string;
}

export class SubmitLoanApplicationDto {
  @ApiProperty({ example: true, description: 'Confirm loan submission' })
  @IsNotEmpty()
  confirm: boolean;
}

export class CreateAppraisalDto {
  @ApiPropertyOptional({ example: '2025-01-15', description: 'Site visit date' })
  @IsDateString()
  @IsOptional()
  siteVisitDate?: string;

  @ApiPropertyOptional({ example: 'Property is in good condition' })
  @IsString()
  @IsOptional()
  siteVisitNotes?: string;

  @ApiPropertyOptional({ example: ['photo1.jpg', 'photo2.jpg'] })
  @IsArray()
  @IsOptional()
  siteVisitPhotos?: string[];

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  monthlyIncome?: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  monthlyExpenses?: number;

  @ApiPropertyOptional({ example: 2000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  netCashFlow?: number;

  @ApiPropertyOptional({ example: 0.3 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  debtServiceRatio?: number;

  @ApiPropertyOptional({ example: 720 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  creditScore?: number;

  @ApiPropertyOptional({ example: 'Good credit history' })
  @IsString()
  @IsOptional()
  scoringNotes?: string;

  @ApiPropertyOptional({ example: 9500 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  recommendedAmount?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  recommendedTenure?: number;

  @ApiPropertyOptional({ example: 'Applicant demonstrates strong repayment capacity' })
  @IsString()
  @IsOptional()
  appraisalNotes?: string;

  @ApiPropertyOptional({ example: 'APPROVE', description: 'APPROVE, REJECT, CONDITIONAL' })
  @IsString()
  @IsOptional()
  recommendation?: string;
}

export class UpdateAppraisalDto extends CreateAppraisalDto {
  @ApiPropertyOptional({ enum: AppraisalStatus })
  @IsEnum(AppraisalStatus)
  @IsOptional()
  status?: AppraisalStatus;
}
