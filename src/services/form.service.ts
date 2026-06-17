import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form } from '../entities/forms.entity';
import { FormResponse } from '../entities/form-responses.entity';
import {
  CreateFormDto,
  UpdateFormDto,
  SubmitResponseDto,
  FormFieldDto,
} from '../dto/form.dto';
import { PresignUploadDto } from '../dto/form-upload.dto';
import { S3Service } from '../common/helpers/s3.service';
import { I18nService } from '../i18n/i18n.service';

@Injectable()
export class FormService {
  constructor(
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    @InjectRepository(FormResponse)
    private readonly responseRepository: Repository<FormResponse>,
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

  async findAll(): Promise<Form[]> {
    return this.formRepository.find({
      order: { updatedAt: 'DESC' },
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
  }

  async findOne(id: string): Promise<Form> {
    return this.findFormOrFail(id);
  }

  async update(id: string, dto: UpdateFormDto): Promise<Form> {
    const form = await this.findFormOrFail(id);
    if (dto.fields) {
      this.assertValidFields(dto.fields);
    }
    Object.assign(form, dto);
    return this.formRepository.save(form);
  }

  async remove(id: string): Promise<{ message: string }> {
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
  ): Promise<FormResponse> {
    const form = await this.findFormOrFail(formId);
    if (!form.isPublished) {
      throw new BadRequestException('form.notPublished');
    }

    this.assertAnswersMatchSchema(
      form.fields as FormFieldDto[],
      dto.answers,
      formId,
    );

    const response = this.responseRepository.create({
      formId,
      answers: dto.answers,
    });

    return this.responseRepository.save(response);
  }

  async listResponses(formId: string): Promise<FormResponse[]> {
    await this.findFormOrFail(formId);
    return this.responseRepository.find({
      where: { formId },
      order: { submittedAt: 'DESC' },
    });
  }

  async removeResponse(
    formId: string,
    responseId: string,
  ): Promise<{ message: string }> {
    const response = await this.findResponseOrFail(formId, responseId);
    await this.responseRepository.softDelete(responseId);
    void this.deleteResponseFiles(response.answers);
    return { message: this.i18n.t('form.responseDeleted') };
  }

  async presignUpload(
    formId: string,
    dto: PresignUploadDto,
  ): Promise<{ uploadUrl: string; key: string; url: string; expiresIn: number }> {
    const form = await this.findFormOrFail(formId);
    if (!form.isPublished) {
      throw new BadRequestException('form.notPublished');
    }

    this.assertFileUploadAllowed(
      form,
      dto.fieldId,
      dto.contentType,
      dto.size,
    );

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
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    const response = await this.findResponseOrFail(formId, responseId);
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
    const field = (form.fields as FormFieldDto[]).find(
      (f) => f.id === fieldId,
    );

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
        (t) =>
          t === contentType.toLowerCase() || t === ext || t === `.${ext}`,
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
    for (const value of Object.values(answers)) {
      if (
        value &&
        typeof value === 'object' &&
        'kind' in value &&
        value.kind === 'file' &&
        'key' in value &&
        typeof value.key === 'string'
      ) {
        try {
          await this.s3Service.deleteObject(value.key);
        } catch {
          // S3 object can be cleaned by lifecycle rule
        }
      }
    }
  }
}
