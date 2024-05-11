import {
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
  StorageClass,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

const mockS3Client = mockClient(S3Client);

describe('S3Service', () => {
  beforeEach(() => {
    mockS3Client.reset();
  });

  it('should be defined', () => {
    expect(mockS3Client).toBeDefined();
  });

  it('should successfully upload a file to S3', async () => {
    const bucketName = 'fake_bucket_name';
    const mockImageFile = {
      originalname: 'test.png',
      buffer: Buffer.from('test'),
    };
    const uploadParams = {
      Bucket: bucketName,
      Key: mockImageFile.originalname,
      Body: mockImageFile.buffer,
      ACL: ObjectCannedACL.public_read,
      StorageClass: StorageClass.STANDARD,
    };

    mockS3Client
      .on(PutObjectCommand, {
        ...uploadParams,
        Key: expect.any(String),
      })
      .resolves({
        $metadata: {
          httpStatusCode: 200,
        },
      });

    await uploadToS3(mockImageFile);
    expect(
      mockS3Client.commandCalls(PutObjectCommand, uploadParams).length,
    ).toBe(1);
  });
});

const uploadToS3 = async (file) => {
  const bucketName = 'fake_bucket_name';
  const uploadParams = {
    Bucket: bucketName,
    Key: file.originalname,
    Body: file.buffer,
    ACL: ObjectCannedACL.public_read,
    StorageClass: StorageClass.STANDARD,
  };
  const command = new PutObjectCommand(uploadParams);

  return await mockS3Client.send(command);
};
