import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsObject,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ProductType, ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({
    description: 'Code unique du produit',
    example: 'SAV-001',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le code du produit est requis' })
  @Matches(/^[A-Z]+-\d{3}$/, {
    message: 'Le code doit être au format XXX-001 (ex: SAV-001)',
  })
  code: string;

  @ApiProperty({
    description: 'Nom du produit',
    example: 'Compte Épargne Standard',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom du produit est requis' })
  name: string;

  @ApiProperty({
    description: 'Type de produit',
    enum: ProductType,
    example: ProductType.SAVINGS,
  })
  @IsEnum(ProductType, {
    message: 'Le type doit être SAVINGS, CURRENT ou LOAN',
  })
  type: ProductType;

  @ApiPropertyOptional({
    description: 'Description du produit',
    example: 'Compte d\'épargne classique avec intérêts mensuels',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Solde minimum requis en FCFA',
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le solde minimum doit être un nombre' })
  @Min(0, { message: 'Le solde minimum doit être positif' })
  @Type(() => Number)
  minimumBalance?: number;

  @ApiPropertyOptional({
    description: 'Solde maximum autorisé en FCFA',
    example: 10000000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le solde maximum doit être un nombre' })
  @Min(0, { message: 'Le solde maximum doit être positif' })
  @Type(() => Number)
  maximumBalance?: number | null;

  @ApiPropertyOptional({
    description: 'Taux d\'intérêt annuel (%)',
    example: 2.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le taux d\'intérêt doit être un nombre' })
  @Min(0, { message: 'Le taux d\'intérêt doit être positif' })
  @Max(100, { message: 'Le taux d\'intérêt ne peut pas dépasser 100%' })
  @Type(() => Number)
  interestRate?: number;

  @ApiPropertyOptional({
    description: 'Devise du produit',
    example: 'XAF',
    default: 'XAF',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message: 'La devise doit être un code ISO à 3 lettres (ex: XAF)',
  })
  currency?: string | null;

  @ApiPropertyOptional({
    description: 'Nécessite une approbation manuelle',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  requiresApproval?: boolean;

  @ApiPropertyOptional({
    description: 'Activation automatique à la création',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  autoActivate?: boolean;

  @ApiPropertyOptional({
    description: 'Autoriser plusieurs comptes de ce type par client',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  allowMultiple?: boolean;

  @ApiPropertyOptional({
    description: 'Fonctionnalités et paramètres additionnels',
    example: {
      minimumDeposit: 1000,
      monthlyFee: 0,
      withdrawalLimit: 100000,
    },
  })
  @IsOptional()
  @IsObject()
  features?: Record<string, any>;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({
    description: 'Statut du produit',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus, {
    message: 'Le statut doit être ACTIVE, INACTIVE ou DISCONTINUED',
  })
  status?: ProductStatus;
}


export class ProductQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrer par type de produit',
    enum: ProductType,
    example: ProductType.SAVINGS,
  })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Page pour la pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;
}

export class ProductResponseDto {
  @ApiProperty({ description: 'ID du produit' })
  id: string;

  @ApiProperty({ description: 'Code du produit' })
  code: string;

  @ApiProperty({ description: 'Nom du produit' })
  name: string;

  @ApiProperty({ description: 'Type de produit', enum: ProductType })
  type: ProductType;

  @ApiProperty({ description: 'Description du produit', required: false, nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Solde minimum' })
  minimumBalance: number;

  @ApiProperty({ description: 'Solde maximum', required: false, nullable: true })
  maximumBalance: number | null;

  @ApiProperty({ description: 'Taux d\'intérêt annuel' })
  interestRate: number;

  @ApiProperty({ description: 'Devise' })
  currency: string;

  @ApiProperty({ description: 'Nécessite approbation' })
  requiresApproval: boolean;

  @ApiProperty({ description: 'Activation automatique' })
  autoActivate: boolean;

  @ApiProperty({ description: 'Multiples autorisés' })
  allowMultiple: boolean;

  @ApiProperty({ description: 'Statut du produit', enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty({ description: 'Fonctionnalités', required: false, nullable: true })
  features: Record<string, any> | null;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;
}

export class ProductStatsDto {
  @ApiProperty({ description: 'Nombre total de comptes actifs' })
  totalAccounts: number;

  @ApiProperty({ description: 'Solde total en FCFA' })
  totalBalance: number;

  @ApiProperty({ description: 'Montant moyen par compte' })
  averageBalance: number;

  @ApiProperty({ description: 'Comptes créés ce mois' })
  accountsThisMonth: number;
}
