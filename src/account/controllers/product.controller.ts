import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductResponseDto,
} from '../dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProductType } from '@prisma/client';

@ApiTags('Produits')
@ApiBearerAuth()
@Controller('api/v1/products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  /**
   * Créer un nouveau produit
   * POST /api/v1/products
   */
  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau produit financier (Admin uniquement)' })
  @ApiResponse({
    status: 201,
    description: 'Produit créé avec succès',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides ou code déjà existant' })
  @ApiResponse({ status: 403, description: 'Permission refusée' })
  async createProduct(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productService.createProduct(dto);
  }

  /**
   * Mettre à jour un produit
   * PATCH /api/v1/products/:id
   */
  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Mettre à jour un produit (Admin uniquement)' })
  @ApiResponse({
    status: 200,
    description: 'Produit mis à jour avec succès',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.updateProduct(id, dto);
  }

  /**
   * Récupérer un produit par ID
   * GET /api/v1/products/:id
   */
  @Get(':id')
  @Roles('CEO', 'ADMIN')
  @ApiOperation({ summary: 'Récupérer un produit par ID' })
  @ApiResponse({
    status: 200,
    description: 'Produit trouvé',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  async getProduct(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productService.getProduct(id);
  }

  /**
   * Récupérer un produit par code
   * GET /api/v1/products/code/:code
   */
  @Get('code/:code')
  @Roles('CEO', 'ADMIN')
  @ApiOperation({ summary: 'Récupérer un produit par code' })
  @ApiResponse({
    status: 200,
    description: 'Produit trouvé',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  async getProductByCode(@Param('code') code: string): Promise<ProductResponseDto> {
    return this.productService.getProductByCode(code);
  }

  /**
   * Récupérer tous les produits actifs
   * GET /api/v1/products
   */
  @Get()
  @Roles('CEO', 'ADMIN')
  @ApiOperation({ summary: 'Lister tous les produits actifs' })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits',
    type: [ProductResponseDto],
  })
  async getActiveProducts(@Query() query: ProductQueryDto): Promise<ProductResponseDto[]> {
    if (query.type) {
      return this.productService.getProductsByType(query.type);
    }
    return this.productService.getActiveProducts();
  }

  /**
   * Récupérer les produits par type
   * GET /api/v1/products/type/:type
   */
  @Get('type/:type')
  @Roles('CEO', 'ADMIN')
  @ApiOperation({ summary: 'Récupérer les produits par type (SAVINGS, CURRENT, LOAN)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits',
    type: [ProductResponseDto],
  })
  async getProductsByType(@Param('type') type: ProductType): Promise<ProductResponseDto[]> {
    return this.productService.getProductsByType(type);
  }

  /**
   * Désactiver un produit
   * PATCH /api/v1/products/:id/deactivate
   */
  @Patch(':id/deactivate')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Désactiver un produit (Admin uniquement)' })
  @ApiResponse({
    status: 200,
    description: 'Produit désactivé avec succès',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  async deactivateProduct(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productService.deactivateProduct(id);
  }

  /**
   * Activer un produit
   * PATCH /api/v1/products/:id/activate
   */
  @Patch(':id/activate')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Activer un produit (Admin uniquement)' })
  @ApiResponse({
    status: 200,
    description: 'Produit activé avec succès',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  async activateProduct(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productService.activateProduct(id);
  }

  /**
   * Marquer un produit comme discontinué
   * PATCH /api/v1/products/:id/discontinue
   */
  @Patch(':id/discontinue')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Discontinuer un produit (Admin uniquement)' })
  @ApiResponse({
    status: 200,
    description: 'Produit discontinué avec succès',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  async discontinueProduct(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productService.discontinueProduct(id);
  }

  /**
   * Initialiser les produits par défaut
   * POST /api/v1/products/seed
   */
  @Post('seed')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initialiser les produits par défaut (Admin uniquement)',
    description: 'Crée 3 produits par défaut: Épargne, Courant, Prêt',
  })
  @ApiResponse({ status: 200, description: 'Produits initialisés avec succès' })
  async seedDefaultProducts() {
    await this.productService.seedDefaultProducts();
    return {
      message: 'Produits par défaut créés avec succès',
      count: 3,
    };
  }
}
