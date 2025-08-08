import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async login(secret: string): Promise<string> {
    const adminSecret = this.configService.get<string>('JWT_SECRET');

    if (secret !== adminSecret) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      username: 'admin',
    };

    return this.jwtService.sign(payload);
  }
}