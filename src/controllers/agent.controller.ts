import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AgentService } from '../services/agent.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  UpdateAgentStatusDto,
  LoginAgentDto,
  ChangeAgentPasswordDto,
  SignUpAgentDto,
  UpdateAgentProfileDto,
} from '../dto/agent.dto';
import { AdminGuard } from '../common/guards/jwt-admin-auth.guard';
import { AgentGuard } from '../common/guards/jwt-agent-auth.guard';
import { SuperAdminGuard } from '../common/guards/jwt-super-admin-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/auth.interface';
import type { AgentAuthenticatedRequest } from '../common/interfaces/agent-auth.interface';

@ApiTags('agents')
@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) { }

  //////////////////////////////////////////////////////////////////////
  //                            Agent Apis                            //
  //////////////////////////////////////////////////////////////////////

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Agent login (Agent)' })
  login(@Body() loginAgentDto: LoginAgentDto) {
    return this.agentService.login(loginAgentDto);
  }

  @Post('sign-up')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Agent sign up (Agent)' })
  signUp(@Body() signUpAgentDto: SignUpAgentDto) {
    return this.agentService.signUp(signUpAgentDto);
  }

  @Post('logout')
  @UseGuards(AgentGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agent logout (Agent)' })
  logout(@Req() req: AgentAuthenticatedRequest) {
    return this.agentService.logout(req.agent.id);
  }

  @Patch('me/change-password')
  @UseGuards(AgentGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change own password (Agent)' })
  changePassword(
    @Req() req: AgentAuthenticatedRequest,
    @Body() changeAgentPasswordDto: ChangeAgentPasswordDto,
  ) {
    return this.agentService.changePassword(
      req.agent.id,
      changeAgentPasswordDto,
    );
  }

  @Get('me/profile')
  @UseGuards(AgentGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own profile (Agent)' })
  getProfile(@Req() req: AgentAuthenticatedRequest) {
    return this.agentService.getProfile(req.agent.id);
  }

  @Patch('me/profile')
  @UseGuards(AgentGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile (Agent)' })
  updateProfile(
    @Req() req: AgentAuthenticatedRequest,
    @Body() updateAgentProfileDto: UpdateAgentProfileDto,
  ) {
    return this.agentService.updateProfile(req.agent.id, updateAgentProfileDto);
  }

  //////////////////////////////////////////////////////////////////////
  //                            Admin Apis                            //
  //////////////////////////////////////////////////////////////////////

  @Post()
  @UseGuards(AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new agent (Admin and Super Admin)' })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createAgentDto: CreateAgentDto,
  ) {
    return this.agentService.create(createAgentDto, req.admin.id);
  }

  @Get()
  @UseGuards(AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all agents (Admin and Super Admin)' })
  findAll() {
    return this.agentService.findAll();
  }

  @Get(':id')
  @UseGuards(AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an agent by ID (Admin and Super Admin)' })
  findOne(@Param('id') id: string) {
    return this.agentService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update agent details (Admin and Super Admin)' })
  update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    return this.agentService.update(id, updateAgentDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an agent (Admin and Super Admin)' })
  remove(@Param('id') id: string) {
    return this.agentService.remove(id);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update agent active status (Admin and Super Admin)' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateAgentStatusDto: UpdateAgentStatusDto,
  ) {
    return this.agentService.updateStatus(id, updateAgentStatusDto);
  }

  @Patch(':id/reset-password')
  @UseGuards(AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset agent password (Admin and Super Admin)' })
  resetPassword(@Param('id') id: string) {
    return this.agentService.resetPassword(id);
  }
}
