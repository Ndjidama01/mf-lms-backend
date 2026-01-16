import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { MobileAuthService } from './mobile-auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Mobile Authentication')
@Controller('mobile')
export class MobileAuthController {
  constructor(private readonly mobileAuthService: MobileAuthService) { }

  // ============================================
  // ACTIVATION COMPTE PRÉ-CRÉÉ
  // ============================================

  @Public()
  @Post('verify-preregistration')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify pre-registered account (Step 1)' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 401, description: 'Information mismatch' })
  verifyPreRegistration(@Body() dto: VerifyPreRegistrationDto, @Req() req: Request) {
    const ipAddress = req.ip || 'unknown';
    return this.mobileAuthService.verifyPreRegistration(dto, ipAddress);
  }

  @Public()
  @Post('verify-otp')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code (Step 2)' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  verifyOTP(@Body() dto: VerifyOTPDto) {
    return this.mobileAuthService.verifyOTP(dto);
  }

  @Public()
  @Post('set-password')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set password and activate account (Step 3)' })
  @ApiResponse({ status: 200, description: 'Account activated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  setPassword(@Body() dto: SetPasswordDto) {
    return this.mobileAuthService.setPassword(dto);
  }

  // ============================================
  // AUTO-INSCRIPTION
  // ============================================

  @Public()
  @Post('self-register')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Self-registration for new customers' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 409, description: 'Phone number or National ID already exists' })
  selfRegister(@Body() dto: SelfRegisterDto, @Req() req: Request) {
    const ipAddress = req.ip || 'unknown';
    return this.mobileAuthService.selfRegister(dto, ipAddress);
  }

  // ============================================
  // CONNEXION
  // ============================================

  @Public()
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone number and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account locked' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.mobileAuthService.login(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('login-pin')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quick login with phone number and PIN' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid PIN' })
  loginWithPin(@Body() dto: LoginPinDto, @Req() req: Request) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.mobileAuthService.loginWithPin(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.mobileAuthService.refreshToken(dto);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout(@CurrentUser() user: any) {
    return this.mobileAuthService.logout(user.phoneNumber);
  }

  // ============================================
  // GESTION MOT DE PASSE & PIN
  // ============================================

  @Patch('change-password')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.mobileAuthService.changePassword(user.phoneNumber, dto);
  }

  @Patch('change-pin')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Change PIN' })
  @ApiResponse({ status: 200, description: 'PIN changed successfully' })
  @ApiResponse({ status: 401, description: 'Current PIN incorrect' })
  changePin(@CurrentUser() user: any, @Body() dto: ChangePinDto) {
    return this.mobileAuthService.changePin(user.phoneNumber, dto);
  }

  @Public()
  @Post('request-password-reset')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({ status: 200, description: 'Reset code sent if account exists' })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto, @Req() req: Request) {
    const ipAddress = req.ip || 'unknown';
    return this.mobileAuthService.requestPasswordReset(dto, ipAddress);
  }

  @Public()
  @Post('reset-password')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.mobileAuthService.resetPassword(dto);
  }

  @Public()
  @Post('resend-otp')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP code' })
  @ApiResponse({ status: 200, description: 'New OTP sent' })
  resendOTP(@Body() dto: ResendOTPDto, @Req() req: Request) {
    const ipAddress = req.ip || 'unknown';
    return this.mobileAuthService.resendOTP(dto, ipAddress);
  }

  // ============================================
  // PROFIL
  // ============================================

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser() user: any) {
    // Cette méthode pourrait être déplacée dans un MobileProfileController
    return {
      id: user.customerId,
      phoneNumber: user.phoneNumber,
      // Ajouter d'autres informations selon les besoins
    };
  }
}