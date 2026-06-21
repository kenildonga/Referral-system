import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserService } from '../services/user.service';
import {
  FillUserFormDto,
  UpdateUserAgentDto,
  ListAgentsQueryDto,
} from '../dto/user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
  updateAgent(
    @Param('id') id: string,
    @Body() dto: UpdateUserAgentDto,
  ) {
    return this.userService.updateAgent(id, dto);
  }
}
