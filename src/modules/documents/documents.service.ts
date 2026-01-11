import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  QueryDocumentsDto,
  DocumentVersionDto,
  LegalHoldDto,
} from './dto/document.dto';
import { DocumentStatus } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream } from 'fs';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly uploadDir = process.env.UPLOAD_DEST || './uploads/documents';

  constructor(private prisma: PrismaService) {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error.message}`);
    }
  }

  async create(createDocumentDto: CreateDocumentDto) {
    // Verify customer or loan exists
    if (createDocumentDto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: createDocumentDto.customerId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    if (createDocumentDto.loanId) {
      const loan = await this.prisma.loan.findUnique({
        where: { id: createDocumentDto.loanId },
      });
      if (!loan) {
        throw new NotFoundException('Loan not found');
      }
    }

    const document = await this.prisma.document.create({
      data: {
        ...createDocumentDto,
        status: DocumentStatus.PENDING,
        version: 1,
        isLatestVersion: true,
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
      },
    });

    this.logger.log(
      `Document created: ${document.fileName} by user ${createDocumentDto.uploadedBy}`,
    );

    return document;
  }

  async findAll(query: QueryDocumentsDto) {
    const { page = 1, limit = 10, search, documentType, status, customerId, loanId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (documentType) {
      where.documentType = documentType;
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (loanId) {
      where.loanId = loanId;
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
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
          _count: {
            select: {
              versions: true,
              accessLogs: true,
            },
          },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
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
        versions: {
          orderBy: { uploadedAt: 'desc' },
        },
        accessLogs: {
          take: 10,
          orderBy: { accessedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Log access
    await this.logAccess(id, userId, 'VIEW');

    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto) {
    await this.findOneWithoutLog(id);

    const document = await this.prisma.document.update({
      where: { id },
      data: updateDocumentDto,
      include: {
        customer: true,
        loan: true,
      },
    });

    this.logger.log(`Document updated: ${document.fileName}`);

    return document;
  }

  async remove(id: string, userId: string) {
    const document = await this.findOneWithoutLog(id);

    // Check if document has legal hold
    if (document.legalHold) {
      throw new ForbiddenException('Cannot delete document under legal hold');
    }

    // Soft delete
    await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.DELETED,
      },
    });

    // Log access
    await this.logAccess(id, userId, 'DELETE');

    this.logger.log(`Document deleted: ${document.fileName} by user ${userId}`);

    return { message: 'Document deleted successfully' };
  }

  async createVersion(id: string, versionDto: DocumentVersionDto) {
    const document = await this.findOneWithoutLog(id);

    // Create version record
    await this.prisma.documentVersion.create({
      data: {
        documentId: id,
        version: document.version + 1,
        fileName: versionDto.fileName,
        filePath: versionDto.filePath,
        fileSize: versionDto.fileSize,
        uploadedBy: versionDto.uploadedBy,
        notes: versionDto.notes,
      },
    });

    // Update document to new version
    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: {
        fileName: versionDto.fileName,
        filePath: versionDto.filePath,
        fileSize: versionDto.fileSize,
        version: document.version + 1,
      },
      include: {
        versions: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    this.logger.log(
      `New version created for document: ${document.fileName} (v${document.version + 1})`,
    );

    return updatedDocument;
  }

  async getVersions(id: string) {
    await this.findOneWithoutLog(id);

    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { version: 'desc' },
      include: {
        uploadedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return versions;
  }

  async getOcrText(id: string, userId: string) {
    const document = await this.findOneWithoutLog(id);

    if (!document.ocrProcessed) {
      throw new BadRequestException('OCR not processed for this document');
    }

    // Log access
    await this.logAccess(id, userId, 'VIEW');

    return {
      documentId: id,
      fileName: document.fileName,
      ocrText: document.ocrText,
      ocrProcessed: document.ocrProcessed,
    };
  }

  async updateOcrText(id: string, ocrText: string) {
    const document = await this.prisma.document.update({
      where: { id },
      data: {
        ocrText,
        ocrProcessed: true,
      },
    });

    this.logger.log(`OCR text updated for document: ${document.fileName}`);

    return document;
  }

  async setLegalHold(id: string, legalHoldDto: LegalHoldDto, userId: string) {
    const document = await this.findOneWithoutLog(id);

    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: {
        legalHold: legalHoldDto.enabled,
        legalHoldReason: legalHoldDto.reason,
      },
    });

    // Log the action
    await this.logAccess(
      id,
      userId,
      legalHoldDto.enabled ? 'LEGAL_HOLD_SET' : 'LEGAL_HOLD_REMOVED',
    );

    this.logger.log(
      `Legal hold ${legalHoldDto.enabled ? 'enabled' : 'disabled'} for document: ${document.fileName}`,
    );

    return updatedDocument;
  }

  async downloadDocument(id: string, userId: string) {
    const document = await this.findOneWithoutLog(id);

    // Check if file exists
    const fileExists = await this.fileExists(document.filePath);
    if (!fileExists) {
      throw new NotFoundException('File not found on server');
    }

    // Log download
    await this.logAccess(id, userId, 'DOWNLOAD');

    return {
      filePath: document.filePath,
      fileName: document.fileName,
      fileType: document.fileType,
    };
  }

  async getFileStream(filePath: string) {
    const fullPath = path.join(process.cwd(), filePath);
    return createReadStream(fullPath);
  }

  private async findOneWithoutLog(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  private async logAccess(documentId: string, userId: string, action: string) {
    await this.prisma.documentAccessLog.create({
      data: {
        documentId,
        userId,
        action,
        ipAddress: 'N/A', // Should be passed from request
        userAgent: 'N/A', // Should be passed from request
      },
    });
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getAccessLogs(id: string) {
    await this.findOneWithoutLog(id);

    const logs = await this.prisma.documentAccessLog.findMany({
      where: { documentId: id },
      orderBy: { accessedAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return logs;
  }

  async getStatistics(customerId?: string, loanId?: string) {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (loanId) where.loanId = loanId;

    const [total, byStatus, byType, totalSize] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.document.groupBy({
        by: ['documentType'],
        where,
        _count: true,
      }),
      this.prisma.document.aggregate({
        where,
        _sum: {
          fileSize: true,
        },
      }),
    ]);

    return {
      total,
      byStatus,
      byType,
      totalSize: totalSize._sum.fileSize || 0,
    };
  }
}
