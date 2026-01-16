import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AccountStatus, AccountAction, Prisma } from '@prisma/client';
import { AccountNumberGeneratorService } from './account-number-generator.service';
import { AccountEligibilityService } from './account-eligibility.service';
import {
  CreateAccountDto,
  AccountResponseDto,
  AccountQueryDto,
} from '../dto/account.dto';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private prisma: PrismaService,
    private accountNumberGenerator: AccountNumberGeneratorService,
    private accountEligibility: AccountEligibilityService,
  ) {}

  /**
   * Créer un nouveau compte (Feature centrale)
   */
  async createAccount(dto: CreateAccountDto): Promise<AccountResponseDto> {
    this.logger.log(
      `Creating account for customer ${dto.customerId} - Product ${dto.productId}`,
    );

    // 1. Vérifier l'éligibilité
    await this.accountEligibility.assertEligibility(
      dto.customerId,
      dto.productId,
    );

    // 2. Récupérer le produit
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }

    // 3. Vérifier le dépôt initial
    if (product.features && typeof product.features === 'object') {
      const features = product.features as any;
      if (features.minimumDeposit && dto.initialDeposit) {
        if (dto.initialDeposit < features.minimumDeposit) {
          throw new BadRequestException(
            `Dépôt initial minimum requis: ${features.minimumDeposit} ${product.currency}`,
          );
        }
      }
    }

    // 4. Créer le compte dans une transaction
    const account = await this.prisma.$transaction(async (tx) => {
      // Générer le numéro de compte
      const accountNumber = await this.accountNumberGenerator.generateAccountNumber(
        dto.branchCode,
        tx as any,
      );

      // Créer le compte
      const newAccount = await tx.account.create({
        data: {
          accountNumber,
          customerId: dto.customerId,
          productId: dto.productId,
          balance: dto.initialDeposit || 0,
          availableBalance: dto.initialDeposit || 0,
          currency: product.currency,
          status: product.autoActivate
            ? AccountStatus.ACTIVE
            : AccountStatus.PENDING,
          branchCode: dto.branchCode,
          openedBy: dto.openedBy,
          metadata: dto.metadata
            ? {
                initialDeposit: dto.initialDeposit,
                purpose: dto.purpose,
                ...dto.metadata,
              }
            : {
                initialDeposit: dto.initialDeposit,
                purpose: dto.purpose,
              },
          activatedAt: product.autoActivate ? new Date() : null,
        },
        include: {
          product: true,
          customer: true,
        },
      });

      // Créer l'historique
      await tx.accountHistory.create({
        data: {
          accountId: newAccount.id,
          action: AccountAction.CREATED,
          description: `Compte créé avec numéro ${accountNumber}`,
          performedBy: dto.openedBy,
          newValue: {
            accountNumber,
            productId: dto.productId,
            initialDeposit: dto.initialDeposit,
          } as any,
        },
      });

      // Si activation automatique
      if (product.autoActivate) {
        await tx.accountHistory.create({
          data: {
            accountId: newAccount.id,
            action: AccountAction.ACTIVATED,
            description: 'Compte activé automatiquement',
            performedBy: dto.openedBy,
          },
        });
      }

      return newAccount;
    });

    this.logger.log(
      `Account created successfully: ${account.accountNumber} for customer ${dto.customerId}`,
    );

    return this.mapToResponse(account);
  }

  /**
   * Activer un compte
   */
  async activateAccount(
    accountId: string,
    activatedBy: string,
  ): Promise<AccountResponseDto> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { product: true, customer: true },
    });

    if (!account) {
      throw new NotFoundException('Compte introuvable');
    }

    if (account.status === AccountStatus.ACTIVE) {
      throw new BadRequestException('Le compte est déjà actif');
    }

    if (account.status === AccountStatus.CLOSED) {
      throw new BadRequestException('Impossible d\'activer un compte fermé');
    }

    // Transaction pour mise à jour + historique
    const updatedAccount = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.account.update({
        where: { id: accountId },
        data: {
          status: AccountStatus.ACTIVE,
          activatedAt: new Date(),
          approvedBy: activatedBy,
          approvedAt: new Date(),
        },
        include: { product: true, customer: true },
      });

      await tx.accountHistory.create({
        data: {
          accountId: account.id,
          action: AccountAction.ACTIVATED,
          description: 'Compte activé manuellement',
          performedBy: activatedBy,
          oldValue: { status: account.status } as any,
          newValue: { status: AccountStatus.ACTIVE } as any,
        },
      });

      return updated;
    });

    this.logger.log(
      `Account ${account.accountNumber} activated by ${activatedBy}`,
    );

    return this.mapToResponse(updatedAccount);
  }

  /**
   * Suspendre un compte
   */
  async suspendAccount(
    accountId: string,
    reason: string,
    suspendedBy: string,
  ): Promise<void> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Compte introuvable');
    }

    if (account.status === AccountStatus.CLOSED) {
      throw new BadRequestException('Le compte est déjà fermé');
    }

    const oldStatus = account.status;

    await this.prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: accountId },
        data: { status: AccountStatus.SUSPENDED },
      });

      await tx.accountHistory.create({
        data: {
          accountId: account.id,
          action: AccountAction.SUSPENDED,
          description: reason,
          performedBy: suspendedBy,
          oldValue: { status: oldStatus } as any,
          newValue: { status: AccountStatus.SUSPENDED } as any,
        },
      });
    });

    this.logger.warn(
      `Account ${account.accountNumber} suspended. Reason: ${reason}`,
    );
  }

  /**
   * Réactiver un compte suspendu
   */
  async reactivateAccount(
    accountId: string,
    reactivatedBy: string,
  ): Promise<void> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Compte introuvable');
    }

    if (account.status !== AccountStatus.SUSPENDED) {
      throw new BadRequestException(
        'Seul un compte suspendu peut être réactivé',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: accountId },
        data: { status: AccountStatus.ACTIVE },
      });

      await tx.accountHistory.create({
        data: {
          accountId: account.id,
          action: AccountAction.REACTIVATED,
          description: 'Compte réactivé',
          performedBy: reactivatedBy,
          oldValue: { status: AccountStatus.SUSPENDED } as any,
          newValue: { status: AccountStatus.ACTIVE } as any,
        },
      });
    });

    this.logger.log(`Account ${account.accountNumber} reactivated`);
  }

  /**
   * Fermer un compte
   */
  async closeAccount(
    accountId: string,
    reason: string,
    closedBy: string,
  ): Promise<void> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Compte introuvable');
    }

    if (account.status === AccountStatus.CLOSED) {
      throw new BadRequestException('Le compte est déjà fermé');
    }

    // Vérifier que le solde est à zéro
    if (Number(account.balance) > 0) {
      throw new BadRequestException(
        'Impossible de fermer un compte avec un solde positif',
      );
    }

    const oldStatus = account.status;

    await this.prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: accountId },
        data: {
          status: AccountStatus.CLOSED,
          closedAt: new Date(),
          closureReason: reason,
        },
      });

      await tx.accountHistory.create({
        data: {
          accountId: account.id,
          action: AccountAction.CLOSED,
          description: reason,
          performedBy: closedBy,
          oldValue: { status: oldStatus } as any,
          newValue: { status: AccountStatus.CLOSED } as any,
        },
      });
    });

    this.logger.log(
      `Account ${account.accountNumber} closed. Reason: ${reason}`,
    );
  }

  /**
   * Récupérer un compte par ID
   */
  async getAccount(accountId: string): Promise<AccountResponseDto> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { product: true, customer: true },
    });

    if (!account) {
      throw new NotFoundException('Compte introuvable');
    }

    return this.mapToResponse(account);
  }

  /**
   * Récupérer un compte par numéro
   */
  async getAccountByNumber(accountNumber: string): Promise<AccountResponseDto> {
    const account = await this.prisma.account.findUnique({
      where: { accountNumber },
      include: { product: true, customer: true },
    });

    if (!account) {
      throw new NotFoundException('Compte introuvable');
    }

    return this.mapToResponse(account);
  }

  /**
   * Récupérer tous les comptes d'un client
   */
  async getCustomerAccounts(
    customerId: string,
    query?: AccountQueryDto,
  ): Promise<AccountResponseDto[]> {
    const accounts = await this.prisma.account.findMany({
      where: { customerId },
      include: { product: true, customer: true },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((account) => this.mapToResponse(account));
  }

  /**
   * Récupérer l'historique d'un compte
   */
  async getAccountHistory(accountId: string) {
    return this.prisma.accountHistory.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mapper un compte vers la réponse API
   */
  private mapToResponse(account: any): AccountResponseDto {
    return {
      id: account.id,
      accountNumber: account.accountNumber,
      customerId: account.customerId,
      customerName: account.customer
        ? `${account.customer.firstName} ${account.customer.lastName}`
        : 'N/A',
      productId: account.productId,
      productName: account.product.name,
      productType: account.product.type,
      balance: Number(account.balance),
      status: account.status,
      currency: account.currency,
      branchCode: account.branchCode,
      createdAt: account.createdAt,
    };
  }
}
