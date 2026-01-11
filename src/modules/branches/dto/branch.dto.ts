import { IsString, IsEmail, IsBoolean, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ example: 'BR03', description: 'Unique branch code' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Central Branch', description: 'Branch name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '123 Main Street, Yaoundé', description: 'Branch address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '+237222000000', description: 'Branch phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'branch@mflms.com', description: 'Branch email' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Centre', description: 'Region name' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ example: true, description: 'Is branch active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {}

export class QueryBranchesDto {
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

  @ApiPropertyOptional({ example: 'Central', description: 'Search by name, code, or region' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'Centre', description: 'Filter by region' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
