import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsUUID,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TaskType, TaskStatus, TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ enum: TaskType, example: 'FOLLOW_UP', description: 'Task type' })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiProperty({ example: 'Follow up with customer', description: 'Task title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Contact customer about payment', description: 'Task description' })
  @IsString()
  description: string;

  @ApiProperty({ enum: TaskPriority, example: 'HIGH', description: 'Task priority' })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiProperty({ example: '2025-01-15T10:00:00Z', description: 'Due date' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 'uuid', description: 'Assigned user ID' })
  @IsUUID()
  assignedToId: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Related customer ID' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Related loan ID' })
  @IsUUID()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Related branch ID' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: { notes: 'Important' }, description: 'Task metadata' })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ example: ['checklist1', 'checklist2'], description: 'Task checklist items' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  checklist?: string[];

  @ApiPropertyOptional({ example: 4, description: 'SLA hours' })
  @IsNumber()
  @IsOptional()
  slaHours?: number;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ enum: TaskStatus, example: 'IN_PROGRESS', description: 'Task status' })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}

export class CompleteTaskDto {
  @ApiProperty({ example: 'Task completed successfully', description: 'Completion notes' })
  @IsString()
  completionNotes: string;

  @ApiPropertyOptional({ example: ['item1', 'item2'], description: 'Completed checklist items' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  completedChecklist?: string[];
}

export class ReassignTaskDto {
  @ApiProperty({ example: 'uuid', description: 'New assignee user ID' })
  @IsUUID()
  newAssigneeId: string;

  @ApiProperty({ example: 'Workload redistribution', description: 'Reassignment reason' })
  @IsString()
  reason: string;
}

export class QueryTasksDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'follow up', description: 'Search in title or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: TaskType, description: 'Filter by type' })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiPropertyOptional({ enum: TaskStatus, description: 'Filter by status' })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, description: 'Filter by priority' })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by assigned user' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by customer' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by loan' })
  @IsUUID()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by branch' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter overdue tasks' })
  @IsBoolean()
  @IsOptional()
  overdue?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Filter SLA breached tasks' })
  @IsBoolean()
  @IsOptional()
  slaBreached?: boolean;
}

export class BulkAssignDto {
  @ApiProperty({ example: ['uuid1', 'uuid2'], description: 'Array of task IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  taskIds: string[];

  @ApiProperty({ example: 'uuid', description: 'User to assign tasks to' })
  @IsUUID()
  assignToId: string;
}

export class AddCommentDto {
  @ApiProperty({ example: 'Customer contacted, will pay tomorrow', description: 'Comment text' })
  @IsString()
  comment: string;
}
