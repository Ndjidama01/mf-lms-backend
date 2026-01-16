import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountService } from '../services/account.service';
import {
  CreateAccountDto,
  UpdateAccountStatusDto,
  AccountQueryDto,
  AccountResponseDto,
  AccountHistoryResponseDto,
} from '../dto/account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Comptes')
@ApiBearerAuth()
@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * Créer un nouveau compte
   * POST /accounts
   */
  @Post()
  @Roles('CEO', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau compte bancaire' })
  @ApiResponse({
    status: 201,
    description: 'Compte créé avec succès',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides ou client non éligible' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Permission refusée' })
  async createAccount(
    @Body() dto: CreateAccountDto,
    @Request() req,
  ): Promise<AccountResponseDto> {
    // Ajouter l'ID de l'agent qui crée le compte
    dto.openedBy = req.user.userId;

    return this.accountService.createAccount(dto);
  }

  /**
   * Récupérer un compte par ID
   * GET /api/v1/accounts/:id
   */
  @Get(':id')
  @Roles('CEO', 'ADMIN')
  @ApiOperation({ summary: 'Récupérer un compte par ID' })
  @ApiResponse({
    status: 200,
    description: 'Compte trouvé',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte introuvable' })
  async getAccount(@Param('id') id: string): Promise<AccountResponseDto> {
    return this.accountService.getAccount(id);
  }

  /**
   * Récupérer un compte par numéro
   * GET /api/v1/accounts/number/:accountNumber
   */
  @Get('number/:accountNumber')
  @Roles('CEO', 'ADMIN')
  @ApiOperation({ summary: 'Récupérer un compte par numéro' })
  @ApiResponse({
    status: 200,
    description: 'Compte trouvé',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte introuvable' })
  async getAccountByNumber(
    @Param('accountNumber') accountNumber: string,
  ): Promise<AccountResponseDto> {
    return this.accountService.getAccountByNumber(accountNumber);
  }

  /**
   * Récupérer tous les comptes d'un client
   * GET /api/v1/accounts/customer/:customerId
   */
  @Get('customer/:customerId')
  @Roles('CEO', 'ADMIN')
  @ApiOperation({ summary: 'Récupérer tous les comptes d\'un client' })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes',
    type: [AccountResponseDto],
  })
  async getCustomerAccounts(
    @Param('customerId') customerId: string,
    @Query() query: AccountQueryDto,
  ): Promise<AccountResponseDto[]> {
    return this.accountService.getCustomerAccounts(customerId, query);
  }

  /**
   * Activer un compte
   * PATCH /api/v1/accounts/:id/activate
   */
  @Patch(':id/activate')
  @Roles('CEO', 'ADMIN')
  @ApiOperation({ summary: 'Activer un compte en attente' })
  @ApiResponse({
    status: 200,
    description: 'Compte activé avec succès',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Impossible d\'activer le compte' })
  @ApiResponse({ status: 404, description: 'Compte introuvable' })
  async activateAccount(
    @Param('id') id: string,
    @Request() req,
  ): Promise<AccountResponseDto> {
    return this.accountService.activateAccount(id, req.user.userId);
  }

  /**
   * Suspendre un compte
   * PATCH /api/v1/accounts/:id/suspend
   */
  @Patch(':id/suspend')
  @Roles('CEO', 'ADMIN')
  @ApiOperation({ summary: 'Suspendre un compte actif' })
  @ApiResponse({ status: 200, description: 'Compte suspendu avec succès' })
  @ApiResponse({ status: 400, description: 'Impossible de suspendre le compte' })
  @ApiResponse({ status: 404, description: 'Compte introuvable' })
  async suspendAccount(
    @Param('id') id: string,
    @Body() dto: UpdateAccountStatusDto,
    @Request() req,
  ) {
    await this.accountService.suspendAccount(id, dto.reason, req.user.userId);
    return { message: 'Compte suspendu avec succès' };
  }

  /**
   * Réactiver un compte suspendu
   * PATCH /api/v1/accounts/:id/reactivate
   */
  @Patch(':id/reactivate')
  @Roles('CEO', 'ADMIN')
  @ApiOperation({ summary: 'Réactiver un compte suspendu' })
  @ApiResponse({ status: 200, description: 'Compte réactivé avec succès' })
  @ApiResponse({ status: 400, description: 'Impossible de réactiver le compte' })
  @ApiResponse({ status: 404, description: 'Compte introuvable' })
  async reactivateAccount(@Param('id') id: string, @Request() req) {
    await this.accountService.reactivateAccount(id, req.user.userId);
    return { message: 'Compte réactivé avec succès' };
  }

  /**
   * Fermer un compte
   * PATCH /api/v1/accounts/:id/close
   */
  @Patch(':id/close')
  @Roles('CEO', 'ADMIN')
  @ApiOperation({ summary: 'Fermer un compte définitivement' })
  @ApiResponse({ status: 200, description: 'Compte fermé avec succès' })
  @ApiResponse({ status: 400, description: 'Impossible de fermer le compte (solde non nul)' })
  @ApiResponse({ status: 404, description: 'Compte introuvable' })
  async closeAccount(
    @Param('id') id: string,
    @Body() dto: UpdateAccountStatusDto,
    @Request() req,
  ) {
    await this.accountService.closeAccount(id, dto.reason, req.user.userId);
    return { message: 'Compte fermé avec succès' };
  }

  /**
   * Récupérer l'historique d'un compte
   * GET /api/v1/accounts/:id/history
   */
  @Get(':id/history')
  @Roles('CEO', 'ADMIN')
  @ApiOperation({ summary: 'Récupérer l\'historique complet d\'un compte' })
  @ApiResponse({
    status: 200,
    description: 'Historique du compte',
    type: [AccountHistoryResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Compte introuvable' })
  async getAccountHistory(@Param('id') id: string): Promise<AccountHistoryResponseDto[]> {
    return this.accountService.getAccountHistory(id);
  }
}
