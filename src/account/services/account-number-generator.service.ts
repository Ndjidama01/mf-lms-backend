import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountNumberGeneratorService {
  private readonly logger = new Logger(AccountNumberGeneratorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Génère un numéro de compte unique au format: MF-{BRANCH_CODE}-{SEQUENCE}
   * Ex: MF-001-00001245
   * 
   * Cette méthode est thread-safe et utilise une transaction pour éviter les doublons
   */
  async generateAccountNumber(
    branchCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prismaClient = tx || this.prisma;

    try {
      // Utiliser une transaction interactive pour verrouiller la séquence
      const result = await this.prisma.$transaction(
        async (prisma) => {
          // Trouver ou créer la séquence pour cette agence/année
          let sequence = await prisma.accountSequence.findUnique({
            where: {
              branchCode_year: {
                branchCode,
                year: currentYear,
              },
            },
          });

          if (!sequence) {
            // Créer une nouvelle séquence
            sequence = await prisma.accountSequence.create({
              data: {
                branchCode,
                year: currentYear,
                currentSequence: 1,
                lastSequence: 0,
              },
            });
          } else {
            // Incrémenter la séquence
            sequence = await prisma.accountSequence.update({
              where: {
                id: sequence.id,
              },
              data: {
                currentSequence: {
                  increment: 1,
                },
                lastSequence: sequence.currentSequence,
              },
            });
          }

          return sequence;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      // Formater le numéro de compte
      const sequenceStr = String(result.currentSequence).padStart(8, '0');
      const accountNumber = `MF-${branchCode}-${sequenceStr}`;

      this.logger.log(
        `Generated account number: ${accountNumber} for branch: ${branchCode}`,
      );

      return accountNumber;
    } catch (error) {
      this.logger.error(
        `Failed to generate account number for branch ${branchCode}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Valider le format d'un numéro de compte
   */
  validateAccountNumber(accountNumber: string): boolean {
    const pattern = /^MF-[A-Z0-9]{3,}-\d{8}$/;
    return pattern.test(accountNumber);
  }

  /**
   * Extraire le code agence d'un numéro de compte
   */
  extractBranchCode(accountNumber: string): string | null {
    const match = accountNumber.match(/^MF-([A-Z0-9]{3,})-\d{8}$/);
    return match ? match[1] : null;
  }

  /**
   * Obtenir la prochaine séquence disponible (sans l'incrémenter)
   */
  async getNextSequence(branchCode: string): Promise<number> {
    const currentYear = new Date().getFullYear();

    const sequence = await this.prisma.accountSequence.findUnique({
      where: {
        branchCode_year: {
          branchCode,
          year: currentYear,
        },
      },
    });

    return sequence ? sequence.currentSequence : 1;
  }

  /**
   * Réinitialiser la séquence pour une agence (Admin uniquement)
   */
  async resetSequence(branchCode: string, year?: number): Promise<void> {
    const targetYear = year || new Date().getFullYear();

    await this.prisma.accountSequence.upsert({
      where: {
        branchCode_year: {
          branchCode,
          year: targetYear,
        },
      },
      update: {
        currentSequence: 1,
        lastSequence: 0,
      },
      create: {
        branchCode,
        year: targetYear,
        currentSequence: 1,
        lastSequence: 0,
      },
    });

    this.logger.log(
      `Reset sequence for branch ${branchCode} - year ${targetYear}`,
    );
  }
}
