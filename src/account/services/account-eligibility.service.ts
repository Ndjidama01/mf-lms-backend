import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { KYCStatus, CustomerStatus } from '@prisma/client';

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

@Injectable()
export class AccountEligibilityService {
  private readonly logger = new Logger(AccountEligibilityService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Vérifier l'éligibilité d'un client à ouvrir un compte
   */
  async checkEligibility(
    customerId: string,
    productId: string,
  ): Promise<EligibilityResult> {
    const reasons: string[] = [];

    // 1. Vérifier l'existence du client
    const customer = await this.prisma.customer.findUnique({
      where: { customerId },
      include: { kycProfile: true },
    });

    if (!customer) {
      reasons.push('Client introuvable');
      return { eligible: false, reasons };
    }

    // 2. Vérifier le statut du client
    if (customer.status === CustomerStatus.BLACKLISTED) {
      reasons.push('Client sur liste noire');
    }

    if (customer.status === CustomerStatus.INACTIVE) {
      reasons.push('Compte client inactif');
    }

    if (customer.status !== CustomerStatus.ACTIVE) {
      reasons.push('Client doit être actif pour ouvrir un compte');
    }

    // 3. Vérifier le KYC
    if (!customer.kycProfile) {
      reasons.push('Profil KYC non renseigné');
    } else {
      if (customer.kycProfile.status === KYCStatus.PENDING) {
        reasons.push('KYC en attente de validation');
      }

      if (customer.kycProfile.status === KYCStatus.INCOMPLETE) {
        reasons.push('KYC incomplet');
      }

      if (customer.kycProfile.status === KYCStatus.INCOMPLETE) {
        reasons.push('KYC rejeté - veuillez le mettre à jour');
      }

      if (customer.kycProfile.status === KYCStatus.EXPIRED) {
        reasons.push('KYC expiré - veuillez le renouveler');
      }

      if (customer.kycProfile.status !== KYCStatus.COMPLETE) {
        reasons.push('KYC doit être approuvé');
      }

      // Vérifier la complétude du KYC
      if (customer.kycProfile.status === KYCStatus.COMPLETE) {
        const missingDocs = this.checkKycDocuments(customer.kycProfile);
        if (missingDocs.length > 0) {
          reasons.push(
            `Documents KYC manquants: ${missingDocs.join(', ')}`,
          );
        }
      }
    }

    // 4. Vérifier le produit
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      reasons.push('Produit introuvable');
      return { eligible: false, reasons };
    }

    if (product.status !== 'ACTIVE') {
      reasons.push('Ce produit n\'est plus disponible');
    }

    // 5. Vérifier si le client a déjà un compte de ce type (si non multiple)
    if (!product.allowMultiple) {
      const existingAccount = await this.prisma.account.findFirst({
        where: {
          customerId,
          productId,
          status: 'ACTIVE',
        },
      });

      if (existingAccount) {
        reasons.push(
          `Le client possède déjà un compte ${product.name} actif (${existingAccount.accountNumber})`,
        );
      }
    }

    // 6. Vérifier restrictions EWS (Early Warning System) - À implémenter
    // const ewsRestrictions = await this.checkEWSRestrictions(customerId);
    // if (ewsRestrictions.length > 0) {
    //   reasons.push(...ewsRestrictions);
    // }

    const eligible = reasons.length === 0;

    this.logger.log(
      `Eligibility check for customer ${customerId} - Product ${productId}: ${eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`,
    );

    if (!eligible) {
      this.logger.warn(`Eligibility reasons: ${reasons.join(', ')}`);
    }

    return { eligible, reasons };
  }

  /**
   * Vérifier les documents KYC requis
   */
  private checkKycDocuments(kycProfile: any): string[] {
    const missingDocs: string[] = [];

    if (!kycProfile.hasNationalId) {
      missingDocs.push('Pièce d\'identité');
    }

    if (!kycProfile.hasProofOfAddress) {
      missingDocs.push('Justificatif de domicile');
    }

    if (!kycProfile.hasPhotoProof) {
      missingDocs.push('Photo d\'identité');
    }

    if (!kycProfile.hasIncomeProof) {
      missingDocs.push('Justificatif de revenus');
    }

    return missingDocs;
  }

  /**
   * Vérifier les restrictions EWS (Early Warning System)
   * À implémenter selon les besoins métier
   */
  private async checkEWSRestrictions(customerId: string): Promise<string[]> {
    // TODO: Implémenter la vérification EWS
    // - Vérifier liste noire
    // - Vérifier dettes impayées
    // - Vérifier fraudes
    return [];
  }

  /**
   * Vérifier l'éligibilité et lever une exception si non éligible
   */
  async assertEligibility(
    customerId: string,
    productId: string,
  ): Promise<void> {
    const result = await this.checkEligibility(customerId, productId);

    if (!result.eligible) {
      throw new BadRequestException({
        message: 'Client non éligible pour ouvrir ce compte',
        reasons: result.reasons,
      });
    }
  }
}
