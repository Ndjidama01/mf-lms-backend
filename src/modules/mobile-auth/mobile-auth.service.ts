import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  VerifyPreRegistrationDto,
  VerifyOTPDto,
  SetPasswordDto,
  SelfRegisterDto,
  LoginDto,
  LoginPinDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ChangePinDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  ResendOTPDto,
} from './dto/mobile-auth.dto';

@Injectable()
export class MobileAuthService {
  private readonly logger = new Logger(MobileAuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
  ) { }

  // ============================================
  // ACTIVATION COMPTE PRÉ-CRÉÉ
  // ============================================

  async verifyPreRegistration(dto: VerifyPreRegistrationDto, ipAddress: string) {
    // 1. Chercher le compte mobile
    const mobileAccount = await this.prisma.mobileAccount.findUnique({
      where: { phoneNumber: dto.phoneNumber },
      include: { customer: true },
    });

    if (!mobileAccount) {
      this.logger.warn(`Pre-registration check failed: account not found for ${dto.phoneNumber}`);
      throw new NotFoundException('Aucun compte trouvé avec ce numéro');
    }

    if (mobileAccount.status !== 'PENDING_ACTIVATION') {
      throw new BadRequestException('Ce compte est déjà activé');
    }

    // 2. Vérifier les informations personnelles
    const customer = mobileAccount.customer;

    // Normaliser la date de naissance (accepter "YYYY-MM-DD" ou "YYYY-MM-DD HH:MM:SS")
    const normalizedDtoDate = dto.dateOfBirth.split(' ')[0]; // "1998-05-12 00:00:00" → "1998-05-12"
    const customerDob = customer.dateOfBirth?.toISOString().split('T')[0]; // "1998-05-12"

    const dobMatch = customerDob === normalizedDtoDate;
    const firstNameMatch = customer.firstName.toLowerCase() === dto.firstName.toLowerCase();
    const lastNameMatch = customer.lastName.toLowerCase() === dto.lastName.toLowerCase();
    const nationalIdMatch = customer.nationalId === dto.nationalId;

    if (!dobMatch || !firstNameMatch || !lastNameMatch || !nationalIdMatch) {
      this.logger.warn(
        `Identity verification failed for ${dto.phoneNumber}: mismatch in personal data`,
      );

      // Log détaillé pour debugging
      this.logger.debug(`Verification details:
        DOB Match: ${dobMatch} (Customer: ${customerDob}, Provided: ${normalizedDtoDate})
        FirstName Match: ${firstNameMatch} (Customer: ${customer.firstName}, Provided: ${dto.firstName})
        LastName Match: ${lastNameMatch} (Customer: ${customer.lastName}, Provided: ${dto.lastName})
        NationalId Match: ${nationalIdMatch} (Customer: ${customer.nationalId}, Provided: ${dto.nationalId})
      `);

      throw new UnauthorizedException('Informations incorrectes. Veuillez vérifier vos données.');
    }

    // 3. Générer et envoyer OTP via le service OTP
    const otpResult = await this.otpService.sendOTP({
      phoneNumber: dto.phoneNumber,
      mobileAccountId: mobileAccount.id,
      purpose: 'ACCOUNT_ACTIVATION',
      channel: 'SMS',
      ipAddress,
    });

    this.logger.log(`OTP sent to ${dto.phoneNumber} for account activation`);

    return otpResult;
  }

  async verifyOTP(dto: VerifyOTPDto) {
    // Utiliser le service OTP pour vérifier
    const result = await this.otpService.verifyOTP({
      phoneNumber: dto.phoneNumber,
      otpCode: dto.otpCode,
      purpose: dto.purpose as any,
    });

    // Marquer le téléphone comme vérifié
    await this.prisma.mobileAccount.update({
      where: { phoneNumber: dto.phoneNumber },
      data: { phoneVerified: true },
    });

    this.logger.log(`OTP verified successfully for ${dto.phoneNumber}`);

    return {
      success: true,
      message: 'Téléphone vérifié avec succès',
      nextStep: 'CREATE_PASSWORD',
    };
  }

  async setPassword(dto: SetPasswordDto) {
    // Valider que les mots de passe correspondent
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    // Valider le PIN (pas de séquences, pas de répétitions)
    this.validatePIN(dto.pin);

    const mobileAccount = await this.prisma.mobileAccount.findUnique({
      where: { phoneNumber: dto.phoneNumber },
      include: { customer: true },
    });

    if (!mobileAccount) {
      throw new NotFoundException('Compte non trouvé');
    }

    if (!mobileAccount.phoneVerified) {
      throw new UnauthorizedException('Téléphone non vérifié');
    }

    // Hasher password et PIN
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const pinHash = await bcrypt.hash(dto.pin, 12);

    // Activer le compte
    await this.prisma.mobileAccount.update({
      where: { id: mobileAccount.id },
      data: {
        passwordHash,
        pinHash,
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    });

    // Générer tokens JWT
    const tokens = await this.generateTokens({
      mobileAccountId: mobileAccount.id,
      customerId: mobileAccount.customerId,
      phoneNumber: dto.phoneNumber,
    });

    // Envoyer SMS de confirmation via Twilio
    await this.otpService['sendSMS'](
      dto.phoneNumber,
      `Félicitations ! Votre compte MF-LMS est maintenant actif.

Vous pouvez vous connecter avec votre numéro de téléphone et votre mot de passe.

MF-LMS`,
    );

    this.logger.log(`Account activated successfully for ${dto.phoneNumber}`);

    return {
      success: true,
      message: 'Compte activé avec succès',
      ...tokens,
      customer: {
        id: mobileAccount.customerId,
        firstName: mobileAccount.customer.firstName,
        lastName: mobileAccount.customer.lastName,
        phone: mobileAccount.customer.phone,
      },
    };
  }

  // ============================================
  // AUTO-INSCRIPTION
  // ============================================

  async selfRegister(dto: SelfRegisterDto, ipAddress: string) {
    // Validation
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    if (!dto.acceptedTerms || !dto.acceptedPrivacyPolicy) {
      throw new BadRequestException('Vous devez accepter les conditions générales et la politique de confidentialité');
    }

    this.validatePIN(dto.pin);

    // Vérifier unicité du numéro
    const existingAccount = await this.prisma.mobileAccount.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existingAccount) {
      throw new ConflictException('Ce numéro est déjà enregistré');
    }

    // Vérifier unicité de la CNI
    const existingCustomer = await this.prisma.customer.findFirst({
      where: { nationalId: dto.nationalId },
    });

    if (existingCustomer) {
      throw new ConflictException('Cette carte d\'identité est déjà enregistrée');
    }

    // Assigner une branche par défaut (selon la ville)
    const defaultBranch = await this.getDefaultBranch(dto.city);

    // Générer le customerId
    const customerId = await this.generateCustomerId(defaultBranch.id);

    // Créer le Customer (statut PROSPECT)
    const customer = await this.prisma.customer.create({
      data: {
        customerId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        nationalId: dto.nationalId,
        phone: dto.phoneNumber,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        district: dto.district,
        occupation: dto.occupation,
        monthlyIncome: dto.monthlyIncome,
        businessName: dto.businessName,
        businessType: dto.businessType,
        type: 'INDIVIDUAL',
        status: 'PROSPECT',
        branchId: defaultBranch.id,
        createdBy: 'SELF_REGISTERED',
      },
    });

    // Hasher password et PIN
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const pinHash = await bcrypt.hash(dto.pin, 12);

    // Créer MobileAccount (ACTIVE pour self-registered)
    const mobileAccount = await this.prisma.mobileAccount.create({
      data: {
        customerId: customer.id,
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        passwordHash,
        pinHash,
        status: 'ACTIVE',
        phoneVerified: false,
        activatedAt: new Date(),
        createdBy: 'SELF_REGISTERED',
      },
    });

    // Générer et envoyer OTP pour vérifier le téléphone via le service OTP
    await this.otpService.sendOTP({
      phoneNumber: dto.phoneNumber,
      mobileAccountId: mobileAccount.id,
      purpose: 'ACCOUNT_ACTIVATION',
      channel: 'SMS',
      ipAddress,
    });

    // Générer tokens JWT
    const tokens = await this.generateTokens({
      mobileAccountId: mobileAccount.id,
      customerId: customer.id,
      phoneNumber: dto.phoneNumber,
    });

    // Créer alerte pour le back-office
    await this.prisma.alert.create({
      data: {
        severity: 'LOW',
        category: 'OPERATIONAL',
        title: 'Nouvelle auto-inscription',
        message: `${customer.firstName} ${customer.lastName} s'est inscrit via l'application mobile`,
        customerId: customer.id,
        requiresAction: false,
        source: 'MOBILE_APP',
        metadata: {
          phoneNumber: dto.phoneNumber,
          city: dto.city,
          registrationType: 'SELF_REGISTERED',
        },
      },
    });

    this.logger.log(
      `Self-registration completed for ${dto.phoneNumber} - Customer ID: ${customer.id}`,
    );

    return {
      success: true,
      message: 'Compte créé avec succès',
      requiresPhoneVerification: true,
      ...tokens,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phoneVerified: false,
      },
    };
  }

  // ============================================
  // CONNEXION
  // ============================================

  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    const mobileAccount = await this.prisma.mobileAccount.findUnique({
      where: { phoneNumber: dto.phoneNumber },
      include: { customer: true },
    });

    if (!mobileAccount) {
      await this.logLoginAttempt({
        phoneNumber: dto.phoneNumber,
        success: false,
        reason: 'ACCOUNT_NOT_FOUND',
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Vérifier statut du compte
    if (mobileAccount.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Compte ${mobileAccount.status.toLowerCase()}`);
    }

    // Vérifier verrouillage
    if (mobileAccount.lockedUntil && mobileAccount.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (mobileAccount.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Compte verrouillé. Réessayez dans ${minutesLeft} minutes.`,
      );
    }

    // Vérifier le mot de passe
    if (!mobileAccount.passwordHash) {
      await this.logLoginAttempt({
        mobileAccountId: mobileAccount.id,
        phoneNumber: dto.phoneNumber,
        success: false,
        reason: 'PASSWORD_NOT_SET',
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Mot de passe non défini pour ce compte');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, mobileAccount.passwordHash);

    if (!isPasswordValid) {
      const newFailedAttempts = mobileAccount.failedLoginAttempts + 1;
      const shouldLock = newFailedAttempts >= 5;

      await this.prisma.mobileAccount.update({
        where: { id: mobileAccount.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lastFailedLoginAt: new Date(),
          ...(shouldLock && {
            status: 'LOCKED',
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
          }),
        },
      });

      await this.logLoginAttempt({
        mobileAccountId: mobileAccount.id,
        phoneNumber: dto.phoneNumber,
        success: false,
        reason: 'INVALID_PASSWORD',
        ipAddress,
        userAgent,
      });

      if (shouldLock) {
        throw new UnauthorizedException(
          'Trop de tentatives. Compte verrouillé pour 30 minutes.',
        );
      }

      throw new UnauthorizedException('Mot de passe incorrect');
    }

    // Réinitialiser failed attempts
    await this.prisma.mobileAccount.update({
      where: { id: mobileAccount.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        deviceInfo: dto.deviceId ? { deviceId: dto.deviceId, deviceName: dto.deviceName } : undefined,
      },
    });

    // Générer tokens
    const tokens = await this.generateTokens({
      mobileAccountId: mobileAccount.id,
      customerId: mobileAccount.customerId,
      phoneNumber: dto.phoneNumber,
    });

    // Log successful login
    await this.logLoginAttempt({
      mobileAccountId: mobileAccount.id,
      phoneNumber: dto.phoneNumber,
      success: true,
      method: 'PHONE_PASSWORD',
      ipAddress,
      userAgent,
      deviceId: dto.deviceId,
    });

    this.logger.log(`Successful login for ${dto.phoneNumber}`);

    return {
      ...tokens,
      customer: {
        id: mobileAccount.customer.id,
        firstName: mobileAccount.customer.firstName,
        lastName: mobileAccount.customer.lastName,
        phone: mobileAccount.customer.phone,
        status: mobileAccount.customer.status,
      },
    };
  }

  async loginWithPin(dto: LoginPinDto, ipAddress: string, userAgent: string) {
    const mobileAccount = await this.prisma.mobileAccount.findUnique({
      where: { phoneNumber: dto.phoneNumber },
      include: { customer: true },
    });

    if (!mobileAccount) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (mobileAccount.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Compte ${mobileAccount.status.toLowerCase()}`);
    }

    // Vérifier le PIN
    if (!mobileAccount.pinHash) {
      throw new UnauthorizedException('PIN non défini pour ce compte');
    }
    const isPinValid = await bcrypt.compare(dto.pin, mobileAccount.pinHash);

    if (!isPinValid) {
      const newFailedAttempts = mobileAccount.failedLoginAttempts + 1;

      await this.prisma.mobileAccount.update({
        where: { id: mobileAccount.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lastFailedLoginAt: new Date(),
        },
      });

      throw new UnauthorizedException('PIN incorrect');
    }

    // Réinitialiser failed attempts
    await this.prisma.mobileAccount.update({
      where: { id: mobileAccount.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    const tokens = await this.generateTokens({
      mobileAccountId: mobileAccount.id,
      customerId: mobileAccount.customerId,
      phoneNumber: dto.phoneNumber,
    });

    await this.logLoginAttempt({
      mobileAccountId: mobileAccount.id,
      phoneNumber: dto.phoneNumber,
      success: true,
      method: 'PHONE_PIN',
      ipAddress,
      userAgent,
    });

    return {
      ...tokens,
      customer: {
        id: mobileAccount.customer.id,
        firstName: mobileAccount.customer.firstName,
        lastName: mobileAccount.customer.lastName,
      },
    };
  }

  // Suite dans la partie 2...

  // ============================================
  // GESTION MOT DE PASSE & PIN
  // ============================================

  async changePassword(phoneNumber: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Les nouveaux mots de passe ne correspondent pas');
    }


    const mobileAccount = await this.prisma.mobileAccount.findUnique({
      where: { phoneNumber },
    });

    if (!mobileAccount) {
      throw new NotFoundException('Compte non trouvé');
    }

    if (!mobileAccount.passwordHash) {
      throw new UnauthorizedException('Mot de passe non défini pour ce compte');
    }

    // Vérifier l'ancien mot de passe
    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      mobileAccount.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.mobileAccount.update({
      where: { id: mobileAccount.id },
      data: { passwordHash: newPasswordHash },
    });

    this.logger.log(`Password changed for ${phoneNumber}`);

    return { success: true, message: 'Mot de passe modifié avec succès' };
  }

  async changePin(phoneNumber: string, dto: ChangePinDto) {
    if (dto.newPin !== dto.confirmPin) {
      throw new BadRequestException('Les nouveaux PINs ne correspondent pas');
    }

    this.validatePIN(dto.newPin);

    const mobileAccount = await this.prisma.mobileAccount.findUnique({
      where: { phoneNumber },
    });

    if (!mobileAccount) {
      throw new NotFoundException('Compte non trouvé');
    }


    // Vérifier l'ancien PIN
    if (!mobileAccount.pinHash) {
      throw new UnauthorizedException('PIN non défini pour ce compte');
    }
    const isCurrentPinValid = await bcrypt.compare(dto.currentPin, mobileAccount.pinHash);

    if (!isCurrentPinValid) {
      throw new UnauthorizedException('PIN actuel incorrect');
    }

    // Hasher le nouveau PIN
    const newPinHash = await bcrypt.hash(dto.newPin, 12);

    await this.prisma.mobileAccount.update({
      where: { id: mobileAccount.id },
      data: { pinHash: newPinHash },
    });

    this.logger.log(`PIN changed for ${phoneNumber}`);

    return { success: true, message: 'PIN modifié avec succès' };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto, ipAddress: string) {
    const mobileAccount = await this.prisma.mobileAccount.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!mobileAccount) {
      // Ne pas révéler que le compte n'existe pas (sécurité)
      return {
        success: true,
        message: 'Si ce numéro existe, vous recevrez un code de réinitialisation',
      };
    }

    // Envoyer OTP via le service OTP
    const otpResult = await this.otpService.sendOTP({
      phoneNumber: dto.phoneNumber,
      mobileAccountId: mobileAccount.id,
      purpose: 'PASSWORD_RESET',
      channel: 'SMS',
      ipAddress,
    });

    this.logger.log(`Password reset OTP sent to ${dto.phoneNumber}`);

    return otpResult;
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    // Vérifier l'OTP
    await this.verifyOTP({
      phoneNumber: dto.phoneNumber,
      otpCode: dto.otpCode,
      purpose: 'PASSWORD_RESET',
    });

    const mobileAccount = await this.prisma.mobileAccount.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!mobileAccount) {
      throw new NotFoundException('Compte non trouvé');
    }

    // Réinitialiser le mot de passe
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.mobileAccount.update({
      where: { id: mobileAccount.id },
      data: {
        passwordHash: newPasswordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    this.logger.log(`Password reset successfully for ${dto.phoneNumber}`);

    return { success: true, message: 'Mot de passe réinitialisé avec succès' };
  }

  async resendOTP(dto: ResendOTPDto, ipAddress: string) {
    const mobileAccount = await this.prisma.mobileAccount.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!mobileAccount) {
      throw new NotFoundException('Compte non trouvé');
    }

    // Renvoyer OTP via le service OTP
    const otpResult = await this.otpService.sendOTP({
      phoneNumber: dto.phoneNumber,
      mobileAccountId: mobileAccount.id,
      purpose: dto.purpose as any,
      channel: 'SMS',
      ipAddress,
    });

    return otpResult;
  }

  // ============================================
  // REFRESH TOKEN
  // ============================================

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const mobileAccount = await this.prisma.mobileAccount.findUnique({
        where: { id: payload.mobileAccountId },
      });

      if (!mobileAccount || mobileAccount.refreshToken !== dto.refreshToken) {
        throw new UnauthorizedException('Token invalide');
      }

      // Générer nouveaux tokens
      const tokens = await this.generateTokens({
        mobileAccountId: mobileAccount.id,
        customerId: mobileAccount.customerId,
        phoneNumber: mobileAccount.phoneNumber,
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

  async logout(phoneNumber: string) {
    await this.prisma.mobileAccount.update({
      where: { phoneNumber },
      data: {
        refreshToken: null,
        refreshTokenExpiry: null,
      },
    });

    return { success: true, message: 'Déconnexion réussie' };
  }

  // ============================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ============================================

  private validatePIN(pin: string) {
    // Vérifier les séquences (1234, 4321, etc.)
    const isSequential = (str: string) => {
      for (let i = 0; i < str.length - 1; i++) {
        if (Math.abs(parseInt(str[i]) - parseInt(str[i + 1])) !== 1) {
          return false;
        }
      }
      return true;
    };

    // Vérifier les répétitions (1111, 2222, etc.)
    const isRepeating = (str: string) => {
      return str.split('').every((char) => char === str[0]);
    };

    if (isSequential(pin) || isSequential(pin.split('').reverse().join(''))) {
      throw new BadRequestException('Le PIN ne doit pas être une séquence (ex: 1234, 4321)');
    }

    if (isRepeating(pin)) {
      throw new BadRequestException('Le PIN ne doit pas contenir que des chiffres identiques');
    }
  }

  private maskPhoneNumber(phone: string): string {
    if (phone.length <= 4) return phone;
    const start = phone.substring(0, 4);
    const end = phone.substring(phone.length - 4);
    const middle = '*'.repeat(phone.length - 8);
    return `${start}${middle}${end}`;
  }

  private async generateTokens(payload: {
    mobileAccountId: string;
    customerId: string;
    phoneNumber: string;
  }) {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: '30d',
    });

    const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Sauvegarder le refresh token
    await this.prisma.mobileAccount.update({
      where: { id: payload.mobileAccountId },
      data: {
        refreshToken,
        refreshTokenExpiry,
      },
    });

    return { accessToken, refreshToken };
  }

  private async logLoginAttempt(data: {
    mobileAccountId?: string;
    phoneNumber: string;
    success: boolean;
    reason?: string;
    method?: string;
    ipAddress: string;
    userAgent: string;
    deviceId?: string;
  }) {
    if (data.mobileAccountId) {
      await this.prisma.loginHistory.create({
        data: {
          mobileAccountId: data.mobileAccountId,
          loginMethod: data.method || 'UNKNOWN',
          success: data.success,
          failureReason: data.reason,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          deviceInfo: data.deviceId ? { deviceId: data.deviceId } : undefined,
        },
      });
    }
  }

  private async getDefaultBranch(city: string) {
    // Chercher une branche dans la même ville
    let branch = await this.prisma.branch.findFirst({
      where: {
        isActive: true,
        OR: [
          { name: { contains: city, mode: 'insensitive' } },
          { address: { contains: city, mode: 'insensitive' } },
        ],
      },
    });

    // Si pas trouvé, prendre la première branche active
    if (!branch) {
      branch = await this.prisma.branch.findFirst({
        where: { isActive: true },
      });
    }

    if (!branch) {
      throw new BadRequestException('Aucune branche disponible pour le moment');
    }

    return branch;
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

