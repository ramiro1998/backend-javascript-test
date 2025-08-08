import { Controller, Get, Post, Body, Patch, Param, Delete, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() { secret }: { secret: string }) {
    const token = await this.authService.login(secret);
    if (!token) {
      throw new UnauthorizedException('Invalid secret');
    }
    return { access_token: token };
  }
}
