import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsArray,
} from 'class-validator';
import {
  ApprovalLevel,
  ApprovalDecisionType,
  DisbursementMethod,
  DisbursementStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateApprovalDecisionDto {
  @ApiProperty({ enum: ApprovalLevel, example: ApprovalLevel.BRANCH_MANAGER })
  @IsEnum(ApprovalLevel)
  @IsNotEmpty()
  level: ApprovalLevel;

  @ApiProperty({ enum: ApprovalDecisionType, example: ApprovalDecisionType.APPROVED })
  @IsEnum(ApprovalDecisionType)
  @IsNotEmpty()
  decision: ApprovalDecisionType;

  @ApiPropertyOptional({ example: 9500 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  approvedAmount?: number;

  @ApiPropertyOptional({ example: ['Provide additional collateral', 'Monthly monitoring'] })
  @IsArray()
  @IsOptional()
  conditions?: string[];

  @ApiPropertyOptional({ example: 'Applicant meets all criteria' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'Committee discussed and approved unanimously' })
  @IsString()
  @IsOptional()
  minutes?: string;
}

export class CreateDisbursementDto {
  @ApiProperty({ example: 9500 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  amount: number;

  @ApiProperty({ enum: DisbursementMethod, example: DisbursementMethod.BANK_TRANSFER })
  @IsEnum(DisbursementMethod)
  @IsNotEmpty()
  method: DisbursementMethod;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  accountName?: string;

  @ApiPropertyOptional({ example: 'ABC Bank' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ example: 'REF123456' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: 'Disbursement notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateDisbursementDto {
  @ApiPropertyOptional({ enum: DisbursementStatus })
  @IsEnum(DisbursementStatus)
  @IsOptional()
  status?: DisbursementStatus;

  @ApiPropertyOptional({ example: 'REF123456' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: 'Disbursement notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class VerifyDisbursementDto {
  @ApiProperty({ example: true, description: 'Confirm disbursement verification' })
  @IsNotEmpty()
  verified: boolean;

  @ApiPropertyOptional({ example: 'All documents verified' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CompleteDisbursementDto {
  @ApiProperty({ example: true, description: 'Confirm disbursement completion' })
  @IsNotEmpty()
  confirm: boolean;

  @ApiPropertyOptional({ example: 'REF123456' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;
}

export class CloseLoanDto {
  @ApiProperty({ example: 'GOOD', description: 'Final loan rating: GOOD, FAIR, POOR' })
  @IsString()
  @IsNotEmpty()
  finalRating: string;

  @ApiPropertyOptional({ example: 'Loan closed successfully with full repayment' })
  @IsString()
  @IsOptional()
  closureNotes?: string;

  @ApiPropertyOptional({ example: ['All documents returned', 'No outstanding balance'] })
  @IsArray()
  @IsOptional()
  closureChecklist?: string[];
}
