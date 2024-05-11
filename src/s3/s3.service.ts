import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
      region: this.configService.get<string>('AWS_REGION'),
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
  }

  async uploadFileToS3(file: Express.Multer.File): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: `${file.originalname}_${Date.now()}`,
        Body: file.buffer,
        ACL: ObjectCannedACL.public_read,
        StorageClass: 'STANDARD',
      });
      await this.s3Client.send(command);
      return `https://${this.bucketName}.s3.amazonaws.com/${file.originalname}`;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  }
}
