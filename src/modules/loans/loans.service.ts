import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateLoanDto,
  UpdateLoanDto,
  QueryLoansDto,
  CreateAppraisalDto,
  UpdateAppraisalDto,
} from './dto/loan.dto';
import {
  CreateApprovalDecisionDto,
  CreateDisbursementDto,
  UpdateDisbursementDto,
  CloseLoanDto,
} from './dto/approval-disbursement.dto';
import {
  LoanStatus,
  KYCStatus,
  AppraisalStatus,
  DisbursementStatus,
  RepaymentFrequency,
} from '@prisma/client';

@Injectable()
export class LoansService {
  private readonly logger = new Logger(LoansService.name);

  constructor(private prisma: PrismaService) {}

  async create(createLoanDto: CreateLoanDto, createdBy: string) {
    // WORKFLOW GATE 1: KYC Check
    const customer = await this.prisma.customer.findUnique({
      where: { id: createLoanDto.customerId },
      include: { kycProfile: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!customer.kycProfile || customer.kycProfile.status !== KYCStatus.COMPLETE) {
      throw new ForbiddenException(
        'Cannot create loan: KYC must be complete. Current status: ' +
          (customer.kycProfile?.status || 'MISSING'),
      );
    }

    // Verify loan officer exists
    const loanOfficer = await this.prisma.user.findUnique({
      where: { id: createLoanDto.loanOfficerId },
    });

    if (!loanOfficer) {
      throw new BadRequestException('Loan officer not found');
    }

    // Verify branch exists
    const branch = await this.prisma.branch.findUnique({
      where: { id: createLoanDto.branchId },
    });

    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    // Generate loan ID
    const loanId = await this.generateLoanId(createLoanDto.branchId);

    // Create loan
    const loan = await this.prisma.loan.create({
      data: {
        ...createLoanDto,
        loanId,
        status: LoanStatus.DRAFT,
        createdBy,
      },
      include: {
        customer: true,
        loanOfficer: true,
        branch: true,
      },
    });

    this.logger.log(`Loan created: ${loan.loanId} by ${createdBy}`);

    return loan;
  }

  async findAll(query: QueryLoansDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      purpose,
      customerId,
      loanOfficerId,
      branchId,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { loanId: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (status) where.status = status;
    if (purpose) where.purpose = purpose;
    if (customerId) where.customerId = customerId;
    if (loanOfficerId) where.loanOfficerId = loanOfficerId;
    if (branchId) where.branchId = branchId;

    const [loans, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              customerId: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          loanOfficer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          branch: true,
          appraisal: true,
          _count: {
            select: {
              approvalDecisions: true,
              documents: true,
            },
          },
        },
      }),
      this.prisma.loan.count({ where }),
    ]);

    return {
      data: loans,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            kycProfile: true,
            riskProfile: true,
          },
        },
        loanOfficer: true,
        branch: true,
        appraisal: true,
        approvalDecisions: {
          orderBy: { approvedAt: 'desc' },
        },
        disbursement: true,
        repaymentSchedule: {
          orderBy: { installmentNumber: 'asc' },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${id} not found`);
    }

    return loan;
  }

  async update(id: string, updateLoanDto: UpdateLoanDto) {
    const loan = await this.findOne(id);

    // Only allow updates in DRAFT status
    if (loan.status !== LoanStatus.DRAFT) {
      throw new ForbiddenException('Can only update loans in DRAFT status');
    }

    const updatedLoan = await this.prisma.loan.update({
      where: { id },
      data: updateLoanDto,
      include: {
        customer: true,
        loanOfficer: true,
        branch: true,
      },
    });

    this.logger.log(`Loan updated: ${updatedLoan.loanId}`);

    return updatedLoan;
  }

  async submitApplication(id: string) {
    const loan = await this.findOne(id);

    // WORKFLOW GATE: Can only submit from DRAFT
    if (loan.status !== LoanStatus.DRAFT) {
      throw new ForbiddenException('Can only submit loans in DRAFT status');
    }

    // WORKFLOW GATE: KYC must be complete
    if (!loan.customer.kycProfile || loan.customer.kycProfile.status !== KYCStatus.COMPLETE) {
      throw new ForbiddenException('Cannot submit: Customer KYC is not complete');
    }

    const updatedLoan = await this.prisma.loan.update({
      where: { id },
      data: {
        status: LoanStatus.APPLICATION_SUBMITTED,
      },
      include: {
        customer: true,
        loanOfficer: true,
      },
    });

    this.logger.log(`Loan application submitted: ${updatedLoan.loanId}`);

    return updatedLoan;
  }

  async createAppraisal(id: string, createAppraisalDto: CreateAppraisalDto, appraisedBy: string) {
    const loan = await this.findOne(id);

    // WORKFLOW GATE: Must be in APPLICATION_SUBMITTED status
    if (loan.status !== LoanStatus.APPLICATION_SUBMITTED) {
      throw new ForbiddenException('Can only create appraisal for submitted applications');
    }

    // Check if appraisal already exists
    if (loan.appraisal) {
      throw new BadRequestException('Appraisal already exists. Use update endpoint instead.');
    }

    const appraisal = await this.prisma.appraisal.create({
      data: {
        loanId: id,
        ...createAppraisalDto,
        status: AppraisalStatus.IN_PROGRESS,
        appraisedBy,
      },
    });

    // Update loan status
    await this.prisma.loan.update({
      where: { id },
      data: { status: LoanStatus.UNDER_APPRAISAL },
    });

    this.logger.log(`Appraisal created for loan: ${loan.loanId}`);

    return appraisal;
  }

  async updateAppraisal(id: string, updateAppraisalDto: UpdateAppraisalDto) {
    const loan = await this.findOne(id);

    if (!loan.appraisal) {
      throw new NotFoundException('Appraisal not found');
    }

    const appraisal = await this.prisma.appraisal.update({
      where: { loanId: id },
      data: updateAppraisalDto,
    });

    this.logger.log(`Appraisal updated for loan: ${loan.loanId}`);

    return appraisal;
  }

  async completeAppraisal(id: string, appraisedBy: string) {
    const loan = await this.findOne(id);

    if (!loan.appraisal) {
      throw new NotFoundException('Appraisal not found');
    }

    // WORKFLOW GATE: Appraisal must have minimum required fields
    const appraisal = loan.appraisal;
    if (!appraisal.recommendation || !appraisal.recommendedAmount) {
      throw new ForbiddenException(
        'Cannot complete appraisal: Missing recommendation or recommended amount',
      );
    }

    const updatedAppraisal = await this.prisma.appraisal.update({
      where: { loanId: id },
      data: {
        status: AppraisalStatus.COMPLETED,
        appraisedBy,
        appraisedAt: new Date(),
      },
    });

    // Update loan status to pending approval
    await this.prisma.loan.update({
      where: { id },
      data: { status: LoanStatus.PENDING_APPROVAL },
    });

    this.logger.log(`Appraisal completed for loan: ${loan.loanId}`);

    return updatedAppraisal;
  }

  async createApprovalDecision(
    id: string,
    createApprovalDto: CreateApprovalDecisionDto,
    approvedBy: string,
  ) {
    const loan = await this.findOne(id);

    // WORKFLOW GATE: Must have completed appraisal
    if (!loan.appraisal || loan.appraisal.status !== AppraisalStatus.COMPLETED) {
      throw new ForbiddenException('Cannot approve: Appraisal must be completed first');
    }

    // WORKFLOW GATE: Must be in PENDING_APPROVAL status
    if (loan.status !== LoanStatus.PENDING_APPROVAL && loan.status !== LoanStatus.UNDER_APPRAISAL) {
      throw new ForbiddenException('Loan is not pending approval');
    }

    const approval = await this.prisma.approvalDecision.create({
      data: {
        loanId: id,
        ...createApprovalDto,
        approvedBy,
      },
    });

    // Update loan status based on decision
    let newStatus: LoanStatus = loan.status;
    let approvedAmount = loan.approvedAmount;

    if (createApprovalDto.decision === 'APPROVED') {
      newStatus = LoanStatus.APPROVED;
      approvedAmount = createApprovalDto.approvedAmount ?? (loan.requestedAmount as any) ?? null;
    } else if (createApprovalDto.decision === 'APPROVED_WITH_CONDITIONS') {
      newStatus = LoanStatus.APPROVED_WITH_CONDITIONS;
      approvedAmount = createApprovalDto.approvedAmount ?? (loan.requestedAmount as any) ?? null;
    } else if (createApprovalDto.decision === 'REJECTED') {
      newStatus = LoanStatus.REJECTED;
      approvedAmount = null;
    }

    await this.prisma.loan.update({
      where: { id },
      data: {
        status: newStatus,
        approvedAmount,
        approvalDate: new Date(),
      },
    });

    this.logger.log(`Approval decision created for loan: ${loan.loanId} - ${createApprovalDto.decision}`);

    return approval;
  }

  async createDisbursement(id: string, createDisbursementDto: CreateDisbursementDto) {
    const loan = await this.findOne(id);

    // WORKFLOW GATE: DISBURSEMENT GATE - All conditions must be met
    if (loan.status !== LoanStatus.APPROVED && loan.status !== LoanStatus.APPROVED_WITH_CONDITIONS) {
      throw new ForbiddenException(
        'Cannot disburse: Loan must be approved. Current status: ' + loan.status,
      );
    }

    // Check if approval exists
    if (!loan.approvalDecisions || loan.approvalDecisions.length === 0) {
      throw new ForbiddenException('Cannot disburse: No approval decision found');
    }

    // Check if disbursement already exists
    if (loan.disbursement) {
      throw new BadRequestException('Disbursement already exists');
    }

    const disbursement = await this.prisma.disbursement.create({
      data: {
        loanId: id,
        ...createDisbursementDto,
        status: DisbursementStatus.PENDING,
      },
    });

    this.logger.log(`Disbursement created for loan: ${loan.loanId}`);

    return disbursement;
  }

  async verifyDisbursement(id: string, verifiedBy: string) {
    const loan = await this.findOne(id);

    if (!loan.disbursement) {
      throw new NotFoundException('Disbursement not found');
    }

    const disbursement = await this.prisma.disbursement.update({
      where: { loanId: id },
      data: {
        status: DisbursementStatus.PROCESSING,
        verifiedBy,
        verifiedAt: new Date(),
      },
    });

    this.logger.log(`Disbursement verified for loan: ${loan.loanId}`);

    return disbursement;
  }

  async completeDisbursement(id: string, disbursedBy: string, referenceNumber?: string) {
    const loan = await this.findOne(id);

    if (!loan.disbursement) {
      throw new NotFoundException('Disbursement not found');
    }

    // Final verification check
    if (!loan.disbursement.verifiedBy) {
      throw new ForbiddenException('Cannot complete: Disbursement must be verified first');
    }

    const disbursement = await this.prisma.disbursement.update({
      where: { loanId: id },
      data: {
        status: DisbursementStatus.COMPLETED,
        disbursedBy,
        disbursedAt: new Date(),
        referenceNumber: referenceNumber || loan.disbursement.referenceNumber,
      },
    });

    // Update loan status to DISBURSED and generate repayment schedule
    await this.prisma.loan.update({
      where: { id },
      data: {
        status: LoanStatus.DISBURSED,
        disbursementDate: new Date(),
      },
    });

    // Generate repayment schedule
    await this.generateRepaymentSchedule(loan);

    this.logger.log(`Disbursement completed for loan: ${loan.loanId}`);

    return disbursement;
  }

  async closeLoan(id: string, closeLoanDto: CloseLoanDto) {
    const loan = await this.findOne(id);

    // Can only close loans that are ACTIVE or fully PAID
    if (loan.status !== LoanStatus.ACTIVE && loan.status !== LoanStatus.DISBURSED) {
      throw new ForbiddenException('Can only close active loans');
    }

    await this.prisma.loan.update({
      where: { id },
      data: {
        status: LoanStatus.CLOSED,
        closedDate: new Date(),
      },
    });

    this.logger.log(`Loan closed: ${loan.loanId} with rating: ${closeLoanDto.finalRating}`);

    return { message: 'Loan closed successfully', ...closeLoanDto };
  }

  private async generateRepaymentSchedule(loan: any) {
    const { approvedAmount, interestRate, tenure, repaymentFrequency, disbursementDate } = loan;

    if (!approvedAmount || !disbursementDate) {
      throw new BadRequestException('Cannot generate schedule: Missing required loan data');
    }

    const principal = Number(approvedAmount);
    const rate = Number(interestRate) / 100;
    
    // Calculate number of installments based on frequency
    let numberOfInstallments = tenure;
    let periodRate = rate / 12;
    
    if (repaymentFrequency === RepaymentFrequency.WEEKLY) {
      numberOfInstallments = tenure * 4;
      periodRate = rate / 52;
    } else if (repaymentFrequency === RepaymentFrequency.BIWEEKLY) {
      numberOfInstallments = tenure * 2;
      periodRate = rate / 26;
    } else if (repaymentFrequency === RepaymentFrequency.QUARTERLY) {
      numberOfInstallments = tenure / 3;
      periodRate = rate / 4;
    }

    // Calculate installment amount (reducing balance method)
    const installmentAmount =
      (principal * periodRate * Math.pow(1 + periodRate, numberOfInstallments)) /
      (Math.pow(1 + periodRate, numberOfInstallments) - 1);

    let balance = principal;
    const schedule: any[] = [];

    for (let i = 1; i <= numberOfInstallments; i++) {
      const interestAmount = balance * periodRate;
      const principalAmount = installmentAmount - interestAmount;
      balance = Math.max(0, balance - principalAmount);

      // Calculate due date based on frequency
      let dueDate = new Date(disbursementDate);
      if (repaymentFrequency === RepaymentFrequency.MONTHLY) {
        dueDate.setMonth(dueDate.getMonth() + i);
      } else if (repaymentFrequency === RepaymentFrequency.WEEKLY) {
        dueDate.setDate(dueDate.getDate() + i * 7);
      } else if (repaymentFrequency === RepaymentFrequency.BIWEEKLY) {
        dueDate.setDate(dueDate.getDate() + i * 14);
      } else if (repaymentFrequency === RepaymentFrequency.QUARTERLY) {
        dueDate.setMonth(dueDate.getMonth() + i * 3);
      }

      schedule.push({
        loanId: loan.id,
        installmentNumber: i,
        dueDate,
        principalAmount,
        interestAmount,
        totalAmount: installmentAmount,
        outstandingPrincipal: principalAmount,
        outstandingInterest: interestAmount,
        outstandingTotal: installmentAmount,
      });
    }

    await this.prisma.repaymentSchedule.createMany({
      data: schedule,
    });

    this.logger.log(`Repayment schedule generated for loan: ${loan.loanId} - ${numberOfInstallments} installments`);
  }

  private async generateLoanId(branchId: string): Promise<string> {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    const count = await this.prisma.loan.count({
      where: { branchId },
    });

    const year = new Date().getFullYear().toString().slice(-2);
    const sequence = (count + 1).toString().padStart(5, '0');

    return `LN-${branch.code}-${year}-${sequence}`;
  }
}
