import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  IsObject,
  IsUUID,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({
    description: 'ID du client',
    example: 'CUST-123456789',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le customerId est requis' })
  customerId: string;

  @ApiProperty({
    description: 'ID du produit financier',
    example: 'uuid-product-savings',
  })
  @IsUUID('4', { message: 'Le productId doit être un UUID valide' })
  @IsNotEmpty({ message: 'Le productId est requis' })
  productId: string;

  @ApiProperty({
    description: 'Code de l\'agence',
    example: '001',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le branchCode est requis' })
  @Matches(/^[A-Z0-9]{3,10}$/, {
    message: 'Le branchCode doit contenir 3-10 caractères alphanumériques majuscules',
  })
  branchCode: string;

  @ApiPropertyOptional({
    description: 'Dépôt initial en FCFA',
    example: 10000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le dépôt initial doit être un nombre' })
  @Min(0, { message: 'Le dépôt initial doit être positif' })
  @Type(() => Number)
  initialDeposit?: number;

  @ApiPropertyOptional({
    description: 'Motif ou objectif du compte',
    example: 'Épargne mensuelle',
  })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({
    description: 'Métadonnées additionnelles',
    example: { referredBy: 'AGT-001' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'ID de l\'agent qui crée le compte (automatiquement rempli)',
  })
  @IsOptional()
  @IsString()
  openedBy?: string;
}

export class UpdateAccountStatusDto {
  @ApiProperty({
    description: 'Raison du changement de statut',
    example: 'Suspicion de fraude',
  })
  @IsString()
  @IsNotEmpty({ message: 'La raison est requise' })
  reason: string;
}

export class AccountQueryDto {
  @ApiPropertyOptional({
    description: 'Page pour la pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
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
  @IsPositive()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    example: 'ACTIVE',
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par type de produit',
    example: 'SAVINGS',
    enum: ['SAVINGS', 'CURRENT', 'LOAN'],
  })
  @IsOptional()
  @IsString()
  productType?: string;
}

export class AccountResponseDto {
  @ApiProperty({ description: 'ID du compte' })
  id: string;

  @ApiProperty({ description: 'Numéro de compte', example: 'MF-001-00001245' })
  accountNumber: string;

  @ApiProperty({ description: 'ID du client' })
  customerId: string;

  @ApiProperty({ description: 'Nom du client' })
  customerName: string;

  @ApiProperty({ description: 'ID du produit' })
  productId: string;

  @ApiProperty({ description: 'Nom du produit' })
  productName: string;

  @ApiProperty({ description: 'Type de produit' })
  productType: string;

  @ApiProperty({ description: 'Solde du compte en FCFA' })
  balance: number;

  @ApiProperty({ description: 'Statut du compte' })
  status: string;

  @ApiProperty({ description: 'Devise' })
  currency: string;

  @ApiProperty({ description: 'Code de l\'agence' })
  branchCode: string;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;
}

export class AccountHistoryResponseDto {
  @ApiProperty({ description: 'ID de l\'historique' })
  id: string;

  @ApiProperty({ description: 'ID du compte' })
  accountId: string;

  @ApiProperty({ description: 'Action effectuée' })
  action: string;

  @ApiPropertyOptional({ description: 'Description de l\'action' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'ID de l\'utilisateur' })
  performedBy?: string | null;

  @ApiProperty({ description: 'Ancienne valeur' })
  oldValue: any;

  @ApiProperty({ description: 'Nouvelle valeur' })
  newValue: any;

  @ApiProperty({ description: 'Date de l\'action' })
  createdAt: Date;
}

