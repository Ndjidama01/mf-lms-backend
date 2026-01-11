import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { DocumentType, DocumentStatus } from '@prisma/client';

export class CreateDocumentDto {
  @ApiProperty({ example: 'national_id.pdf', description: 'Original file name' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'application/pdf', description: 'MIME type' })
  @IsString()
  fileType: string;

  @ApiProperty({ example: 1024000, description: 'File size in bytes' })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ example: '/uploads/documents/abc123.pdf', description: 'File path on server' })
  @IsString()
  filePath: string;

  @ApiProperty({ enum: DocumentType, example: 'NATIONAL_ID', description: 'Document type' })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiPropertyOptional({ example: 'uuid', description: 'Customer ID' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Loan ID' })
  @IsUUID()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({ example: 'National ID card - front side', description: 'Document description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: ['kyc', 'identity'], description: 'Document tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: 'uuid', description: 'User who uploaded' })
  @IsUUID()
  uploadedBy: string;
}

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {
  @ApiPropertyOptional({ enum: DocumentStatus, example: 'VERIFIED', description: 'Document status' })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;
}

export class QueryDocumentsDto {
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

  @ApiPropertyOptional({ example: 'passport', description: 'Search by filename or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: DocumentType, description: 'Filter by document type' })
  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @ApiPropertyOptional({ enum: DocumentStatus, description: 'Filter by status' })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by customer ID' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by loan ID' })
  @IsUUID()
  @IsOptional()
  loanId?: string;
}

export class DocumentVersionDto {
  @ApiProperty({ example: 'national_id_v2.pdf', description: 'New version file name' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: '/uploads/documents/version2.pdf', description: 'File path' })
  @IsString()
  filePath: string;

  @ApiProperty({ example: 1024000, description: 'File size' })
  @IsNumber()
  fileSize: number;

  @ApiPropertyOptional({ example: 'Updated document with better quality', description: 'Version notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'uuid', description: 'User who uploaded version' })
  @IsUUID()
  uploadedBy: string;
}

export class LegalHoldDto {
  @ApiProperty({ example: true, description: 'Enable or disable legal hold' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ example: 'Litigation case #12345', description: 'Reason for legal hold' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkDownloadDto {
  @ApiProperty({ example: ['uuid1', 'uuid2'], description: 'Array of document IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds: string[];
}
