import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma, ProductType, ProductStatus } from '@prisma/client';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
} from '../dto/product.dto';


@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) { }

  /**
   * Créer un nouveau produit
   */
  async createProduct(dto: CreateProductDto): Promise<ProductResponseDto> {
    // Vérifier l'unicité du code
    const existing = await this.prisma.product.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(`Le code produit ${dto.code} existe déjà`);
    }

    const product = await this.prisma.product.create({
      data: {
        ...dto,
        currency: dto.currency || 'XAF',
        autoActivate: dto.autoActivate ?? true,
        allowMultiple: dto.allowMultiple ?? false,
      },
    });

    return this.mapToResponse(product);
  }

  /**
   * Mettre à jour un produit
   */

async updateProduct(
  id: string,
  dto: UpdateProductDto,
): Promise < ProductResponseDto > {
  const product = await this.prisma.product.findUnique({
    where: { id },
  });

  if(!product) {
    throw new NotFoundException('Produit introuvable');
  }

  const updated = await this.prisma.product.update({
    where: { id },
    data: {
      ...(dto.code !== undefined && { code: dto.code }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.status !== undefined && { status: dto.status }),

      ...(dto.description !== undefined && {
        description: dto.description,
      }),

      ...(dto.currency !== undefined && {
        currency: dto.currency ?? product.currency,
      }),

      ...(dto.minimumBalance !== undefined && {
        minimumBalance: dto.minimumBalance,
      }),

      ...(dto.maximumBalance !== undefined && {
        maximumBalance: dto.maximumBalance,
      }),

      ...(dto.interestRate !== undefined && {
        interestRate: dto.interestRate,
      }),

      ...(dto.requiresApproval !== undefined && {
        requiresApproval: dto.requiresApproval,
      }),

      ...(dto.autoActivate !== undefined && {
        autoActivate: dto.autoActivate,
      }),

      ...(dto.allowMultiple !== undefined && {
        allowMultiple: dto.allowMultiple,
      }),

      ...(dto.features !== undefined && {
        features:
          dto.features === null
            ? Prisma.JsonNull
            : dto.features,
      }),
    },
  });

  return this.mapToResponse(updated);
}


  /**
   * Récupérer un produit par ID
   */
  async getProduct(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }

    return this.mapToResponse(product);
  }

  /**
   * Récupérer un produit par code
   */
  async getProductByCode(code: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { code },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }

    return this.mapToResponse(product);
  }

  /**
   * Récupérer tous les produits actifs
   */
  async getActiveProducts(): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      orderBy: { name: 'asc' },
    });

    return products.map(p => this.mapToResponse(p));
  }

  /**
   * Récupérer les produits par type
   */
  async getProductsByType(type: ProductType): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        type,
        status: ProductStatus.ACTIVE,
      },
      orderBy: { name: 'asc' },
    });

    return products.map(p => this.mapToResponse(p));
  }

  /**
   * Désactiver un produit
   */
  async deactivateProduct(id: string): Promise<ProductResponseDto> {
    await this.getProduct(id); // Vérifier l'existence

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.INACTIVE },
    });

    return this.mapToResponse(updated);
  }

  /**
   * Activer un produit
   */
  async activateProduct(id: string): Promise<ProductResponseDto> {
    await this.getProduct(id); // Vérifier l'existence

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ACTIVE },
    });

    return this.mapToResponse(updated);
  }

  /**
   * Marquer un produit comme discontinué
   */
  async discontinueProduct(id: string): Promise<ProductResponseDto> {
    await this.getProduct(id); // Vérifier l'existence

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.DISCONTINUED },
    });

    return this.mapToResponse(updated);
  }

  /**
   * Initialiser les produits par défaut
   */
  async seedDefaultProducts(): Promise<void> {
    const defaultProducts = [
      {
        code: 'SAV-001',
        name: 'Compte Épargne Standard',
        type: ProductType.SAVINGS,
        description: 'Compte d\'épargne classique avec intérêts mensuels',
        minimumBalance: 5000,
        maximumBalance: 10000000,
        interestRate: 2.5,
        currency: 'XAF',
        autoActivate: true,
        allowMultiple: false,
        features: {
          minimumDeposit: 1000,
          monthlyFee: 0,
          withdrawalLimit: 100000,
        },
      },
      {
        code: 'CUR-001',
        name: 'Compte Courant Pro',
        type: ProductType.CURRENT,
        description: 'Compte courant pour professionnels',
        minimumBalance: 10000,
        maximumBalance: 50000000,
        interestRate: 0,
        currency: 'XAF',
        autoActivate: true,
        allowMultiple: true,
        features: {
          minimumDeposit: 10000,
          monthlyFee: 1000,
          withdrawalLimit: 500000,
        },
      },
      {
        code: 'LOAN-001',
        name: 'Prêt Personnel',
        type: ProductType.LOAN,
        description: 'Prêt personnel à taux fixe',
        minimumBalance: 0,
        maximumBalance: 5000000,
        interestRate: 12,
        currency: 'XAF',
        autoActivate: false,
        requiresApproval: true,
        allowMultiple: true,
        features: {
          maxDuration: 36, // mois
          processingFee: 2,
        },
      },
    ];

    for (const productData of defaultProducts) {
      const existing = await this.prisma.product.findUnique({
        where: { code: productData.code },
      });

      if (!existing) {
        await this.prisma.product.create({
          data: productData,
        });
      }
    }
  }

  /**
   * Mapper un produit Prisma vers ProductResponseDto
   */
  private mapToResponse(product: any): ProductResponseDto {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      type: product.type,
      description: product.description,
      minimumBalance: Number(product.minimumBalance),
      maximumBalance: product.maximumBalance ? Number(product.maximumBalance) : null,
      interestRate: Number(product.interestRate),
      currency: product.currency,
      requiresApproval: product.requiresApproval,
      autoActivate: product.autoActivate,
      allowMultiple: product.allowMultiple,
      status: product.status,
      features: product.features,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}