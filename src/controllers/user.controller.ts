import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserService } from '../services/user.service';
import {
  FillUserFormDto,
  SendRegistrationOtpDto,
  UpdateUserAgentDto,
  ListAgentsQueryDto,
  LoginUserDto,
} from '../dto/user.dto';
import { AllRoleAuthInterceptor } from '../common/interceptors/all-role-auth.interceptor';
import type { UserAuthenticatedRequest } from '../types/auth.types';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'User login (User)' })
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }

  @Post('logout')
  @UseInterceptors(AllRoleAuthInterceptor(['user']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout (User)' })
  logout(@Req() req: UserAuthenticatedRequest) {
    return this.userService.logout(req.user.id);
  }

  @Get('me')
  @UseInterceptors(AllRoleAuthInterceptor(['user']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own profile (User)' })
  findMe(@Req() req: UserAuthenticatedRequest) {
    return this.userService.findMe(req.user.id);
  }

  @Post('register/send-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Send registration OTP to phone' })
  sendRegistrationOtp(@Body() dto: SendRegistrationOtpDto) {
    return this.userService.sendRegistrationOtp(dto);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Fill user referral form' })
  fillForm(@Body() dto: FillUserFormDto) {
    return this.userService.fillForm(dto);
  }

  @Get('agents')
  @ApiOperation({ summary: 'List active agents by state and city' })
  findAgentsByLocation(@Query() query: ListAgentsQueryDto) {
    return this.userService.findAgentsByLocation(query);
  }

  @Patch(':id/agent')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Assign agent to user' })
  updateAgent(@Param('id') id: string, @Body() dto: UpdateUserAgentDto) {
    return this.userService.updateAgent(id, dto);
  }
}
