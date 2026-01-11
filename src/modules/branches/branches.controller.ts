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
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto, QueryBranchesDto } from './dto/branch.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Branches')
@ApiBearerAuth('JWT-auth')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CEO)
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  @ApiResponse({ status: 409, description: 'Branch code already exists' })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.BOARD,
    UserRole.BRANCH_MANAGER,
    UserRole.HR,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get all branches with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of branches' })
  findAll(@Query() query: QueryBranchesDto) {
    return this.branchesService.findAll(query);
  }

  @Get('regions')
  @Roles(
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.BOARD,
    UserRole.BRANCH_MANAGER,
    UserRole.HR,
  )
  @ApiOperation({ summary: 'Get all unique regions' })
  @ApiResponse({ status: 200, description: 'List of regions' })
  getRegions() {
    return this.branchesService.getRegions();
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.BOARD,
    UserRole.BRANCH_MANAGER,
    UserRole.HR,
    UserRole.COMPLIANCE,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiResponse({ status: 200, description: 'Branch details' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Get('code/:code')
  @Roles(
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.BOARD,
    UserRole.BRANCH_MANAGER,
    UserRole.HR,
  )
  @ApiOperation({ summary: 'Get branch by code' })
  @ApiResponse({ status: 200, description: 'Branch details' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  findByCode(@Param('code') code: string) {
    return this.branchesService.findByCode(code);
  }

  @Get(':id/statistics')
  @Roles(
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.BOARD,
    UserRole.BRANCH_MANAGER,
    UserRole.HR,
    UserRole.COMPLIANCE,
  )
  @ApiOperation({ summary: 'Get branch statistics' })
  @ApiResponse({ status: 200, description: 'Branch statistics' })
  getStatistics(@Param('id') id: string) {
    return this.branchesService.getStatistics(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CEO)
  @ApiOperation({ summary: 'Update branch' })
  @ApiResponse({ status: 200, description: 'Branch updated successfully' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate branch' })
  @ApiResponse({ status: 200, description: 'Branch deactivated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete branch with active users/loans' })
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
