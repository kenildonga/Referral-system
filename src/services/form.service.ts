import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Agent } from '../entities/agents.entity';
import { Form } from '../entities/forms.entity';
import { FormResponse } from '../entities/form-responses.entity';
import { SubmissionUserType } from '../entities/enum';
import { User } from '../entities/users.entity';
import { formatPersonName } from '../common/utils/name.util';
import {
  assertValidDateAnswer,
} from '../common/utils/dateBounds.util';
import {
  CreateFormDto,
  FormFieldDto,
  FormListItemDto,
  FormResponseListItemDto,
  FormResponseSubmitterDto,
  ListFormsQueryDto,
  UpdateFormDto,
  SubmitResponseDto,
} from '../dto/form.dto';
import { PresignUploadDto } from '../dto/form-upload.dto';
import { S3Service } from '../common/helpers/s3.service';
import { I18nService } from '../i18n/i18n.service';
import type {
  FormAccessRequest,
  SubmitterRequest,
} from '../types/auth.types';
import type {
  FileDownloadResponse,
  ApiMessageResponse,
  PresignUploadResponse,
} from '../types/api-response.types';


@Injectable()
export class FormService {
  constructor(
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    @InjectRepository(FormResponse)
    private readonly responseRepository: Repository<FormResponse>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly s3Service: S3Service,
    private readonly i18n: I18nService,
  ) {}

  private async findFormOrFail(id: string): Promise<Form> {
    const form = await this.formRepository.findOne({ where: { id } });

    if (!form) {
      throw new NotFoundException('form.notFound');
    }
    return form;
  }

  private async findResponseOrFail(
    formId: string,
    responseId: string,
  ): Promise<FormResponse> {
    const response = await this.responseRepository.findOne({
      where: { id: responseId, formId },
    });
    if (!response) {
      throw new NotFoundException('form.responseNotFound');
    }
    return response;
  }

  async create(dto: CreateFormDto, adminId: string): Promise<Form> {
    this.assertValidFields(dto.fields);
    const form = this.formRepository.create({
      ...dto,
      createdById: adminId,
    });
    return this.formRepository.save(form);
  }

  async findAll(
    query: ListFormsQueryDto,
    request: FormAccessRequest,
  ): Promise<FormListItemDto[]> {
    const submitter = this.resolveOptionalSubmitter(request);
    if (
      submitter &&
      query.userType &&
      query.userType !== submitter.submitterType
    ) {
      throw new BadRequestException('form.invalidSubmissionUserType');
    }

    const effectiveUserType = submitter?.submitterType ?? query.userType;

    const where: {
      submissionUserType?: SubmissionUserType;
      isPublished?: boolean;
    } = {};

    if (effectiveUserType) {
      where.submissionUserType = effectiveUserType;
    }

    if (submitter) {
      where.isPublished = true;
    }

    const forms = await this.formRepository.find({
      order: { updatedAt: 'DESC' },
      where,
      select: {
        id: true,
        title: true,
        description: true,
        isPublished: true,
        submissionUserType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!submitter || forms.length === 0) {
      if (forms.length === 0) {
        return [];
      }

      const submittedCountByFormId = submitter
        ? new Map<string, number>()
        : await this.getSubmittedCountsByFormIds(forms.map((form) => form.id));

      return forms.map((form) => ({
        ...form,
        isSubmitted: null,
        submittedCount: submitter
          ? null
          : (submittedCountByFormId.get(form.id) ?? 0),
      }));
    }

    const submittedRows = await this.responseRepository.find({
      where: {
        formId: In(forms.map((form) => form.id)),
        submitterId: submitter.submitterId,
        submitterType: submitter.submitterType,
      },
      select: {
        formId: true,
      },
    });

    const submittedFormIds = new Set(submittedRows.map((row) => row.formId));

    return forms.map((form) => ({
      ...form,
      isSubmitted: submittedFormIds.has(form.id),
      submittedCount: null,
    }));
  }

  async findOne(id: string, request: FormAccessRequest): Promise<Form> {
    const form = await this.findFormOrFail(id);
    const submitter = this.resolveOptionalSubmitter(request);

    if (!submitter) {
      return form;
    }

    if (!form.isPublished) {
      throw new BadRequestException('form.notPublished');
    }

    this.assertSubmissionUserTypeAllowed(form, submitter.submitterType);

    return form;
  }

  async update(id: string, dto: UpdateFormDto): Promise<Form> {
    const form = await this.findFormOrFail(id);
    if (dto.fields) {
      this.assertValidFields(dto.fields);
    }
    Object.assign(form, dto);
    return this.formRepository.save(form);
  }

  async remove(id: string): Promise<ApiMessageResponse> {
    await this.findFormOrFail(id);
    const responses = await this.responseRepository.find({
      where: { formId: id },
    });
    for (const response of responses) {
      void this.deleteResponseFiles(response.answers);
    }
    await this.responseRepository.softDelete({ formId: id });
    await this.formRepository.softDelete(id);
    return { message: this.i18n.t('form.deleted') };
  }

  async submitResponse(
    formId: string,
    dto: SubmitResponseDto,
    request: SubmitterRequest,
  ): Promise<FormResponse> {
    const { submitterId, submitterType } = this.resolveSubmitter(request);

    const form = await this.findFormOrFail(formId);

    if (!form.isPublished) {
      throw new BadRequestException('form.notPublished');
    }

    this.assertSubmissionUserTypeAllowed(form, submitterType);

    this.assertAnswersMatchSchema(
      form.fields as FormFieldDto[],
      dto.answers,
      formId,
    );

    const existingResponse = await this.responseRepository.findOne({
      where: {
        formId,
        submitterId,
        submitterType,
      },
      order: { submittedAt: 'DESC' },
    });

    if (existingResponse) {
      const previousAnswers = existingResponse.answers;
      existingResponse.answers = dto.answers;
      const savedResponse =
        await this.responseRepository.save(existingResponse);
      void this.deleteRemovedResponseFiles(previousAnswers, dto.answers);
      return savedResponse;
    }

    const response = this.responseRepository.create({
      formId,
      submitterId,
      submitterType,
      answers: dto.answers,
    });

    return this.responseRepository.save(response);
  }

  private resolveSubmitter(
    request: SubmitterRequest,
  ): { submitterId: string; submitterType: SubmissionUserType } {
    if ('agent' in request && request.agent?.id) {
      return {
        submitterId: request.agent.id,
        submitterType: SubmissionUserType.AGENT,
      };
    }

    if ('user' in request && request.user?.id) {
      return {
        submitterId: request.user.id,
        submitterType: SubmissionUserType.USER,
      };
    }

    throw new UnauthorizedException('auth.invalidOrExpiredToken');
  }

  async listResponses(
    formId: string,
    request: FormAccessRequest,
  ): Promise<FormResponseListItemDto[]> {
    const form = await this.findFormOrFail(formId);
    const submitter = this.resolveOptionalSubmitter(request);

    if (submitter) {
      this.assertSubmissionUserTypeAllowed(form, submitter.submitterType);
    }

    const responses = await this.responseRepository.find({
      where: {
        formId,
        ...(submitter
          ? {
              submitterId: submitter.submitterId,
              submitterType: submitter.submitterType,
            }
          : {}),
      },
      order: { submittedAt: 'DESC' },
    });

    const submitterMap = await this.buildSubmitterMap(responses);

    return responses.map((response) => {
      const submitterKey =
        response.submitterId && response.submitterType
          ? `${response.submitterType}:${response.submitterId}`
          : null;
      const submitter = submitterKey
        ? (submitterMap.get(submitterKey) ?? {
            id: response.submitterId,
            type: response.submitterType,
            name: null,
            phoneNumber: null,
          })
        : {
            id: null,
            type: null,
            name: null,
            phoneNumber: null,
          };

      return {
        id: response.id,
        formId: response.formId,
        submitterId: response.submitterId,
        submitterType: response.submitterType,
        submitter,
        answers: response.answers,
        submittedAt: response.submittedAt,
      };
    });
  }

  async removeResponse(
    formId: string,
    responseId: string,
  ): Promise<ApiMessageResponse> {
    const response = await this.findResponseOrFail(formId, responseId);
    await this.responseRepository.softDelete(responseId);
    void this.deleteResponseFiles(response.answers);
    return { message: this.i18n.t('form.responseDeleted') };
  }

  async presignUpload(
    formId: string,
    dto: PresignUploadDto,
    request: SubmitterRequest,
  ): Promise<PresignUploadResponse> {
    const submitter = this.resolveSubmitter(request);
    const form = await this.findFormOrFail(formId);
    if (!form.isPublished) {
      throw new BadRequestException('form.notPublished');
    }

    this.assertSubmissionUserTypeAllowed(form, submitter.submitterType);

    this.assertFileUploadAllowed(form, dto.fieldId, dto.contentType, dto.size);

    const key = this.s3Service.buildObjectKey(
      formId,
      dto.fieldId,
      dto.fileName,
    );
    const uploadUrl = await this.s3Service.getUploadPresignedUrl(
      key,
      dto.contentType,
    );

    return {
      uploadUrl,
      key,
      url: this.s3Service.buildObjectUrl(key),
      expiresIn: 300,
    };
  }

  async getFileDownloadUrl(
    formId: string,
    responseId: string,
    fieldId: string,
    request: FormAccessRequest,
  ): Promise<FileDownloadResponse> {
    const form = await this.findFormOrFail(formId);
    const submitter = this.resolveOptionalSubmitter(request);
    if (submitter) {
      this.assertSubmissionUserTypeAllowed(form, submitter.submitterType);
    }

    const response = await this.findResponseOrFail(formId, responseId);
    if (
      submitter &&
      (response.submitterId !== submitter.submitterId ||
        response.submitterType !== submitter.submitterType)
    ) {
      throw new ForbiddenException('auth.notAuthorized');
    }

    const fileMeta = response.answers[fieldId];

    if (
      !fileMeta ||
      typeof fileMeta !== 'object' ||
      !('key' in fileMeta) ||
      typeof fileMeta.key !== 'string'
    ) {
      throw new NotFoundException('form.fileNotFound');
    }

    const downloadUrl = await this.s3Service.getDownloadPresignedUrl(
      fileMeta.key,
    );
    return { downloadUrl, expiresIn: 3600 };
  }

  private assertAnswersMatchSchema(
    fields: FormFieldDto[],
    answers: Record<string, unknown>,
    formId: string,
  ): void {
    for (const field of fields) {
      const value = answers[field.id];
      const required = field.validation?.required;

      if (required && (value === undefined || value === null || value === '')) {
        throw new BadRequestException('form.requiredFieldMissing');
      }

      if (
        field.type === 'date' &&
        typeof value === 'string' &&
        value !== ''
      ) {
        try {
          assertValidDateAnswer(value, field.validation);
        } catch {
          throw new BadRequestException('form.invalidDateValue');
        }
      }

      if (
        value &&
        typeof value === 'object' &&
        'kind' in value &&
        value.kind === 'file' &&
        'key' in value &&
        typeof value.key === 'string'
      ) {
        this.assertFileKeyBelongsToForm(value.key, formId, field.id);
      }
    }
  }

  private assertValidFields(fields: FormFieldDto[]): void {
    const ids = new Set<string>();
    const typesWithOptions = new Set([
      'dropdown',
      'multi_dropdown',
      'radio',
      'multi_radio',
      'checkbox_group',
    ]);

    for (const field of fields) {
      if (ids.has(field.id)) {
        throw new BadRequestException('form.duplicateFieldId');
      }
      ids.add(field.id);

      if (
        typesWithOptions.has(field.type) &&
        (!field.options || field.options.length === 0)
      ) {
        throw new BadRequestException('form.optionsRequired');
      }
    }
  }

  private assertFileUploadAllowed(
    form: Form,
    fieldId: string,
    contentType: string,
    sizeBytes: number,
  ): void {
    const field = (form.fields as FormFieldDto[]).find((f) => f.id === fieldId);

    if (!field || field.type !== 'file') {
      throw new BadRequestException('form.fileFieldNotFound');
    }

    const { allowedFileTypes, maxFileSizeMB } = field.validation ?? {};
    const maxBytes = (maxFileSizeMB ?? 10) * 1024 * 1024;

    if (sizeBytes > maxBytes) {
      throw new BadRequestException('form.fileTooLarge');
    }

    if (allowedFileTypes?.length) {
      const ext = contentType.split('/').pop()?.toLowerCase();
      const allowed = allowedFileTypes.map((t) => t.toLowerCase());
      const matches = allowed.some(
        (t) => t === contentType.toLowerCase() || t === ext || t === `.${ext}`,
      );
      if (!matches) {
        throw new BadRequestException('form.fileTypeNotAllowed');
      }
    }
  }

  private assertFileKeyBelongsToForm(
    key: string,
    formId: string,
    fieldId: string,
  ): void {
    const prefix = `forms/${formId}/${fieldId}/`;
    if (!key.startsWith(prefix)) {
      throw new BadRequestException('form.invalidFileKey');
    }
  }

  private async deleteResponseFiles(
    answers: Record<string, unknown>,
  ): Promise<void> {
    for (const key of this.extractFileKeys(answers)) {
      try {
        await this.s3Service.deleteObject(key);
      } catch {
        // S3 object can be cleaned by lifecycle rule
      }
    }
  }

  private async deleteRemovedResponseFiles(
    previousAnswers: Record<string, unknown>,
    nextAnswers: Record<string, unknown>,
  ): Promise<void> {
    const previousKeys = this.extractFileKeys(previousAnswers);
    const nextKeys = this.extractFileKeys(nextAnswers);

    for (const key of previousKeys) {
      if (nextKeys.has(key)) {
        continue;
      }
      try {
        await this.s3Service.deleteObject(key);
      } catch {
        // S3 object can be cleaned by lifecycle rule
      }
    }
  }

  private extractFileKeys(answers: Record<string, unknown>): Set<string> {
    const keys = new Set<string>();
    for (const value of Object.values(answers)) {
      if (
        value &&
        typeof value === 'object' &&
        'kind' in value &&
        value.kind === 'file' &&
        'key' in value &&
        typeof value.key === 'string'
      ) {
        keys.add(value.key);
      }
    }
    return keys;
  }

  private resolveOptionalSubmitter(
    request: FormAccessRequest,
  ): { submitterId: string; submitterType: SubmissionUserType } | null {
    if ('agent' in request && request.agent?.id) {
      return {
        submitterId: request.agent.id,
        submitterType: SubmissionUserType.AGENT,
      };
    }

    if ('user' in request && request.user?.id) {
      return {
        submitterId: request.user.id,
        submitterType: SubmissionUserType.USER,
      };
    }

    return null;
  }

  private assertSubmissionUserTypeAllowed(
    form: Form,
    submitterType: SubmissionUserType,
  ): void {
    if (form.submissionUserType !== submitterType) {
      throw new BadRequestException('form.invalidSubmissionUserType');
    }
  }

  private async getSubmittedCountsByFormIds(
    formIds: string[],
  ): Promise<Map<string, number>> {
    if (formIds.length === 0) {
      return new Map<string, number>();
    }

    const rows = await this.responseRepository
      .createQueryBuilder('response')
      .select('response.formId', 'formId')
      .addSelect('COUNT(response.id)', 'count')
      .where('response.formId IN (:...formIds)', { formIds })
      .groupBy('response.formId')
      .getRawMany<{ formId: string; count: string }>();

    const countMap = new Map<string, number>();
    for (const row of rows) {
      countMap.set(row.formId, Number(row.count));
    }
    return countMap;
  }

  async getUserFormStatsForUsers(
    userIds: string[],
  ): Promise<Map<string, { filled: number; total: number }>> {
    const result = new Map<string, { filled: number; total: number }>();

    const userForms = await this.formRepository.find({
      where: {
        isPublished: true,
        submissionUserType: SubmissionUserType.USER,
      },
      select: { id: true },
    });
    const formIds = userForms.map((form) => form.id);
    const total = formIds.length;

    for (const userId of userIds) {
      result.set(userId, { filled: 0, total });
    }

    if (userIds.length === 0 || formIds.length === 0) {
      return result;
    }

    const rows = await this.responseRepository
      .createQueryBuilder('response')
      .select('response.submitterId', 'submitterId')
      .addSelect('COUNT(DISTINCT response.formId)', 'count')
      .where('response.submitterId IN (:...userIds)', { userIds })
      .andWhere('response.submitterType = :submitterType', {
        submitterType: SubmissionUserType.USER,
      })
      .andWhere('response.formId IN (:...formIds)', { formIds })
      .groupBy('response.submitterId')
      .getRawMany<{ submitterId: string; count: string }>();

    for (const row of rows) {
      const stats = result.get(row.submitterId);
      if (stats) {
        stats.filled = Number(row.count);
      }
    }

    return result;
  }

  async findAllForAssignedUser(
    agentId: string,
    userId: string,
  ): Promise<FormListItemDto[]> {
    await this.assertAgentOwnsUser(agentId, userId);

    const forms = await this.formRepository.find({
      order: { updatedAt: 'DESC' },
      where: {
        submissionUserType: SubmissionUserType.USER,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        isPublished: true,
        submissionUserType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (forms.length === 0) {
      return [];
    }

    const submittedRows = await this.responseRepository.find({
      where: {
        formId: In(forms.map((form) => form.id)),
        submitterId: userId,
        submitterType: SubmissionUserType.USER,
      },
      select: { formId: true },
    });

    const submittedFormIds = new Set(submittedRows.map((row) => row.formId));

    return forms.map((form) => ({
      ...form,
      isSubmitted: submittedFormIds.has(form.id),
      submittedCount: null,
    }));
  }

  async findOneForAssignedUser(
    agentId: string,
    userId: string,
    formId: string,
  ): Promise<Form> {
    await this.assertAgentOwnsUser(agentId, userId);
    const form = await this.findFormOrFail(formId);

    if (!form.isPublished) {
      throw new BadRequestException('form.notPublished');
    }

    if (form.submissionUserType !== SubmissionUserType.USER) {
      throw new BadRequestException('form.invalidSubmissionUserType');
    }

    return form;
  }

  async listResponsesForAssignedUser(
    agentId: string,
    userId: string,
    formId: string,
  ): Promise<FormResponseListItemDto[]> {
    await this.assertAgentOwnsUser(agentId, userId);
    const form = await this.findFormOrFail(formId);

    if (form.submissionUserType !== SubmissionUserType.USER) {
      throw new BadRequestException('form.invalidSubmissionUserType');
    }

    const responses = await this.responseRepository.find({
      where: {
        formId,
        submitterId: userId,
        submitterType: SubmissionUserType.USER,
      },
      order: { submittedAt: 'DESC' },
    });

    const submitterMap = await this.buildSubmitterMap(responses);

    return responses.map((response) => {
      const submitterKey = `${SubmissionUserType.USER}:${userId}`;
      const submitter =
        submitterMap.get(submitterKey) ?? {
          id: userId,
          type: SubmissionUserType.USER,
          name: null,
          phoneNumber: null,
        };

      return {
        id: response.id,
        formId: response.formId,
        submitterId: response.submitterId,
        submitterType: response.submitterType,
        submitter,
        answers: response.answers,
        submittedAt: response.submittedAt,
      };
    });
  }

  async submitResponseForAssignedUser(
    agentId: string,
    userId: string,
    formId: string,
    dto: SubmitResponseDto,
  ): Promise<FormResponse> {
    await this.assertAgentOwnsUser(agentId, userId);

    const form = await this.findFormOrFail(formId);

    if (!form.isPublished) {
      throw new BadRequestException('form.notPublished');
    }

    if (form.submissionUserType !== SubmissionUserType.USER) {
      throw new BadRequestException('form.invalidSubmissionUserType');
    }

    this.assertAnswersMatchSchema(
      form.fields as FormFieldDto[],
      dto.answers,
      formId,
    );

    const existingResponse = await this.responseRepository.findOne({
      where: {
        formId,
        submitterId: userId,
        submitterType: SubmissionUserType.USER,
      },
      order: { submittedAt: 'DESC' },
    });

    if (existingResponse) {
      const previousAnswers = existingResponse.answers;
      existingResponse.answers = dto.answers;
      const savedResponse =
        await this.responseRepository.save(existingResponse);
      void this.deleteRemovedResponseFiles(previousAnswers, dto.answers);
      return savedResponse;
    }

    const response = this.responseRepository.create({
      formId,
      submitterId: userId,
      submitterType: SubmissionUserType.USER,
      answers: dto.answers,
    });

    return this.responseRepository.save(response);
  }

  async presignUploadForAssignedUser(
    agentId: string,
    userId: string,
    formId: string,
    dto: PresignUploadDto,
  ): Promise<PresignUploadResponse> {
    await this.assertAgentOwnsUser(agentId, userId);

    const form = await this.findFormOrFail(formId);
    if (!form.isPublished) {
      throw new BadRequestException('form.notPublished');
    }

    if (form.submissionUserType !== SubmissionUserType.USER) {
      throw new BadRequestException('form.invalidSubmissionUserType');
    }

    this.assertFileUploadAllowed(form, dto.fieldId, dto.contentType, dto.size);

    const key = this.s3Service.buildObjectKey(
      formId,
      dto.fieldId,
      dto.fileName,
    );
    const uploadUrl = await this.s3Service.getUploadPresignedUrl(
      key,
      dto.contentType,
    );

    return {
      uploadUrl,
      key,
      url: this.s3Service.buildObjectUrl(key),
      expiresIn: 300,
    };
  }

  async getFileDownloadUrlForAssignedUser(
    agentId: string,
    userId: string,
    formId: string,
    responseId: string,
    fieldId: string,
  ): Promise<FileDownloadResponse> {
    await this.assertAgentOwnsUser(agentId, userId);

    const response = await this.findResponseOrFail(formId, responseId);
    if (
      response.submitterId !== userId ||
      response.submitterType !== SubmissionUserType.USER
    ) {
      throw new ForbiddenException('auth.notAuthorized');
    }

    const fileMeta = response.answers[fieldId];

    if (
      !fileMeta ||
      typeof fileMeta !== 'object' ||
      !('key' in fileMeta) ||
      typeof fileMeta.key !== 'string'
    ) {
      throw new NotFoundException('form.fileNotFound');
    }

    const downloadUrl = await this.s3Service.getDownloadPresignedUrl(
      fileMeta.key,
    );
    return { downloadUrl, expiresIn: 3600 };
  }

  private async assertAgentOwnsUser(
    agentId: string,
    userId: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, agentId },
    });
    if (!user) {
      throw new NotFoundException(this.i18n.t('user.notFound', { id: userId }));
    }
    return user;
  }

  private async buildSubmitterMap(
    responses: FormResponse[],
  ): Promise<Map<string, FormResponseSubmitterDto>> {
    const submitterMap = new Map<string, FormResponseSubmitterDto>();
    const agentIds = new Set<string>();
    const userIds = new Set<string>();

    for (const response of responses) {
      if (!response.submitterId || !response.submitterType) {
        continue;
      }
      if (response.submitterType === SubmissionUserType.AGENT) {
        agentIds.add(response.submitterId);
      }
      if (response.submitterType === SubmissionUserType.USER) {
        userIds.add(response.submitterId);
      }
    }

    if (agentIds.size > 0) {
      const agents = await this.agentRepository.find({
        where: { id: In(Array.from(agentIds)) },
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          phoneNumber: true,
        },
      });

      for (const agent of agents) {
        submitterMap.set(`${SubmissionUserType.AGENT}:${agent.id}`, {
          id: agent.id,
          type: SubmissionUserType.AGENT,
          name: formatPersonName(agent),
          phoneNumber: agent.phoneNumber ?? null,
        });
      }
    }

    if (userIds.size > 0) {
      const users = await this.userRepository.find({
        where: { id: In(Array.from(userIds)) },
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          phoneNumber: true,
        },
      });

      for (const user of users) {
        submitterMap.set(`${SubmissionUserType.USER}:${user.id}`, {
          id: user.id,
          type: SubmissionUserType.USER,
          name: formatPersonName(user),
          phoneNumber: user.phoneNumber ?? null,
        });
      }
    }

    return submitterMap;
  }
}
