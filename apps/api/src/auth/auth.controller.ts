import {
  type LoginInput,
  type LoginResponse,
  type Profile,
  type RegisterInput,
  loginSchema,
  registerSchema,
} from '@ai-tools/shared'
import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, UseGuards } from '@nestjs/common'
import { ZodValidationPipe } from '../common/zod-validation.pipe.js'
import { UsersService } from '../users/users.service.js'
import { AccessTokenGuard, UserId } from './access-token.guard.js'
import { AuthService } from './auth.service.js'

@Controller('v1')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput, @Ip() ip: string) {
    return this.auth.login(body, ip)
  }

  // Registering also logs the new user in, so it answers like a login.
  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
  ): Promise<LoginResponse> {
    return this.auth.register(body)
  }

  // The example of a guarded endpoint: copy its two decorators for anything that needs a login.
  @Get('profile')
  @UseGuards(AccessTokenGuard)
  profile(@UserId() userId: number): Promise<Profile> {
    return this.users.profileOf(userId)
  }
}
