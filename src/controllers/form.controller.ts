import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FormService } from '../services/form.service';
import {
  CreateFormDto,
  UpdateFormDto,
  SubmitResponseDto,
} from '../dto/form.dto';
import { PresignUploadDto } from '../dto/form-upload.dto';
import { AgentGuard } from '../common/guards/jwt-agent-auth.guard';
import { SuperAdminGuard } from '../common/guards/jwt-super-admin-auth.guard';
import { AdminGuard } from '../common/guards/jwt-admin-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/auth.interface';

@ApiTags('forms')
@Controller('forms')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new form schema' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateFormDto) {
    return this.formService.create(dto, req.admin.id);
  }

  @Get()
  @UseGuards(AgentGuard, AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all forms - (All type users)' })
  findAll() {
    return this.formService.findAll();
  }

  @Put(':id')
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save / replace form schema - (Super Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateFormDto) {
    return this.formService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a form and all its responses - (Super Admin)' })
  remove(@Param('id') id: string) {
    return this.formService.remove(id);
  }

  @Get(':id/responses')
  @UseGuards(AgentGuard, AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all submissions for a form - (All type users)' })
  listResponses(@Param('id') id: string) {
    return this.formService.listResponses(id);
  }

  @Delete(':id/responses/:responseId')
  @UseGuards(AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a form submission - (Admin and Super Admin)' })
  removeResponse(
    @Param('id') id: string,
    @Param('responseId') responseId: string,
  ) {
    return this.formService.removeResponse(id, responseId);
  }

  @Post(':id/uploads/presign')
  @UseGuards(AgentGuard, AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Get presigned S3 URL for file upload - (All type users)' })
  presignUpload(@Param('id') id: string, @Body() dto: PresignUploadDto) {
    return this.formService.presignUpload(id, dto);
  }

  @Get(':id/responses/:responseId/files/:fieldId/download')
  @UseGuards(AgentGuard, AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
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
  @UseGuards(AgentGuard, AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get form schema by ID - (All type users)' })
  findOne(@Param('id') id: string) {
    return this.formService.findOne(id);
  }

  @Post(':id/responses')
  @UseGuards(AgentGuard, AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit form response - (All type users)' })
  submit(@Param('id') id: string, @Body() dto: SubmitResponseDto) {
    return this.formService.submitResponse(id, dto);
  }
}
