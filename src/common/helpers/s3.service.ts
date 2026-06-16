import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET!;
    this.client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      ...(process.env.AWS_S3_ENDPOINT
        ? {
            endpoint: process.env.AWS_S3_ENDPOINT,
            forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
          }
        : {}),
    });
  }

  buildObjectKey(formId: string, fieldId: string, fileName: string): string {
    const uploadId = crypto.randomUUID();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `forms/${formId}/${fieldId}/${uploadId}_${safeName}`;
  }

  buildObjectUrl(key: string): string {
    if (process.env.AWS_S3_ENDPOINT) {
      return `${process.env.AWS_S3_ENDPOINT}/${this.bucket}/${key}`;
    }
    const region = process.env.AWS_REGION;
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  async getUploadPresignedUrl(
    key: string,
    contentType: string,
    expiresIn = 300,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async getDownloadPresignedUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
