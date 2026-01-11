import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Branches
  console.log('Creating branches...');
  const branch1 = await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      code: 'HQ',
      name: 'Head Office',
      address: '123 Main Street, City Center',
      phone: '+1234567890',
      email: 'hq@mflms.com',
      region: 'Central',
      isActive: true,
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { code: 'BR01' },
    update: {},
    create: {
      code: 'BR01',
      name: 'Downtown Branch',
      address: '456 Downtown Ave',
      phone: '+1234567891',
      email: 'downtown@mflms.com',
      region: 'North',
      isActive: true,
    },
  });

  const branch3 = await prisma.branch.upsert({
    where: { code: 'BR02' },
    update: {},
    create: {
      code: 'BR02',
      name: 'Suburban Branch',
      address: '789 Suburb Road',
      phone: '+1234567892',
      email: 'suburban@mflms.com',
      region: 'South',
      isActive: true,
    },
  });

  console.log('✅ Branches created');

  // Create Users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mflms.com' },
    update: {},
    create: {
      email: 'admin@mflms.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+1234567890',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      branchId: branch1.id,
    },
  });

  const ceo = await prisma.user.upsert({
    where: { email: 'ceo@mflms.com' },
    update: {},
    create: {
      email: 'ceo@mflms.com',
      username: 'ceo',
      password: hashedPassword,
      firstName: 'Chief',
      lastName: 'Executive',
      phone: '+1234567891',
      role: UserRole.CEO,
      status: UserStatus.ACTIVE,
      branchId: branch1.id,
    },
  });

  const branchManager1 = await prisma.user.upsert({
    where: { email: 'manager1@mflms.com' },
    update: {},
    create: {
      email: 'manager1@mflms.com',
      username: 'manager1',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Manager',
      phone: '+1234567892',
      role: UserRole.BRANCH_MANAGER,
      status: UserStatus.ACTIVE,
      branchId: branch2.id,
    },
  });

  const loanOfficer1 = await prisma.user.upsert({
    where: { email: 'officer1@mflms.com' },
    update: {},
    create: {
      email: 'officer1@mflms.com',
      username: 'officer1',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Officer',
      phone: '+1234567893',
      role: UserRole.LOAN_OFFICER,
      status: UserStatus.ACTIVE,
      branchId: branch2.id,
    },
  });

  const loanOfficer2 = await prisma.user.upsert({
    where: { email: 'officer2@mflms.com' },
    update: {},
    create: {
      email: 'officer2@mflms.com',
      username: 'officer2',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Officer',
      phone: '+1234567894',
      role: UserRole.LOAN_OFFICER,
      status: UserStatus.ACTIVE,
      branchId: branch3.id,
    },
  });

  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@mflms.com' },
    update: {},
    create: {
      email: 'hr@mflms.com',
      username: 'hr',
      password: hashedPassword,
      firstName: 'Human',
      lastName: 'Resources',
      phone: '+1234567895',
      role: UserRole.HR,
      status: UserStatus.ACTIVE,
      branchId: branch1.id,
    },
  });

  const complianceUser = await prisma.user.upsert({
    where: { email: 'compliance@mflms.com' },
    update: {},
    create: {
      email: 'compliance@mflms.com',
      username: 'compliance',
      password: hashedPassword,
      firstName: 'Compliance',
      lastName: 'Officer',
      phone: '+1234567896',
      role: UserRole.COMPLIANCE,
      status: UserStatus.ACTIVE,
      branchId: branch1.id,
    },
  });

  const auditor = await prisma.user.upsert({
    where: { email: 'auditor@mflms.com' },
    update: {},
    create: {
      email: 'auditor@mflms.com',
      username: 'auditor',
      password: hashedPassword,
      firstName: 'Internal',
      lastName: 'Auditor',
      phone: '+1234567897',
      role: UserRole.AUDITOR,
      status: UserStatus.ACTIVE,
      branchId: branch1.id,
    },
  });

  console.log('✅ Users created');

  console.log('\n📊 Seed Summary:');
  console.log('================');
  console.log(`✅ Created ${3} branches`);
  console.log(`✅ Created ${8} users`);
  console.log('\n👥 Test Accounts (all with password: Password123!):');
  console.log('================================================');
  console.log('1. Admin:       admin@mflms.com');
  console.log('2. CEO:         ceo@mflms.com');
  console.log('3. Manager:     manager1@mflms.com');
  console.log('4. Loan Officer: officer1@mflms.com');
  console.log('5. Loan Officer: officer2@mflms.com');
  console.log('6. HR:          hr@mflms.com');
  console.log('7. Compliance:  compliance@mflms.com');
  console.log('8. Auditor:     auditor@mflms.com');
  console.log('\n🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
