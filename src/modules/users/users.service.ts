import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto/user.dto';
import { UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto, createdBy?: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { username: createUserDto.username },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Verify branch exists if provided
    if (createUserDto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: createUserDto.branchId },
      });

      if (!branch) {
        throw new BadRequestException('Branch not found');
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(createUserDto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        createdBy,
      },
      include: {
        branch: true,
      },
    });

    this.logger.log(`User created: ${user.email} by ${createdBy || 'system'}`);

    const { password, ...result } = user;
    return result;
  }

  async findAll(query: QueryUsersDto) {
    const { page = 1, limit = 10, search, role, status, branchId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          branchId: true,
          branch: {
            select: {
              id: true,
              code: true,
              name: true,
              region: true,
            },
          },
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
            region: true,
          },
        },
        lastLogin: true,
        loginAttempts: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    // Check email/username uniqueness if being updated
    if (updateUserDto.email || updateUserDto.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                updateUserDto.email ? { email: updateUserDto.email } : {},
                updateUserDto.username ? { username: updateUserDto.username } : {},
              ],
            },
          ],
        },
      });

      if (existingUser) {
        throw new ConflictException('Email or username already taken');
      }
    }

    // Verify branch exists if being updated
    if (updateUserDto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: updateUserDto.branchId },
      });

      if (!branch) {
        throw new BadRequestException('Branch not found');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
            region: true,
          },
        },
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User updated: ${updatedUser.email}`);

    return updatedUser;
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    // Soft delete by setting status to INACTIVE
    await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.INACTIVE },
    });

    this.logger.log(`User deactivated: ${user.email}`);

    return { message: 'User deactivated successfully' };
  }

  async assignBranch(id: string, branchId: string) {
    const user = await this.findOne(id);

    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { branchId },
      include: {
        branch: true,
      },
    });

    this.logger.log(`User ${user.email} assigned to branch ${branch.name}`);

    const { password, ...result } = updatedUser;
    return result;
  }

  async getUserStats(userId: string) {
    const user = await this.findOne(userId);

    // Get user statistics
    const [assignedLoans, activeTasks, completedTasks] = await Promise.all([
      this.prisma.loan.count({
        where: { loanOfficerId: userId },
      }),
      this.prisma.task.count({
        where: {
          assignedToId: userId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.task.count({
        where: {
          assignedToId: userId,
          status: 'COMPLETED',
        },
      }),
    ]);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      stats: {
        assignedLoans,
        activeTasks,
        completedTasks,
      },
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const rawRounds = this.configService.get<string>('BCRYPT_ROUNDS');
    console.log('🔍 Raw BCRYPT_ROUNDS:', rawRounds, typeof rawRounds);

    const rounds = parseInt(rawRounds || '10', 10);
    console.log('🔍 Parsed rounds:', rounds, typeof rounds);

    if (isNaN(rounds)) {
      throw new Error(`Invalid BCRYPT_ROUNDS: ${rawRounds}`);
    }

    return bcrypt.hash(password, rounds);
  }
}
