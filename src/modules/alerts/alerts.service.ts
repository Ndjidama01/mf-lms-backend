import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CreateAlertDto,
  UpdateAlertDto,
  AcknowledgeAlertDto,
  ResolveAlertDto,
  QueryAlertsDto,
  BulkAcknowledgeDto,
  EscalateAlertDto,
  CreateRiskIndicatorDto,
} from './dto/alert.dto';
import { AlertSeverity, AlertCategory } from '@prisma/client';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private prisma: PrismaService) {}

  async create(createAlertDto: CreateAlertDto) {
    const alert = await this.prisma.alert.create({
      data: {
        ...createAlertDto,
        status: 'ACTIVE',
        metadata: createAlertDto.metadata || {},
      },
      include: {
        customer: {
          select: {
            id: true,
            customerId: true,
            firstName: true,
            lastName: true,
          },
        },
        loan: {
          select: {
            id: true,
            loanId: true,
            productName: true,
          },
        },
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Alert created: ${alert.title} [${alert.severity}] - Category: ${alert.category}`,
    );

    // Create task if requires action
    if (createAlertDto.requiresAction) {
      await this.createTaskFromAlert(alert);
    }

    return alert;
  }

  async findAll(query: QueryAlertsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      severity,
      category,
      status,
      assignedToId,
      customerId,
      loanId,
      branchId,
      requiresAction,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (severity) where.severity = severity;
    if (category) where.category = category;
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (customerId) where.customerId = customerId;
    if (loanId) where.loanId = loanId;
    if (branchId) where.branchId = branchId;
    if (requiresAction !== undefined) where.requiresAction = requiresAction;

    const [alerts, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        include: {
          customer: {
            select: {
              id: true,
              customerId: true,
              firstName: true,
              lastName: true,
            },
          },
          loan: {
            select: {
              id: true,
              loanId: true,
              productName: true,
              status: true,
            },
          },
          branch: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.alert.count({ where }),
    ]);

    return {
      data: alerts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        customer: true,
        loan: true,
        branch: true,
        assignedTo: true,
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return alert;
  }

  async update(id: string, updateAlertDto: UpdateAlertDto) {
    await this.findOne(id);

    const alert = await this.prisma.alert.update({
      where: { id },
      data: updateAlertDto,
      include: {
        customer: true,
        loan: true,
        branch: true,
        assignedTo: true,
      },
    });

    this.logger.log(`Alert updated: ${alert.title}`);

    return alert;
  }

  async acknowledge(id: string, userId: string, acknowledgeDto: AcknowledgeAlertDto) {
    const alert = await this.findOne(id);

    if (alert.status !== 'ACTIVE') {
      throw new BadRequestException('Only active alerts can be acknowledged');
    }

    const updatedAlert = await this.prisma.alert.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
        resolutionNotes: acknowledgeDto.notes,
      },
      include: {
        customer: true,
        loan: true,
        assignedTo: true,
      },
    });

    this.logger.log(`Alert acknowledged: ${alert.title} by user ${userId}`);

    return updatedAlert;
  }

  async resolve(id: string, userId: string, resolveDto: ResolveAlertDto) {
    const alert = await this.findOne(id);

    if (alert.status === 'RESOLVED') {
      throw new BadRequestException('Alert is already resolved');
    }

    const updatedAlert = await this.prisma.alert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNotes: resolveDto.resolutionNotes,
      },
      include: {
        customer: true,
        loan: true,
        assignedTo: true,
      },
    });

    this.logger.log(`Alert resolved: ${alert.title} by user ${userId}`);

    return updatedAlert;
  }

  async dismiss(id: string, userId: string, reason: string) {
    const alert = await this.findOne(id);

    const updatedAlert = await this.prisma.alert.update({
      where: { id },
      data: {
        status: 'DISMISSED',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNotes: reason,
      },
    });

    this.logger.log(`Alert dismissed: ${alert.title} by user ${userId}`);

    return updatedAlert;
  }

  async escalate(id: string, escalateDto: EscalateAlertDto) {
    const alert = await this.findOne(id);

    // Increase severity
    let newSeverity = alert.severity;
    if (alert.severity === AlertSeverity.LOW) newSeverity = AlertSeverity.MEDIUM;
    else if (alert.severity === AlertSeverity.MEDIUM) newSeverity = AlertSeverity.HIGH;
    else if (alert.severity === AlertSeverity.HIGH) newSeverity = AlertSeverity.CRITICAL;

    const updatedAlert = await this.prisma.alert.update({
      where: { id },
      data: {
        severity: newSeverity,
        assignedToId: escalateDto.escalatedToId,
        status: 'ESCALATED',
        resolutionNotes: `Escalated: ${escalateDto.reason}`,
      },
      include: {
        assignedTo: true,
      },
    });

    this.logger.log(`Alert escalated: ${alert.title} to ${escalateDto.escalatedToId}`);

    return updatedAlert;
  }

  async bulkAcknowledge(userId: string, bulkDto: BulkAcknowledgeDto) {
    const result = await this.prisma.alert.updateMany({
      where: {
        id: { in: bulkDto.alertIds },
        status: 'ACTIVE',
      },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
        resolutionNotes: bulkDto.notes,
      },
    });

    this.logger.log(`Bulk acknowledged ${result.count} alerts by user ${userId}`);

    return {
      acknowledged: result.count,
      message: `${result.count} alerts acknowledged successfully`,
    };
  }

  async getStatistics(branchId?: string, userId?: string) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (userId) where.assignedToId = userId;

    const [
      total,
      bySeverity,
      byCategory,
      byStatus,
      activeCount,
      requiresActionCount,
    ] = await Promise.all([
      this.prisma.alert.count({ where }),
      this.prisma.alert.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),
      this.prisma.alert.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
      this.prisma.alert.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.alert.count({
        where: { ...where, status: 'ACTIVE' },
      }),
      this.prisma.alert.count({
        where: { ...where, requiresAction: true, status: 'ACTIVE' },
      }),
    ]);

    return {
      total,
      active: activeCount,
      requiresAction: requiresActionCount,
      bySeverity,
      byCategory,
      byStatus,
    };
  }

  // FR-10: Monitor key risk indicators (KRI)
  @Cron(CronExpression.EVERY_HOUR)
  async monitorRiskIndicators() {
    this.logger.log('Starting risk indicator monitoring...');

    await Promise.all([
      this.monitorPortfolioAtRisk(),
      this.monitorOverdueLoansByOfficer(),
      this.monitorBranchPerformance(),
      this.monitorCustomerRiskProfile(),
    ]);

    this.logger.log('Risk indicator monitoring completed');
  }

  // Monitor Portfolio at Risk (PAR)
  private async monitorPortfolioAtRisk() {
    const branches = await this.prisma.branch.findMany({
      where: { isActive: true },
    });

    for (const branch of branches) {
      const [totalLoans, overdueLoans] = await Promise.all([
        this.prisma.loan.count({
          where: {
            branchId: branch.id,
            status: { in: ['DISBURSED', 'ACTIVE', 'OVERDUE'] },
          },
        }),
        this.prisma.loan.count({
          where: {
            branchId: branch.id,
            status: 'OVERDUE',
          },
        }),
      ]);

      if (totalLoans > 0) {
        const par30 = (overdueLoans / totalLoans) * 100;

        // Warning threshold: 10%
        if (par30 > 10 && par30 <= 15) {
          await this.create({
            severity: AlertSeverity.MEDIUM,
            category: AlertCategory.CREDIT_RISK,
            title: `PAR30 Warning - ${branch.name}`,
            message: `Portfolio at Risk (30 days) is ${par30.toFixed(2)}%. Threshold: 10%`,
            branchId: branch.id,
            requiresAction: true,
            source: 'SYSTEM_MONITOR',
            metadata: { par30, threshold: 10, overdueLoans, totalLoans },
          });
        }

        // Critical threshold: 15%
        if (par30 > 15) {
          await this.create({
            severity: AlertSeverity.CRITICAL,
            category: AlertCategory.CREDIT_RISK,
            title: `PAR30 Critical - ${branch.name}`,
            message: `Portfolio at Risk (30 days) is ${par30.toFixed(2)}%. CRITICAL! Threshold: 15%`,
            branchId: branch.id,
            requiresAction: true,
            source: 'SYSTEM_MONITOR',
            metadata: { par30, threshold: 15, overdueLoans, totalLoans, blockNewLoans: true },
          });

          // FR-12: Block new loans when critical threshold exceeded
          await this.blockBranchNewLoans(branch.id, `PAR30 exceeds critical threshold: ${par30.toFixed(2)}%`);
        }
      }
    }
  }

  // Monitor overdue loans by loan officer
  private async monitorOverdueLoansByOfficer() {
    const officers = await this.prisma.user.findMany({
      where: {
        role: 'LOAN_OFFICER',
        status: 'ACTIVE',
      },
    });

    for (const officer of officers) {
      const overdueCount = await this.prisma.loan.count({
        where: {
          loanOfficerId: officer.id,
          status: 'OVERDUE',
        },
      });

      // More than 5 overdue loans
      if (overdueCount > 5 && overdueCount <= 10) {
        await this.create({
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.OPERATIONAL,
          title: `High Overdue Loans - ${officer.firstName} ${officer.lastName}`,
          message: `Loan Officer has ${overdueCount} overdue loans. Threshold: 5`,
          assignedToId: officer.id,
          requiresAction: true,
          source: 'SYSTEM_MONITOR',
          metadata: { overdueCount, threshold: 5 },
        });
      }

      // More than 10 overdue loans - critical
      if (overdueCount > 10) {
        await this.create({
          severity: AlertSeverity.HIGH,
          category: AlertCategory.OPERATIONAL,
          title: `Critical Overdue Loans - ${officer.firstName} ${officer.lastName}`,
          message: `Loan Officer has ${overdueCount} overdue loans. CRITICAL! Threshold: 10`,
          assignedToId: officer.id,
          requiresAction: true,
          source: 'SYSTEM_MONITOR',
          metadata: { overdueCount, threshold: 10, requiresSupervisorReview: true },
        });
      }
    }
  }

  // Monitor branch performance
  private async monitorBranchPerformance() {
    const branches = await this.prisma.branch.findMany({
      where: { isActive: true },
    });

    for (const branch of branches) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newLoansCount = await this.prisma.loan.count({
        where: {
          branchId: branch.id,
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      // Low disbursement warning (less than 10 loans in 30 days)
      if (newLoansCount < 10) {
        await this.create({
          severity: AlertSeverity.LOW,
          category: AlertCategory.PERFORMANCE,
          title: `Low Disbursement - ${branch.name}`,
          message: `Only ${newLoansCount} new loans in the last 30 days. Expected: 10+`,
          branchId: branch.id,
          requiresAction: false,
          source: 'SYSTEM_MONITOR',
          metadata: { newLoansCount, period: 30, threshold: 10 },
        });
      }
    }
  }

  // Monitor customer risk profiles
  private async monitorCustomerRiskProfile() {
    const highRiskCustomers = await this.prisma.customer.findMany({
      where: {
        riskProfile: {
          riskLevel: 'HIGH',
        },
        status: 'ACTIVE',
      },
      include: {
        loans: {
          where: {
            status: { in: ['DISBURSED', 'ACTIVE'] },
          },
        },
      },
    });

    for (const customer of highRiskCustomers) {
      if (customer.loans.length > 0) {
        await this.create({
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.CREDIT_RISK,
          title: `High Risk Customer - Active Loan`,
          message: `Customer ${customer.firstName} ${customer.lastName} has HIGH risk profile with ${customer.loans.length} active loan(s)`,
          customerId: customer.id,
          requiresAction: true,
          source: 'SYSTEM_MONITOR',
          metadata: {
            riskLevel: 'HIGH',
            activeLoans: customer.loans.length,
            recommendAction: 'Review and monitor closely',
          },
        });
      }
    }
  }

  // FR-12: Block new loans for branch
  private async blockBranchNewLoans(branchId: string, reason: string) {
    // This would integrate with the loans module to prevent new loans
    this.logger.warn(`BLOCKING new loans for branch ${branchId}: ${reason}`);
    
    // Create a high-priority task for branch manager
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        users: {
          where: { role: 'BRANCH_MANAGER', status: 'ACTIVE' },
        },
      },
    });

    if (branch && branch.users.length > 0) {
      await this.prisma.task.create({
        data: {
          type: 'URGENT_ACTION',
          title: 'NEW LOANS BLOCKED - Immediate Action Required',
          description: `New loan disbursements are blocked for ${branch.name}. Reason: ${reason}`,
          priority: 'URGENT',
          status: 'PENDING',
          dueDate: new Date(), // Due immediately
          assignedToId: branch.users[0].id,
          branchId: branch.id,
          metadata: { blockReason: reason, requiresResolution: true },
        },
      });
    }
  }

  // Create task from alert (FR-11)
  private async createTaskFromAlert(alert: any) {
    const dueDate = new Date();
    
    // Set due date based on severity
    switch (alert.severity) {
      case AlertSeverity.CRITICAL:
        dueDate.setHours(dueDate.getHours() + 4); // 4 hours
        break;
      case AlertSeverity.HIGH:
        dueDate.setHours(dueDate.getHours() + 24); // 1 day
        break;
      case AlertSeverity.MEDIUM:
        dueDate.setDate(dueDate.getDate() + 3); // 3 days
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 7); // 7 days
    }

    await this.prisma.task.create({
      data: {
        type: 'ALERT_RESPONSE',
        title: `Action Required: ${alert.title}`,
        description: alert.message,
        priority: alert.severity === AlertSeverity.CRITICAL ? 'URGENT' : 'HIGH',
        status: 'PENDING',
        dueDate,
        assignedToId: alert.assignedToId,
        branchId: alert.branchId,
        metadata: {
          alertId: alert.id,
          alertCategory: alert.category,
          autoGenerated: true,
        },
      },
    });

    this.logger.log(`Task created from alert: ${alert.title}`);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.alert.delete({
      where: { id },
    });

    this.logger.log(`Alert deleted: ${id}`);

    return { message: 'Alert deleted successfully' };
  }
}
