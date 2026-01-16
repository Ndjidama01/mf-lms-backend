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
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  CompleteTaskDto,
  ReassignTaskDto,
  QueryTasksDto,
  BulkAssignDto,
  AddCommentDto,
} from './dto/task.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.LOAN_OFFICER)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.HR,
    UserRole.COMPLIANCE,
    UserRole.FIELD_OFFICER,
  )
  @ApiOperation({ summary: 'Get all tasks with filters' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  findAll(@Query() query: QueryTasksDto) {
    return this.tasksService.findAll(query);
  }

  @Get('my-tasks')
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.HR,
    UserRole.COMPLIANCE,
    UserRole.FIELD_OFFICER,
  )
  @ApiOperation({ summary: 'Get tasks assigned to current user' })
  @ApiResponse({ status: 200, description: 'My tasks' })
  getMyTasks(@CurrentUser() user: any, @Query() query: QueryTasksDto) {
    return this.tasksService.findAll({ ...query, assignedToId: user.id });
  }

  @Get('statistics')
  @Roles(
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.BRANCH_MANAGER,
    UserRole.HR,
  )
  @ApiOperation({ summary: 'Get task statistics' })
  @ApiResponse({ status: 200, description: 'Task statistics' })
  getStatistics(
    @Query('userId') userId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.tasksService.getStatistics(userId, branchId);
  }

  @Post('trigger-monitoring')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually trigger SLA monitoring and reminders' })
  @ApiResponse({ status: 200, description: 'Monitoring triggered' })
  async triggerMonitoring() {
    await this.tasksService.monitorSLAAndReminders();
    return { message: 'SLA monitoring and reminders completed successfully' };
  }

  @Post('bulk-assign')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Bulk assign tasks to a user' })
  @ApiResponse({ status: 200, description: 'Tasks assigned' })
  bulkAssign(@Body() bulkDto: BulkAssignDto) {
    return this.tasksService.bulkAssign(bulkDto);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.HR,
    UserRole.COMPLIANCE,
    UserRole.FIELD_OFFICER,
  )
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.LOAN_OFFICER)
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Post(':id/start')
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.COMPLIANCE,
    UserRole.FIELD_OFFICER,
  )
  @ApiOperation({ summary: 'Start working on a task' })
  @ApiResponse({ status: 200, description: 'Task started' })
  start(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.startTask(id, user.id);
  }

  @Post(':id/complete')
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.COMPLIANCE,
    UserRole.FIELD_OFFICER,
  )
  @ApiOperation({ summary: 'Complete a task' })
  @ApiResponse({ status: 200, description: 'Task completed' })
  complete(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() completeDto: CompleteTaskDto,
  ) {
    return this.tasksService.complete(id, user.id, completeDto);
  }

  @Post(':id/reassign')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Reassign task to another user' })
  @ApiResponse({ status: 200, description: 'Task reassigned' })
  reassign(@Param('id') id: string, @Body() reassignDto: ReassignTaskDto) {
    return this.tasksService.reassign(id, reassignDto);
  }

  @Post(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Cancel a task' })
  @ApiResponse({ status: 200, description: 'Task cancelled' })
  cancel(@Param('id') id: string, @Body('reason') reason: string) {
    return this.tasksService.cancel(id, reason);
  }

  @Post(':id/comment')
  @Roles(
    UserRole.ADMIN,
    UserRole.BRANCH_MANAGER,
    UserRole.LOAN_OFFICER,
    UserRole.COMPLIANCE,
    UserRole.FIELD_OFFICER,
  )
  @ApiOperation({ summary: 'Add comment to task' })
  @ApiResponse({ status: 200, description: 'Comment added' })
  addComment(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() commentDto: AddCommentDto,
  ) {
    return this.tasksService.addComment(id, user.id, commentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
