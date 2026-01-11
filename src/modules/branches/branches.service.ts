import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto, QueryBranchesDto } from './dto/branch.dto';

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    // Check if branch code already exists
    const existingBranch = await this.prisma.branch.findUnique({
      where: { code: createBranchDto.code },
    });

    if (existingBranch) {
      throw new ConflictException('Branch with this code already exists');
    }

    const branch = await this.prisma.branch.create({
      data: createBranchDto,
    });

    this.logger.log(`Branch created: ${branch.code} - ${branch.name}`);

    return branch;
  }

  async findAll(query: QueryBranchesDto) {
    const { page = 1, limit = 10, search, region, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (region) {
      where.region = region;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [branches, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              customers: true,
              loans: true,
            },
          },
        },
      }),
      this.prisma.branch.count({ where }),
    ]);

    return {
      data: branches,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
          },
        },
        _count: {
          select: {
            customers: true,
            loans: true,
            tasks: true,
            alerts: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    return branch;
  }

  async findByCode(code: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { code },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            loans: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with code ${code} not found`);
    }

    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    await this.findOne(id);

    // Check code uniqueness if being updated
    if (updateBranchDto.code) {
      const existingBranch = await this.prisma.branch.findFirst({
        where: {
          AND: [{ id: { not: id } }, { code: updateBranchDto.code }],
        },
      });

      if (existingBranch) {
        throw new ConflictException('Branch code already taken');
      }
    }

    const branch = await this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
    });

    this.logger.log(`Branch updated: ${branch.code} - ${branch.name}`);

    return branch;
  }

  async remove(id: string) {
    const branch = await this.findOne(id);

    // Check if branch has active users
    const activeUsers = await this.prisma.user.count({
      where: {
        branchId: id,
        status: 'ACTIVE',
      },
    });

    if (activeUsers > 0) {
      throw new BadRequestException(
        `Cannot delete branch with ${activeUsers} active users. Reassign or deactivate users first.`,
      );
    }

    // Check if branch has active loans
    const activeLoans = await this.prisma.loan.count({
      where: {
        branchId: id,
        status: { in: ['ACTIVE', 'DISBURSED', 'OVERDUE'] },
      },
    });

    if (activeLoans > 0) {
      throw new BadRequestException(
        `Cannot delete branch with ${activeLoans} active loans.`,
      );
    }

    // Soft delete by setting isActive to false
    await this.prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Branch deactivated: ${branch.code}`);

    return { message: 'Branch deactivated successfully' };
  }

  async getStatistics(id: string) {
    const branch = await this.findOne(id);

    const [
      totalUsers,
      activeUsers,
      totalCustomers,
      activeCustomers,
      totalLoans,
      activeLoans,
      totalDisbursed,
      portfolioAtRisk30,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { branchId: id },
      }),
      this.prisma.user.count({
        where: { branchId: id, status: 'ACTIVE' },
      }),
      this.prisma.customer.count({
        where: { branchId: id },
      }),
      this.prisma.customer.count({
        where: { branchId: id, status: 'ACTIVE' },
      }),
      this.prisma.loan.count({
        where: { branchId: id },
      }),
      this.prisma.loan.count({
        where: {
          branchId: id,
          status: { in: ['ACTIVE', 'DISBURSED', 'OVERDUE'] },
        },
      }),
      this.prisma.loan.aggregate({
        where: {
          branchId: id,
          status: { in: ['DISBURSED', 'ACTIVE', 'CLOSED'] },
        },
        _sum: {
          approvedAmount: true,
        },
      }),
      this.prisma.loan.count({
        where: {
          branchId: id,
          status: 'OVERDUE',
        },
      }),
    ]);

    return {
      branch: {
        id: branch.id,
        code: branch.code,
        name: branch.name,
        region: branch.region,
        isActive: branch.isActive,
      },
      statistics: {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        customers: {
          total: totalCustomers,
          active: activeCustomers,
        },
        loans: {
          total: totalLoans,
          active: activeLoans,
          totalDisbursed: totalDisbursed._sum.approvedAmount || 0,
          portfolioAtRisk30: portfolioAtRisk30,
        },
      },
    };
  }

  async getRegions() {
    const regions = await this.prisma.branch.findMany({
      where: { region: { not: null } },
      select: { region: true },
      distinct: ['region'],
    });

    return regions.map((r) => r.region).filter(Boolean);
  }
}
