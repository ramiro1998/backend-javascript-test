import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({ summary: 'Login to get token for authorization' })
  @ApiResponse({ status: 201, description: 'access_token.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        secret: {
          type: 'string',
          example: 'your_secret_key',
        },
      },
    },
  })

  login(@Body() { secret }: { secret: string }) {
    const token = this.authService.login(secret);
    if (!token) {
      throw new UnauthorizedException('Invalid secret');
    }
    return { access_token: token };
  }
}
