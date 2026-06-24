import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FormService } from '../services/form.service';
import {
  CreateFormDto,
  ListFormsQueryDto,
  UpdateFormDto,
  SubmitResponseDto,
} from '../dto/form.dto';
import { PresignUploadDto } from '../dto/form-upload.dto';
import { AllRoleAuthInterceptor } from '../common/interceptors/all-role-auth.interceptor';
import type { AuthenticatedRequest } from '../common/interfaces/auth.interface';
import type { AgentAuthenticatedRequest } from '../common/interfaces/agent-auth.interface';
import type { UserAuthenticatedRequest } from '../common/interfaces/user-auth.interface';

@ApiTags('forms')
@Controller('forms')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post()
  @UseInterceptors(AllRoleAuthInterceptor(['superAdmin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new form schema' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateFormDto) {
    return this.formService.create(dto, req.admin.id);
  }

  @Get()
  @UseInterceptors(AllRoleAuthInterceptor(['all']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all forms - (All type users)' })
  findAll(
    @Req()
    req:
      | AuthenticatedRequest
      | AgentAuthenticatedRequest
      | UserAuthenticatedRequest,
    @Query() query: ListFormsQueryDto,
  ) {
    return this.formService.findAll(query, req);
  }

  @Put(':id')
  @UseInterceptors(AllRoleAuthInterceptor(['superAdmin']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save / replace form schema - (Super Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateFormDto) {
    return this.formService.update(id, dto);
  }

  @Delete(':id')
  @UseInterceptors(AllRoleAuthInterceptor(['superAdmin']))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Soft-delete a form and all its responses - (Super Admin)',
  })
  remove(@Param('id') id: string) {
    return this.formService.remove(id);
  }

  @Get(':id/responses')
  @UseInterceptors(AllRoleAuthInterceptor(['all']))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all submissions for a form - (All type users)',
  })
  listResponses(
    @Param('id') id: string,
    @Req()
    req:
      | AuthenticatedRequest
      | AgentAuthenticatedRequest
      | UserAuthenticatedRequest,
  ) {
    return this.formService.listResponses(id, req);
  }

  @Delete(':id/responses/:responseId')
  @UseInterceptors(AllRoleAuthInterceptor(['admin']))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Soft-delete a form submission - (Admin and Super Admin)',
  })
  removeResponse(
    @Param('id') id: string,
    @Param('responseId') responseId: string,
  ) {
    return this.formService.removeResponse(id, responseId);
  }

  @Post(':id/uploads/presign')
  @UseInterceptors(AllRoleAuthInterceptor(['agent', 'user']))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get presigned S3 URL for file upload - (Agent and User)',
  })
  presignUpload(
    @Param('id') id: string,
    @Req() req: AgentAuthenticatedRequest | UserAuthenticatedRequest,
    @Body() dto: PresignUploadDto,
  ) {
    return this.formService.presignUpload(id, dto, req);
  }

  @Get(':id/responses/:responseId/files/:fieldId/download')
  @UseInterceptors(AllRoleAuthInterceptor(['all']))
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get presigned S3 download URL for an uploaded file - (All type users)',
  })
  getFileDownloadUrl(
    @Param('id') id: string,
    @Param('responseId') responseId: string,
    @Param('fieldId') fieldId: string,
    @Req()
    req:
      | AuthenticatedRequest
      | AgentAuthenticatedRequest
      | UserAuthenticatedRequest,
  ) {
    return this.formService.getFileDownloadUrl(id, responseId, fieldId, req);
  }

  @Get(':id')
  @UseInterceptors(AllRoleAuthInterceptor(['all']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get form schema by ID - (All type users)' })
  findOne(
    @Param('id') id: string,
    @Req()
    req:
      | AuthenticatedRequest
      | AgentAuthenticatedRequest
      | UserAuthenticatedRequest,
  ) {
    return this.formService.findOne(id, req);
  }

  @Post(':id/responses')
  @UseInterceptors(AllRoleAuthInterceptor(['agent', 'user']))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit form response - (Agent and User)' })
  submit(
    @Param('id') id: string,
    @Req() req: AgentAuthenticatedRequest | UserAuthenticatedRequest,
    @Body() dto: SubmitResponseDto,
  ) {
    return this.formService.submitResponse(id, dto, req);
  }
}
