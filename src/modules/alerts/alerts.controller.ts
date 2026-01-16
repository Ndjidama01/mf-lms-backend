import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import {
  CreateAlertDto,
  UpdateAlertDto,
  AcknowledgeAlertDto,
  ResolveAlertDto,
  QueryAlertsDto,
  BulkAcknowledgeDto,
  EscalateAlertDto,
} from './dto/alert.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Alerts')
@ApiBearerAuth('JWT-auth')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Create a new alert manually' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertsService.create(createAlertDto);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.BOARD,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get all alerts with filters' })
  @ApiResponse({ status: 200, description: 'List of alerts' })
  findAll(@Query() query: QueryAlertsDto) {
    return this.alertsService.findAll(query);
  }

  @Get('statistics')
  @Roles(
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.BOARD,
    UserRole.BRANCH_MANAGER,
    UserRole.COMPLIANCE,
  )
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiResponse({ status: 200, description: 'Alert statistics' })
  getStatistics(
    @Query('branchId') branchId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.alertsService.getStatistics(branchId, userId);
  }

  @Post('trigger-monitoring')
  @Roles(UserRole.ADMIN, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Manually trigger risk monitoring (normally runs every hour)' })
  @ApiResponse({ status: 200, description: 'Risk monitoring triggered' })
  async triggerMonitoring() {
    await this.alertsService.monitorRiskIndicators();
    return { message: 'Risk monitoring completed successfully' };
  }

  @Post('bulk-acknowledge')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Acknowledge multiple alerts at once' })
  @ApiResponse({ status: 200, description: 'Alerts acknowledged' })
  bulkAcknowledge(
    @CurrentUser() user: any,
    @Body() bulkDto: BulkAcknowledgeDto,
  ) {
    return this.alertsService.bulkAcknowledge(user.id, bulkDto);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.BOARD,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get alert by ID' })
  @ApiResponse({ status: 200, description: 'Alert details' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Update alert' })
  @ApiResponse({ status: 200, description: 'Alert updated successfully' })
  update(@Param('id') id: string, @Body() updateAlertDto: UpdateAlertDto) {
    return this.alertsService.update(id, updateAlertDto);
  }

  @Post(':id/acknowledge')
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.COMPLIANCE,
  )
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged' })
  acknowledge(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() acknowledgeDto: AcknowledgeAlertDto,
  ) {
    return this.alertsService.acknowledge(id, user.id, acknowledgeDto);
  }

  @Post(':id/resolve')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Resolve an alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  resolve(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() resolveDto: ResolveAlertDto,
  ) {
    return this.alertsService.resolve(id, user.id, resolveDto);
  }

  @Post(':id/dismiss')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Dismiss an alert' })
  @ApiResponse({ status: 200, description: 'Alert dismissed' })
  dismiss(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('reason') reason: string,
  ) {
    return this.alertsService.dismiss(id, user.id, reason);
  }

  @Post(':id/escalate')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Escalate an alert to higher authority' })
  @ApiResponse({ status: 200, description: 'Alert escalated' })
  escalate(@Param('id') id: string, @Body() escalateDto: EscalateAlertDto) {
    return this.alertsService.escalate(id, escalateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete alert' })
  @ApiResponse({ status: 200, description: 'Alert deleted successfully' })
  remove(@Param('id') id: string) {
    return this.alertsService.remove(id);
  }
}
