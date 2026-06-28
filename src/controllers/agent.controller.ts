import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AgentService } from '../services/agent.service';
import { FormService } from '../services/form.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  UpdateAgentStatusDto,
  LoginAgentDto,
  ChangeAgentPasswordDto,
  SignUpAgentDto,
  SendAgentRegistrationOtpDto,
  UpdateAgentProfileDto,
} from '../dto/agent.dto';
import { AllRoleAuthInterceptor } from '../common/interceptors/all-role-auth.interceptor';
import { UpdateUserDto, ListMyUsersQueryDto, UpdateUserStatusDto } from '../dto/user.dto';
import { SubmitResponseDto } from '../dto/form.dto';
import { PresignUploadDto } from '../dto/form-upload.dto';
import type {
  AgentAuthenticatedRequest,
  AuthenticatedRequest,
} from '../types/auth.types';

@ApiTags('agents')
@Controller('agents')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly formService: FormService,
  ) {}

  //////////////////////////////////////////////////////////////////////
  //                            Agent Apis                            //
  //////////////////////////////////////////////////////////////////////

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Agent login (Agent)' })
  login(@Body() loginAgentDto: LoginAgentDto) {
    return this.agentService.login(loginAgentDto);
  }

  @Post('register/send-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Send registration OTP to phone (Agent sign-up)' })
  sendRegistrationOtp(@Body() dto: SendAgentRegistrationOtpDto) {
    return this.agentService.sendRegistrationOtp(dto);
  }

  @Post('sign-up')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Agent sign up (Agent)' })
  signUp(@Body() signUpAgentDto: SignUpAgentDto) {
    return this.agentService.signUp(signUpAgentDto);
  }

  @Post('logout')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agent logout (Agent)' })
  logout(@Req() req: AgentAuthenticatedRequest) {
    return this.agentService.logout(req.agent.id);
  }

  @Patch('me/change-password')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
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
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own profile (Agent)' })
  getProfile(@Req() req: AgentAuthenticatedRequest) {
    return this.agentService.getProfile(req.agent.id);
  }

  @Patch('me/profile')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile (Agent)' })
  updateProfile(
    @Req() req: AgentAuthenticatedRequest,
    @Body() updateAgentProfileDto: UpdateAgentProfileDto,
  ) {
    return this.agentService.updateProfile(req.agent.id, updateAgentProfileDto);
  }

  @Get('me/users')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users assigned to logged-in agent (Agent)' })
  findMyUsers(
    @Req() req: AgentAuthenticatedRequest,
    @Query() query: ListMyUsersQueryDto,
  ) {
    return this.agentService.findMyUsers(req.agent.id, query);
  }

  @Get('me/users/:id')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assigned user details (Agent)' })
  findMyUserById(
    @Req() req: AgentAuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.agentService.findMyUserById(req.agent.id, id);
  }

  @Get('me/users/:id/approval-info')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get approval info for chain assignment (Agent)' })
  getApprovalInfo(
    @Req() req: AgentAuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.agentService.getApprovalInfo(req.agent.id, id);
  }

  @Get('me/chain-referrals')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get chain referrals for logged-in agent (Agent)' })
  getMyChainReferrals(@Req() req: AgentAuthenticatedRequest) {
    return this.agentService.getMyChainReferrals(req.agent.id);
  }

  @Patch('me/users/:id/status')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject assigned user (Agent)' })
  updateMyUserStatus(
    @Req() req: AgentAuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.agentService.updateMyUserStatus(
      req.agent.id,
      id,
      updateUserStatusDto,
    );
  }

  @Patch('me/users/:id')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update assigned user details (Agent)' })
  updateMyUser(
    @Req() req: AgentAuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.agentService.updateMyUser(req.agent.id, id, updateUserDto);
  }

  @Delete('me/users/:id')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete assigned user (Agent)' })
  removeMyUser(@Req() req: AgentAuthenticatedRequest, @Param('id') id: string) {
    return this.agentService.removeMyUser(req.agent.id, id);
  }

  @Get('me/users/:id/forms')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user forms for assigned user (Agent)' })
  findUserForms(
    @Req() req: AgentAuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.formService.findAllForAssignedUser(req.agent.id, id);
  }

  @Get('me/users/:id/forms/:formId')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user form schema for assigned user (Agent)' })
  findUserForm(
    @Req() req: AgentAuthenticatedRequest,
    @Param('id') id: string,
    @Param('formId') formId: string,
  ) {
    return this.formService.findOneForAssignedUser(req.agent.id, id, formId);
  }

  @Get('me/users/:id/forms/:formId/responses')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user form responses for assigned user (Agent)' })
  listUserFormResponses(
    @Req() req: AgentAuthenticatedRequest,
    @Param('id') id: string,
    @Param('formId') formId: string,
  ) {
    return this.formService.listResponsesForAssignedUser(
      req.agent.id,
      id,
      formId,
    );
  }

  @Post('me/users/:id/forms/:formId/responses')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit user form on behalf of assigned user (Agent)' })
  submitUserFormResponse(
    @Req() req: AgentAuthenticatedRequest,
    @Param('id') id: string,
    @Param('formId') formId: string,
    @Body() dto: SubmitResponseDto,
  ) {
    return this.formService.submitResponseForAssignedUser(
      req.agent.id,
      id,
      formId,
      dto,
    );
  }

  @Post('me/users/:id/forms/:formId/uploads/presign')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Presign file upload for assigned user form (Agent)' })
  presignUserFormUpload(
    @Req() req: AgentAuthenticatedRequest,
    @Param('id') id: string,
    @Param('formId') formId: string,
    @Body() dto: PresignUploadDto,
  ) {
    return this.formService.presignUploadForAssignedUser(
      req.agent.id,
      id,
      formId,
      dto,
    );
  }

  @Get('me/users/:id/forms/:formId/responses/:responseId/files/:fieldId/download')
  @UseInterceptors(AllRoleAuthInterceptor(['agent']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download file from assigned user form response (Agent)' })
  getUserFormFileDownloadUrl(
    @Req() req: AgentAuthenticatedRequest,
    @Param('id') id: string,
    @Param('formId') formId: string,
    @Param('responseId') responseId: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.formService.getFileDownloadUrlForAssignedUser(
      req.agent.id,
      id,
      formId,
      responseId,
      fieldId,
    );
  }

  //////////////////////////////////////////////////////////////////////
  //                            Admin Apis                            //
  //////////////////////////////////////////////////////////////////////

  @Post()
  @UseInterceptors(AllRoleAuthInterceptor(['admin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new agent (Admin and Super Admin)' })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createAgentDto: CreateAgentDto,
  ) {
    return this.agentService.create(createAgentDto, req.admin.id);
  }

  @Get()
  @UseInterceptors(AllRoleAuthInterceptor(['admin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all agents (Admin and Super Admin)' })
  findAll() {
    return this.agentService.findAll();
  }

  @Get(':id')
  @UseInterceptors(AllRoleAuthInterceptor(['admin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an agent by ID (Admin and Super Admin)' })
  findOne(@Param('id') id: string) {
    return this.agentService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(AllRoleAuthInterceptor(['admin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update agent details (Admin and Super Admin)' })
  update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    return this.agentService.update(id, updateAgentDto);
  }

  @Delete(':id')
  @UseInterceptors(AllRoleAuthInterceptor(['admin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an agent (Admin and Super Admin)' })
  remove(@Param('id') id: string) {
    return this.agentService.remove(id);
  }

  @Patch(':id/status')
  @UseInterceptors(AllRoleAuthInterceptor(['admin']))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update agent active status (Admin and Super Admin)',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() updateAgentStatusDto: UpdateAgentStatusDto,
  ) {
    return this.agentService.updateStatus(id, updateAgentStatusDto);
  }

  @Patch(':id/reset-password')
  @UseInterceptors(AllRoleAuthInterceptor(['admin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset agent password (Admin and Super Admin)' })
  resetPassword(@Param('id') id: string) {
    return this.agentService.resetPassword(id);
  }
}
