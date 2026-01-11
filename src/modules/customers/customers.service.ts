import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  QueryCustomersDto,
  UpdateKYCDto,
  UpdateRiskProfileDto,
} from './dto/customer.dto';
import { CustomerStatus, KYCStatus, RiskLevel } from '@prisma/client';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto, createdBy: string) {
    // Verify branch exists
    const branch = await this.prisma.branch.findUnique({
      where: { id: createCustomerDto.branchId },
    });

    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    // Check if customer with same national ID already exists
    if (createCustomerDto.nationalId) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: { nationalId: createCustomerDto.nationalId },
      });

      if (existingCustomer) {
        throw new ConflictException('Customer with this national ID already exists');
      }
    }

    // Generate customer ID
    const customerId = await this.generateCustomerId(createCustomerDto.branchId);

    // Create customer
    const customer = await this.prisma.customer.create({
      data: {
        ...createCustomerDto,
        customerId,
        status: CustomerStatus.PROSPECT,
        createdBy,
      },
      include: {
        branch: true,
      },
    });

    // Create KYC profile
    await this.prisma.kYCProfile.create({
      data: {
        customerId: customer.id,
        status: KYCStatus.PENDING,
      },
    });

    // Create risk profile
    await this.prisma.riskProfile.create({
      data: {
        customerId: customer.id,
        riskLevel: RiskLevel.MEDIUM,
      },
    });

    this.logger.log(`Customer created: ${customer.customerId} by ${createdBy}`);

    return this.findOne(customer.id);
  }

  async findAll(query: QueryCustomersDto) {
    const { page = 1, limit = 10, search, type, status, branchId, riskLevel } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { customerId: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (riskLevel) {
      where.riskProfile = {
        riskLevel,
      };
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: true,
          kycProfile: true,
          riskProfile: true,
          _count: {
            select: {
              loans: true,
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        branch: true,
        kycProfile: true,
        riskProfile: true,
        loans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            loans: true,
            documents: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id);

    // Verify branch exists if being updated
    if (updateCustomerDto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: updateCustomerDto.branchId },
      });

      if (!branch) {
        throw new BadRequestException('Branch not found');
      }
    }

    // Check national ID uniqueness if being updated
    if (updateCustomerDto.nationalId) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { nationalId: updateCustomerDto.nationalId },
          ],
        },
      });

      if (existingCustomer) {
        throw new ConflictException('Customer with this national ID already exists');
      }
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
      include: {
        branch: true,
        kycProfile: true,
        riskProfile: true,
      },
    });

    this.logger.log(`Customer updated: ${customer.customerId}`);

    return customer;
  }

  async remove(id: string) {
    const customer = await this.findOne(id);

    // Check if customer has active loans
    const activeLoans = await this.prisma.loan.count({
      where: {
        customerId: id,
        status: { in: ['ACTIVE', 'DISBURSED', 'OVERDUE'] },
      },
    });

    if (activeLoans > 0) {
      throw new BadRequestException('Cannot delete customer with active loans');
    }

    // Soft delete by setting status to INACTIVE
    await this.prisma.customer.update({
      where: { id },
      data: { status: CustomerStatus.INACTIVE },
    });

    this.logger.log(`Customer deactivated: ${customer.customerId}`);

    return { message: 'Customer deactivated successfully' };
  }

  async convertToCustomer(id: string) {
    const customer = await this.findOne(id);

    if (customer.status !== CustomerStatus.PROSPECT) {
      throw new BadRequestException('Only prospects can be converted to customers');
    }

    // Check if KYC is complete
    const kycProfile = customer.kycProfile;
    if (!kycProfile || kycProfile.status !== KYCStatus.COMPLETE) {
      throw new BadRequestException('KYC must be complete before conversion');
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: { status: CustomerStatus.ACTIVE },
      include: {
        branch: true,
        kycProfile: true,
        riskProfile: true,
      },
    });

    this.logger.log(`Prospect converted to customer: ${updatedCustomer.customerId}`);

    return updatedCustomer;
  }

  async updateKYC(id: string, updateKYCDto: UpdateKYCDto, verifiedBy: string) {
    const customer = await this.findOne(id);

    if (!customer.kycProfile) {
      throw new NotFoundException('KYC profile not found');
    }

    // Check if all required documents are present
    const isComplete =
      updateKYCDto.hasNationalId !== false &&
      updateKYCDto.hasProofOfAddress !== false &&
      updateKYCDto.hasPhotoProof !== false;

    const kycProfile = await this.prisma.kYCProfile.update({
      where: { customerId: id },
      data: {
        ...updateKYCDto,
        status: isComplete ? KYCStatus.COMPLETE : KYCStatus.INCOMPLETE,
        verifiedBy: isComplete ? verifiedBy : undefined,
        verifiedAt: isComplete ? new Date() : undefined,
      },
    });

    this.logger.log(`KYC updated for customer: ${customer.customerId}`);

    return kycProfile;
  }

  async updateRiskProfile(
    id: string,
    updateRiskProfileDto: UpdateRiskProfileDto,
    assessedBy: string,
  ) {
    const customer = await this.findOne(id);

    if (!customer.riskProfile) {
      throw new NotFoundException('Risk profile not found');
    }

    const riskProfile = await this.prisma.riskProfile.update({
      where: { customerId: id },
      data: {
        ...updateRiskProfileDto,
        assessedBy,
        assessedAt: new Date(),
        nextReviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
      },
    });

    this.logger.log(`Risk profile updated for customer: ${customer.customerId}`);

    return riskProfile;
  }

  async getCustomerHistory(id: string) {
    const customer = await this.findOne(id);

    const [loans, documents, totalDisbursed] = await Promise.all([
      this.prisma.loan.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          loanOfficer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.document.findMany({
        where: { customerId: id },
        orderBy: { uploadedAt: 'desc' },
        take: 10,
      }),
      this.prisma.loan.aggregate({
        where: {
          customerId: id,
          status: { in: ['DISBURSED', 'ACTIVE', 'CLOSED'] },
        },
        _sum: {
          approvedAmount: true,
        },
      }),
    ]);

    return {
      customer: {
        id: customer.id,
        customerId: customer.customerId,
        name: `${customer.firstName} ${customer.lastName}`,
        status: customer.status,
      },
      history: {
        totalLoans: loans.length,
        activeLoans: loans.filter((l) => l.status === 'ACTIVE' || l.status === 'DISBURSED')
          .length,
        totalDisbursed: totalDisbursed._sum.approvedAmount || 0,
        loans,
        documents,
      },
    };
  }

  private async generateCustomerId(branchId: string): Promise<string> {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    const count = await this.prisma.customer.count({
      where: { branchId },
    });

    const year = new Date().getFullYear().toString().slice(-2);
    const sequence = (count + 1).toString().padStart(5, '0');

    return `${branch.code}-${year}-${sequence}`;
  }
}
