import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsUUID,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AlertSeverity, AlertCategory } from '@prisma/client';

export class CreateAlertDto {
  @ApiProperty({ enum: AlertSeverity, example: 'HIGH', description: 'Alert severity level' })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiProperty({ enum: AlertCategory, example: 'CREDIT_RISK', description: 'Alert category' })
  @IsEnum(AlertCategory)
  category: AlertCategory;

  @ApiProperty({ example: 'Portfolio at Risk 30 exceeded threshold', description: 'Alert title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'PAR30 is at 12%, threshold is 10%', description: 'Alert message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Related customer ID' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Related loan ID' })
  @IsUUID()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Related branch ID' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Assigned user ID' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ example: { par30: 12, threshold: 10 }, description: 'Alert metadata' })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ example: 'SYSTEM', description: 'Alert source' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ example: false, description: 'Requires action' })
  @IsBoolean()
  @IsOptional()
  requiresAction?: boolean;
}

export class UpdateAlertDto extends PartialType(CreateAlertDto) {
  @ApiPropertyOptional({ example: 'ACKNOWLEDGED', description: 'Alert status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'Investigating the issue', description: 'Resolution notes' })
  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}

export class AcknowledgeAlertDto {
  @ApiProperty({ example: 'Will investigate within 24 hours', description: 'Acknowledgement notes' })
  @IsString()
  notes: string;
}

export class ResolveAlertDto {
  @ApiProperty({ example: 'Issue resolved by contacting customer', description: 'Resolution notes' })
  @IsString()
  resolutionNotes: string;

  @ApiPropertyOptional({ example: 'RESOLVED', description: 'Resolution action' })
  @IsString()
  @IsOptional()
  action?: string;
}

export class QueryAlertsDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'risk', description: 'Search in title or message' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: AlertSeverity, description: 'Filter by severity' })
  @IsEnum(AlertSeverity)
  @IsOptional()
  severity?: AlertSeverity;

  @ApiPropertyOptional({ enum: AlertCategory, description: 'Filter by category' })
  @IsEnum(AlertCategory)
  @IsOptional()
  category?: AlertCategory;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Filter by status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by assigned user' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by customer' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by loan' })
  @IsUUID()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by branch' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter by requiresAction' })
  @IsBoolean()
  @IsOptional()
  requiresAction?: boolean;
}

export class BulkAcknowledgeDto {
  @ApiProperty({ example: ['uuid1', 'uuid2'], description: 'Array of alert IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  alertIds: string[];

  @ApiProperty({ example: 'Bulk acknowledged by supervisor', description: 'Acknowledgement notes' })
  @IsString()
  notes: string;
}

export class EscalateAlertDto {
  @ApiProperty({ example: 'uuid', description: 'User to escalate to' })
  @IsUUID()
  escalatedToId: string;

  @ApiProperty({ example: 'Escalating due to severity', description: 'Escalation reason' })
  @IsString()
  reason: string;
}

export class CreateRiskIndicatorDto {
  @ApiProperty({ example: 'PAR30', description: 'Indicator code' })
  @IsString()
  indicatorCode: string;

  @ApiProperty({ example: 'Portfolio at Risk 30 days', description: 'Indicator name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Percentage of loans overdue by 30+ days', description: 'Description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'PERCENTAGE', description: 'Value type' })
  @IsString()
  valueType: string;

  @ApiProperty({ example: 10, description: 'Warning threshold' })
  @IsNumber()
  warningThreshold: number;

  @ApiProperty({ example: 15, description: 'Critical threshold' })
  @IsNumber()
  criticalThreshold: number;

  @ApiProperty({ example: 'BRANCH', description: 'Monitoring level' })
  @IsString()
  monitoringLevel: string;

  @ApiPropertyOptional({ example: true, description: 'Auto-generate alerts' })
  @IsBoolean()
  @IsOptional()
  autoGenerateAlert?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Block new loans when critical' })
  @IsBoolean()
  @IsOptional()
  blockNewLoans?: boolean;
}
