// // src/modules/auth/otp.service.ts

// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../../../common/prisma/prisma.service';
// import * as crypto from 'crypto';

// @Injectable()
// export class OtpService {
//     constructor(private prisma: PrismaService) { }

//     async generateOtp(phone: string): Promise<string> {
//         // Générer un code à 6 chiffres
//         const otp = crypto.randomInt(100000, 999999).toString();
//         const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

//         // Sauvegarder en DB (créez un modèle OTP)
//         await this.prisma.$executeRaw`
//       INSERT INTO otp_codes (phone, code, expires_at) 
//       VALUES (${phone}, ${otp}, ${expiresAt})
//       ON CONFLICT (phone) 
//       DO UPDATE SET code = ${otp}, expires_at = ${expiresAt}, attempts = 0
//     `;

//         // Envoyer le SMS (intégrez Twilio, AfricasTalking, etc.)
//         await this.sendSms(phone, `Votre code MF-LMS: ${otp}. Valide 5 min.`);

//         return otp;
//     }

//     async verifyOtp(phone: string, code: string): Promise<boolean> {
//         const result = await this.prisma.$queryRaw`
//       SELECT * FROM otp_codes 
//       WHERE phone = ${phone} 
//       AND code = ${code} 
//       AND expires_at > NOW() 
//       AND attempts < 3
//     `;

//         if (!result || result.length === 0) {
//             // Incrémenter les tentatives
//             await this.prisma.$executeRaw`
//         UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ${phone}
//       `;
//             return false;
//         }

//         // Supprimer l'OTP utilisé
//         await this.prisma.$executeRaw`
//       DELETE FROM otp_codes WHERE phone = ${phone}
//     `;

//         return true;
//     }

//     private async sendSms(phone: string, message: string) {
//         // Implémentez votre service SMS ici
//         console.log(`SMS to ${phone}: ${message}`);

//         // Exemple avec Twilio:
//         // await this.twilioClient.messages.create({
//         //   body: message,
//         //   to: phone,
//         //   from: process.env.TWILIO_PHONE_NUMBER,
//         // });
//     }
// }