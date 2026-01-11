import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  QueryDocumentsDto,
  DocumentVersionDto,
  LegalHoldDto,
} from './dto/document.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@ApiTags('Documents')
@ApiBearerAuth('JWT-auth')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.COMPLIANCE,
    UserRole.FIELD_OFFICER,
  )
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        documentType: { type: 'string' },
        customerId: { type: 'string', format: 'uuid' },
        loanId: { type: 'string', format: 'uuid' },
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['file', 'documentType'],
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|pdf|doc|docx)$/,
        })
        .addMaxSizeValidator({
          maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Body() metadata: any,
    @CurrentUser() user: any,
  ) {
    const createDocumentDto: CreateDocumentDto = {
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      documentType: metadata.documentType,
      customerId: metadata.customerId,
      loanId: metadata.loanId,
      description: metadata.description,
      tags: metadata.tags ? JSON.parse(metadata.tags) : [],
      uploadedBy: user.id,
    };

    return this.documentsService.create(createDocumentDto);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get all documents with filters' })
  @ApiResponse({ status: 200, description: 'List of documents' })
  findAll(@Query() query: QueryDocumentsDto) {
    return this.documentsService.findAll(query);
  }

  @Get('statistics')
  @Roles(
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.BRANCH_MANAGER,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get document statistics' })
  @ApiResponse({ status: 200, description: 'Document statistics' })
  getStatistics(
    @Query('customerId') customerId?: string,
    @Query('loanId') loanId?: string,
  ) {
    return this.documentsService.getStatistics(customerId, loanId);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: 200, description: 'Document details' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.findOne(id, user.id);
  }

  @Get(':id/download')
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Download document' })
  @ApiResponse({ status: 200, description: 'File stream' })
  async downloadDocument(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const fileInfo = await this.documentsService.downloadDocument(id, user.id);
    
    const stream = await this.documentsService.getFileStream(fileInfo.filePath);
    
    res.set({
      'Content-Type': fileInfo.fileType,
      'Content-Disposition': `attachment; filename="${fileInfo.fileName}"`,
    });

    return new StreamableFile(stream);
  }

  @Get(':id/preview')
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Preview document (inline)' })
  @ApiResponse({ status: 200, description: 'File stream for preview' })
  async previewDocument(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const fileInfo = await this.documentsService.downloadDocument(id, user.id);
    
    const stream = await this.documentsService.getFileStream(fileInfo.filePath);
    
    res.set({
      'Content-Type': fileInfo.fileType,
      'Content-Disposition': `inline; filename="${fileInfo.fileName}"`,
    });

    return new StreamableFile(stream);
  }

  @Get(':id/versions')
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get document versions' })
  @ApiResponse({ status: 200, description: 'List of document versions' })
  getVersions(@Param('id') id: string) {
    return this.documentsService.getVersions(id);
  }

  @Post(':id/versions')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.LOAN_OFFICER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload new version of document' })
  @ApiResponse({ status: 201, description: 'New version created' })
  async uploadVersion(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('notes') notes: string,
    @CurrentUser() user: any,
  ) {
    const versionDto: DocumentVersionDto = {
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      notes,
      uploadedBy: user.id,
    };

    return this.documentsService.createVersion(id, versionDto);
  }

  @Get(':id/ocr')
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.COMPLIANCE,
  )
  @ApiOperation({ summary: 'Get OCR text from document' })
  @ApiResponse({ status: 200, description: 'OCR text' })
  @ApiResponse({ status: 400, description: 'OCR not processed' })
  getOcrText(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.getOcrText(id, user.id);
  }

  @Patch(':id/ocr')
  @Roles(UserRole.ADMIN, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Update OCR text' })
  @ApiResponse({ status: 200, description: 'OCR text updated' })
  updateOcrText(@Param('id') id: string, @Body('ocrText') ocrText: string) {
    return this.documentsService.updateOcrText(id, ocrText);
  }

  @Get(':id/access-logs')
  @Roles(UserRole.ADMIN, UserRole.COMPLIANCE, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get document access logs' })
  @ApiResponse({ status: 200, description: 'List of access logs' })
  getAccessLogs(@Param('id') id: string) {
    return this.documentsService.getAccessLogs(id);
  }

  @Patch(':id/legal-hold')
  @Roles(UserRole.ADMIN, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Set or remove legal hold' })
  @ApiResponse({ status: 200, description: 'Legal hold updated' })
  setLegalHold(
    @Param('id') id: string,
    @Body() legalHoldDto: LegalHoldDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.setLegalHold(id, legalHoldDto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.COMPLIANCE)
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiResponse({ status: 200, description: 'Document updated' })
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Delete document (soft delete)' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  @ApiResponse({ status: 403, description: 'Cannot delete document under legal hold' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.remove(id, user.id);
  }
}
