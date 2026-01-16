import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckEligibilityDto {
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
}

export class EligibilityResponseDto {
  @ApiProperty({
    description: 'Client éligible ou non',
    example: true,
  })
  eligible: boolean;

  @ApiProperty({
    description: 'Raisons de non-éligibilité (si applicable)',
    example: ['KYC non approuvé', 'Compte existant'],
    type: [String],
  })
  reasons: string[];

  @ApiProperty({
    description: 'Détails du client',
    required: false,
  })
  customerDetails?: {
    customerId: string;
    name: string;
    kycStatus: string;
    accountStatus: string;
  };

  @ApiProperty({
    description: 'Détails du produit',
    required: false,
  })
  productDetails?: {
    productId: string;
    productName: string;
    productType: string;
    allowMultiple: boolean;
  };
}
