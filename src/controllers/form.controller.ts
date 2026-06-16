import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FormService } from '../services/form.service';
import {
  CreateFormDto,
  UpdateFormDto,
  SubmitResponseDto,
} from '../dto/form.dto';
import { PresignUploadDto } from '../dto/form-upload.dto';
import { SuperAdmin } from '../common/decorators/super-admin.decorator';
import { AdminAuth } from '../common/decorators/admin-auth.decorator';
import { AgentAuth } from '../common/decorators/agent-auth.decorator';
import type { AuthenticatedRequest } from '../common/interfaces/auth.interface';

@ApiTags('forms')
@Controller('forms')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post()
  @SuperAdmin()
  @ApiOperation({ summary: 'Create a new form schema' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateFormDto) {
    return this.formService.create(dto, req.admin.id);
  }

  @Get()
  @AgentAuth()
  @ApiOperation({ summary: 'List all forms - (All type users)' })
  findAll() {
    return this.formService.findAll();
  }

  @Put(':id')
  @SuperAdmin()
  @ApiOperation({ summary: 'Save / replace form schema - (Super Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateFormDto) {
    return this.formService.update(id, dto);
  }

  @Delete(':id')
  @SuperAdmin()
  @ApiOperation({ summary: 'Soft-delete a form and all its responses - (Super Admin)' })
  remove(@Param('id') id: string) {
    return this.formService.remove(id);
  }

  @Get(':id/responses')
  @AgentAuth()
  @ApiOperation({ summary: 'List all submissions for a form - (All type users)' })
  listResponses(@Param('id') id: string) {
    return this.formService.listResponses(id);
  }

  @Delete(':id/responses/:responseId')
  @AgentAuth()
  @ApiOperation({ summary: 'Soft-delete a form submission - (All type users)' })
  removeResponse(
    @Param('id') id: string,
    @Param('responseId') responseId: string,
  ) {
    return this.formService.removeResponse(id, responseId);
  }

  @Post(':id/uploads/presign')
  @AgentAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Get presigned S3 URL for file upload - (All type users)' })
  presignUpload(@Param('id') id: string, @Body() dto: PresignUploadDto) {
    return this.formService.presignUpload(id, dto);
  }

  @Get(':id/responses/:responseId/files/:fieldId/download')
  @AgentAuth()
  @ApiOperation({
    summary: 'Get presigned S3 download URL for an uploaded file - (All type users)',
  })
  getFileDownloadUrl(
    @Param('id') id: string,
    @Param('responseId') responseId: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.formService.getFileDownloadUrl(id, responseId, fieldId);
  }

  @Get(':id')
  @AgentAuth()
  @ApiOperation({ summary: 'Get form schema by ID - (All type users)' })
  findOne(@Param('id') id: string) {
    return this.formService.findOne(id);
  }

  @Post(':id/responses')
  @AgentAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit form response - (All type users)' })
  submit(@Param('id') id: string, @Body() dto: SubmitResponseDto) {
    return this.formService.submitResponse(id, dto);
  }
}
