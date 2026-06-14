import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AgentService } from '../services/agent.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  UpdateAgentStatusDto,
  LoginAgentDto,
  ChangeAgentPasswordDto,
} from '../dto/agent.dto';
import { AdminAuth } from '../common/decorators/admin-auth.decorator';
import { AgentAuth } from '../common/decorators/agent-auth.decorator';
import type { AuthenticatedRequest } from '../common/interfaces/auth.interface';
import type { AgentAuthenticatedRequest } from '../common/interfaces/agent-auth.interface';

@ApiTags('agents')
@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Agent login' })
  login(@Body() loginAgentDto: LoginAgentDto) {
    return this.agentService.login(loginAgentDto);
  }

  @Post('logout')
  @AgentAuth()
  @ApiOperation({ summary: 'Agent logout' })
  logout(@Req() req: AgentAuthenticatedRequest) {
    return this.agentService.logout(req.agent.id);
  }

  @Patch('me/password')
  @AgentAuth()
  @ApiOperation({ summary: 'Change own password' })
  changePassword(
    @Req() req: AgentAuthenticatedRequest,
    @Body() changeAgentPasswordDto: ChangeAgentPasswordDto,
  ) {
    return this.agentService.changePassword(
      req.agent.id,
      changeAgentPasswordDto,
    );
  }

  @Post()
  @AdminAuth()
  @ApiOperation({ summary: 'Create a new agent' })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createAgentDto: CreateAgentDto,
  ) {
    return this.agentService.create(createAgentDto, req.admin.id);
  }

  @Get()
  @AdminAuth()
  @ApiOperation({ summary: 'Get all agents' })
  findAll() {
    return this.agentService.findAll();
  }

  @Get(':id')
  @AdminAuth()
  @ApiOperation({ summary: 'Get an agent by ID' })
  findOne(@Param('id') id: string) {
    return this.agentService.findOne(id);
  }

  @Patch(':id')
  @AdminAuth()
  @ApiOperation({ summary: 'Update agent details' })
  update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    return this.agentService.update(id, updateAgentDto);
  }

  @Delete(':id')
  @AdminAuth()
  @ApiOperation({ summary: 'Delete an agent' })
  remove(@Param('id') id: string) {
    return this.agentService.remove(id);
  }

  @Patch(':id/status')
  @AdminAuth()
  @ApiOperation({ summary: 'Update agent active status' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateAgentStatusDto: UpdateAgentStatusDto,
  ) {
    return this.agentService.updateStatus(id, updateAgentStatusDto);
  }

  @Patch(':id/reset-password')
  @AdminAuth()
  @ApiOperation({ summary: 'Reset agent password' })
  resetPassword(@Param('id') id: string) {
    return this.agentService.resetPassword(id);
  }
}
