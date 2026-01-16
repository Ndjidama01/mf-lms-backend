import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  IsDateString,
  IsNumber,
  IsObject,
} from 'class-validator';
import { CustomerType, CustomerStatus, RiskLevel, KYCStatus } from '@prisma/client';
import { Type } from 'class-transformer';


export class CreateCustomerDto {
  @ApiProperty({ enum: CustomerType, example: CustomerType.INDIVIDUAL })
  @IsEnum(CustomerType)
  @IsNotEmpty()
  type: CustomerType;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: 'Michael' })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Male' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: 'ID123456789' })
  @IsString()
  @IsOptional()
  nationalId?: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Manhattan' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ example: 'Farmer' })
  @IsString()
  @IsOptional()
  occupation?: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  monthlyIncome?: number;

  @ApiPropertyOptional({ example: 'ABC Farm' })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiPropertyOptional({ example: 'Agriculture' })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiProperty({ example: 'branch-uuid' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiPropertyOptional({
    example: { customField1: 'value1', customField2: 'value2' },
    description: 'NIU custom data',
  })
  @IsObject()
  @IsOptional()
  niuData?: any;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ enum: CustomerType })
  @IsEnum(CustomerType)
  @IsOptional()
  type?: CustomerType;

  @ApiPropertyOptional({ enum: CustomerStatus })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Michael' })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Male' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: 'ID123456789' })
  @IsString()
  @IsOptional()
  nationalId?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Manhattan' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ example: 'Farmer' })
  @IsString()
  @IsOptional()
  occupation?: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  monthlyIncome?: number;

  @ApiPropertyOptional({ example: 'ABC Farm' })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiPropertyOptional({ example: 'Agriculture' })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiPropertyOptional({ example: 'branch-uuid' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: { customField1: 'value1' } })
  @IsObject()
  @IsOptional()
  niuData?: any;
}

export class QueryCustomersDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'john' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: CustomerType })
  @IsEnum(CustomerType)
  @IsOptional()
  type?: CustomerType;

  @ApiPropertyOptional({ enum: CustomerStatus })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional({ example: 'branch-uuid' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ enum: RiskLevel })
  @IsEnum(RiskLevel)
  @IsOptional()
  riskLevel?: RiskLevel;
}

export class ConvertProspectDto {
  @ApiProperty({ example: true })
  @IsNotEmpty()
  confirm: boolean;
}

export class UpdateKYCDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  hasNationalId?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  hasProofOfAddress?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  hasPhotoProof?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  hasIncomeProof?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  hasBusinessDocs?: boolean;
}

export class UpdateRiskProfileDto {
  @ApiProperty({ enum: RiskLevel, example: RiskLevel.MEDIUM })
  @IsEnum(RiskLevel)
  @IsNotEmpty()
  riskLevel: RiskLevel;

  @ApiPropertyOptional({ example: 650 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  creditScore?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  delinquencyHistory?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  multipleBorrowing?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  politicalExposure?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  highRiskOccupation?: boolean;

  @ApiPropertyOptional({ example: 'Customer has good repayment history' })
  @IsString()
  @IsOptional()
  assessmentNotes?: string;
}
