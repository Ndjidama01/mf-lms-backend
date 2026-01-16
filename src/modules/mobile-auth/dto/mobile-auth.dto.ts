import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsDateString,
  MinLength,
  MaxLength,
  Matches,
  IsPhoneNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// ACTIVATION COMPTE PRÉ-CRÉÉ
// ============================================

export class VerifyPreRegistrationDto {
  @ApiProperty({ example: '+237671234567', description: 'Phone number' })
  @IsPhoneNumber('CM')
  phoneNumber: string;

  @ApiProperty({ example: '1990-05-15', description: 'Date of birth' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: 'Jean', description: 'First name' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Kamga', description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '123456789', description: 'National ID' })
  @IsString()
  nationalId: string;
}

export class VerifyOTPDto {
  @ApiProperty({ example: '+237671234567', description: 'Phone number' })
  @IsPhoneNumber('CM')
  phoneNumber: string;

  @ApiProperty({ example: '384756', description: 'OTP code' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  otpCode: string;

  @ApiProperty({
    enum: ['ACCOUNT_ACTIVATION', 'PASSWORD_RESET', 'LOGIN_VERIFICATION', 'TRANSACTION_CONFIRM'],
    example: 'ACCOUNT_ACTIVATION',
  })
  @IsString()
  purpose: string;
}

export class SetPasswordDto {
  @ApiProperty({ example: '+237671234567', description: 'Phone number' })
  @IsPhoneNumber('CM')
  phoneNumber: string;

  @ApiProperty({
    example: 'SecureP@ss123',
    description: 'Password (min 8 chars, uppercase, lowercase, number, special char)',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @ApiProperty({ example: 'SecureP@ss123', description: 'Confirm password' })
  @IsString()
  confirmPassword: string;

  @ApiProperty({ example: '1234', description: 'PIN (4-6 digits)' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  pin: string;
}

// ============================================
// AUTO-INSCRIPTION
// ============================================

export class SelfRegisterDto {
  // Personal Information
  @ApiProperty({ example: 'Marie', description: 'First name' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Ngo', description: 'Last name' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: '1995-08-20', description: 'Date of birth' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: ['M', 'F'], example: 'F', description: 'Gender' })
  @IsString()
  gender: string;

  @ApiProperty({ example: '987654321', description: 'National ID number' })
  @IsString()
  nationalId: string;

  // Contact
  @ApiProperty({ example: '+237672345678', description: 'Phone number' })
  @IsPhoneNumber('CM')
  phoneNumber: string;

  @ApiProperty({ example: 'marie.ngo@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Douala, Akwa', description: 'Address' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Douala', description: 'City' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 'Littoral', description: 'District/Region' })
  @IsString()
  @IsOptional()
  district?: string;

  // Economic Profile
  @ApiProperty({ example: 'Enseignante', description: 'Occupation' })
  @IsString()
  occupation: string;

  @ApiProperty({ example: 300000, description: 'Monthly income in FCFA' })
  @IsString()
  monthlyIncome: string;

  @ApiPropertyOptional({ example: 'Boutique Marie', description: 'Business name' })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiPropertyOptional({ example: 'Commerce', description: 'Business type' })
  @IsString()
  @IsOptional()
  businessType?: string;

  // Security
  @ApiProperty({ example: 'SecureP@ss456', description: 'Password' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @ApiProperty({ example: 'SecureP@ss456', description: 'Confirm password' })
  @IsString()
  confirmPassword: string;

  @ApiProperty({ example: '5678', description: 'PIN (4-6 digits)' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  pin: string;

  // Acceptance
  @ApiProperty({ example: true, description: 'Accepted terms and conditions' })
  @IsBoolean()
  acceptedTerms: boolean;

  @ApiProperty({ example: true, description: 'Accepted privacy policy' })
  @IsBoolean()
  acceptedPrivacyPolicy: boolean;
}

// ============================================
// CONNEXION
// ============================================

export class LoginDto {
  @ApiProperty({ example: '+237671234567', description: 'Phone number' })
  @IsPhoneNumber('CM')
  phoneNumber: string;

  @ApiProperty({ example: 'SecureP@ss123', description: 'Password' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: 'device-xyz', description: 'Device ID' })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiPropertyOptional({ example: 'iPhone 13', description: 'Device name' })
  @IsString()
  @IsOptional()
  deviceName?: string;
}

export class LoginPinDto {
  @ApiProperty({ example: '+237671234567', description: 'Phone number' })
  @IsPhoneNumber('CM')
  phoneNumber: string;

  @ApiProperty({ example: '1234', description: 'PIN' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  pin: string;

  @ApiPropertyOptional({ example: 'device-xyz', description: 'Device ID' })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Refresh token' })
  @IsString()
  refreshToken: string;
}

// ============================================
// GESTION COMPTE
// ============================================

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldP@ss123', description: 'Current password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewP@ss456', description: 'New password' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
  newPassword: string;

  @ApiProperty({ example: 'NewP@ss456', description: 'Confirm new password' })
  @IsString()
  confirmPassword: string;
}

export class ChangePinDto {
  @ApiProperty({ example: '1234', description: 'Current PIN' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  currentPin: string;

  @ApiProperty({ example: '5678', description: 'New PIN' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @Matches(/^\d+$/)
  newPin: string;

  @ApiProperty({ example: '5678', description: 'Confirm new PIN' })
  @IsString()
  confirmPin: string;
}

export class RequestPasswordResetDto {
  @ApiProperty({ example: '+237671234567', description: 'Phone number' })
  @IsPhoneNumber('CM')
  phoneNumber: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '+237671234567', description: 'Phone number' })
  @IsPhoneNumber('CM')
  phoneNumber: string;

  @ApiProperty({ example: '384756', description: 'OTP code' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  otpCode: string;

  @ApiProperty({ example: 'NewP@ss789', description: 'New password' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
  newPassword: string;

  @ApiProperty({ example: 'NewP@ss789', description: 'Confirm new password' })
  @IsString()
  confirmPassword: string;
}

export class ResendOTPDto {
  @ApiProperty({ example: '+237671234567', description: 'Phone number' })
  @IsPhoneNumber('CM')
  phoneNumber: string;

  @ApiProperty({
    enum: ['ACCOUNT_ACTIVATION', 'PASSWORD_RESET', 'LOGIN_VERIFICATION', 'TRANSACTION_CONFIRM'],
    example: 'ACCOUNT_ACTIVATION',
  })
  @IsString()
  purpose: string;
}
