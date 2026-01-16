import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Twilio } from 'twilio';

export interface SendOTPOptions {
  phoneNumber: string;
  mobileAccountId: string;
  purpose: 'ACCOUNT_ACTIVATION' | 'PASSWORD_RESET' | 'LOGIN_VERIFICATION' | 'TRANSACTION_CONFIRM';
  channel?: 'SMS' | 'WHATSAPP';
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifyOTPOptions {
  phoneNumber: string;
  otpCode: string;
  purpose: 'ACCOUNT_ACTIVATION' | 'PASSWORD_RESET' | 'LOGIN_VERIFICATION' | 'TRANSACTION_CONFIRM';
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private twilioClient: Twilio;
  private readonly twilioPhoneNumber: string;
  private readonly twilioWhatsAppNumber: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Initialiser le client Twilio
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioPhoneNumber = this.configService.getOrThrow<string>('TWILIO_PHONE_NUMBER');
    this.twilioWhatsAppNumber = this.configService.getOrThrow<string>('TWILIO_WHATSAPP_NUMBER');


    if (!accountSid || !authToken) {
      this.logger.warn('Twilio credentials not configured. SMS sending will be simulated.');
    } else {
      this.twilioClient = new Twilio(accountSid, authToken);
      this.logger.log('Twilio client initialized successfully');
    }
  }

  /**
   * Générer et envoyer un code OTP
   */
  async sendOTP(options: SendOTPOptions): Promise<{ success: boolean; message: string; expiresIn: number }> {
    const { phoneNumber, mobileAccountId, purpose, channel = 'SMS', ipAddress, userAgent } = options;

    // Vérifier si un OTP récent existe déjà (anti-spam)
    const recentOTP = await this.prisma.oTPCode.findFirst({
      where: {
        mobileAccountId,
        type: purpose,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Moins de 1 minute
        },
      },
    });

    if (recentOTP) {
      throw new BadRequestException('Un code a déjà été envoyé récemment. Veuillez patienter 1 minute.');
    }

    // Générer le code OTP
    const otpCode = this.generateOTP(6);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hasher le code
    const hashedCode = await bcrypt.hash(otpCode, 10);

    // Enregistrer dans la base de données
    await this.prisma.oTPCode.create({
      data: {
        mobileAccountId,
        code: hashedCode,
        type: purpose,
        channel,
        expiresAt: otpExpiry,
        ipAddress,
        userAgent,
        purpose: this.getPurposeDescription(purpose),
      },
    });

    // Créer le message
    const message = this.buildOTPMessage(otpCode, purpose);

    // Envoyer le SMS/WhatsApp
    try {
      if (channel === 'SMS') {
        await this.sendSMS(phoneNumber, message);
      } else if (channel === 'WHATSAPP') {
        await this.sendWhatsApp(phoneNumber, message);
      }

      this.logger.log(`OTP sent to ${phoneNumber} via ${channel} for ${purpose}`);

      return {
        success: true,
        message: `Code envoyé par ${channel} au ${this.maskPhoneNumber(phoneNumber)}`,
        expiresIn: 600,
      };
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${phoneNumber}: ${error.message}`);
      throw new BadRequestException('Échec de l\'envoi du code. Veuillez réessayer.');
    }
  }

  /**
   * Vérifier un code OTP
   */
  async verifyOTP(options: VerifyOTPOptions): Promise<{ success: boolean; message: string }> {
    const { phoneNumber, otpCode, purpose } = options;

    // Trouver le compte mobile
    const mobileAccount = await this.prisma.mobileAccount.findUnique({
      where: { phoneNumber },
      include: {
        otpCodes: {
          where: {
            type: purpose,
            isUsed: false,
            expiresAt: { gte: new Date() },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!mobileAccount || mobileAccount.otpCodes.length === 0) {
      throw new BadRequestException('Code OTP invalide ou expiré');
    }

    const otp = mobileAccount.otpCodes[0];

    // Vérifier le nombre de tentatives
    if (otp.attempts >= otp.maxAttempts) {
      await this.markOTPAsExpired(otp.id);
      throw new BadRequestException('Trop de tentatives. Demandez un nouveau code.');
    }

    // Vérifier le code
    const isValid = await bcrypt.compare(otpCode, otp.code);

    if (!isValid) {
      // Incrémenter les tentatives
      await this.prisma.oTPCode.update({
        where: { id: otp.id },
        data: { attempts: otp.attempts + 1 },
      });

      const remainingAttempts = otp.maxAttempts - otp.attempts - 1;
      throw new BadRequestException(
        `Code incorrect. ${remainingAttempts} tentative(s) restante(s).`,
      );
    }

    // Marquer l'OTP comme utilisé
    await this.prisma.oTPCode.update({
      where: { id: otp.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    this.logger.log(`OTP verified successfully for ${phoneNumber} - Purpose: ${purpose}`);

    return {
      success: true,
      message: 'Code vérifié avec succès',
    };
  }

  /**
   * Envoyer SMS via Twilio
   */
  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    if (!this.twilioClient) {
      // Mode simulation pour développement
      this.logger.log(`[SIMULATION] SMS to ${phoneNumber}: ${message}`);
      return;
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: phoneNumber,
      });

      this.logger.log(`SMS sent successfully. SID: ${result.sid}`);
    } catch (error) {
      this.logger.error(`Twilio SMS error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envoyer message WhatsApp via Twilio
   */
  private async sendWhatsApp(phoneNumber: string, message: string): Promise<void> {
    if (!this.twilioClient || !this.twilioWhatsAppNumber) {
      this.logger.log(`[SIMULATION] WhatsApp to ${phoneNumber}: ${message}`);
      return;
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: `whatsapp:${this.twilioWhatsAppNumber}`,
        to: `whatsapp:${phoneNumber}`,
      });

      this.logger.log(`WhatsApp sent successfully. SID: ${result.sid}`);
    } catch (error) {
      this.logger.error(`Twilio WhatsApp error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Générer un code OTP aléatoire
   */
  private generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  /**
   * Construire le message OTP selon le contexte
   */
  private buildOTPMessage(code: string, purpose: string): string {
    const messages = {
      ACCOUNT_ACTIVATION: `Votre code de vérification MF-LMS : ${code}

Valide 10 minutes. Ne partagez jamais ce code.

MF-LMS`,
      PASSWORD_RESET: `Code de réinitialisation MF-LMS : ${code}

Valide 10 minutes. Si vous n'avez pas demandé ce code, ignorez ce message.

MF-LMS`,
      LOGIN_VERIFICATION: `Code de connexion MF-LMS : ${code}

Valide 10 minutes. Si vous n'avez pas demandé ce code, sécurisez votre compte immédiatement.

MF-LMS`,
      TRANSACTION_CONFIRM: `Code de confirmation de transaction MF-LMS : ${code}

Valide 10 minutes. N'autorisez que les transactions que vous reconnaissez.

MF-LMS`,
    };

    return messages[purpose] || `Votre code MF-LMS : ${code}\n\nValide 10 minutes.`;
  }

  /**
   * Obtenir la description du purpose
   */
  private getPurposeDescription(purpose: string): string {
    const descriptions = {
      ACCOUNT_ACTIVATION: 'Activation du compte',
      PASSWORD_RESET: 'Réinitialisation du mot de passe',
      LOGIN_VERIFICATION: 'Vérification de connexion',
      TRANSACTION_CONFIRM: 'Confirmation de transaction',
    };

    return descriptions[purpose] || purpose;
  }

  /**
   * Masquer le numéro de téléphone
   */
  private maskPhoneNumber(phone: string): string {
    if (phone.length <= 8) return phone;
    const start = phone.substring(0, 4);
    const end = phone.substring(phone.length - 4);
    const middle = '*'.repeat(phone.length - 8);
    return `${start}${middle}${end}`;
  }

  /**
   * Marquer un OTP comme expiré
   */
  private async markOTPAsExpired(otpId: string): Promise<void> {
    await this.prisma.oTPCode.update({
      where: { id: otpId },
      data: { isUsed: true },
    });
  }

  /**
   * Nettoyer les OTP expirés (à exécuter périodiquement)
   */
  async cleanExpiredOTPs(): Promise<number> {
    const result = await this.prisma.oTPCode.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            createdAt: {
              lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Plus de 90 jours
            },
          },
        ],
      },
    });

    this.logger.log(`Cleaned ${result.count} expired OTP codes`);
    return result.count;
  }

  /**
   * Obtenir les statistiques OTP
   */
  async getOTPStatistics(days: number = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [total, sent, verified, failed, byPurpose, byChannel] = await Promise.all([
      this.prisma.oTPCode.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.oTPCode.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.oTPCode.count({
        where: {
          createdAt: { gte: startDate },
          isUsed: true,
        },
      }),
      this.prisma.oTPCode.count({
        where: {
          createdAt: { gte: startDate },
          attempts: { gte: 3 },
          isUsed: false,
        },
      }),
      this.prisma.oTPCode.groupBy({
        by: ['type'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.oTPCode.groupBy({
        by: ['channel'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
    ]);

    const successRate = sent > 0 ? ((verified / sent) * 100).toFixed(2) : 0;

    return {
      period: `Last ${days} days`,
      total,
      sent,
      verified,
      failed,
      successRate: `${successRate}%`,
      byPurpose,
      byChannel,
    };
  }
}
