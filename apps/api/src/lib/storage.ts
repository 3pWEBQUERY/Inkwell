import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { Env } from '../env.js';

export interface Storage {
  readonly enabled: boolean;
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<{ body: Uint8Array; contentType: string } | null>;
  remove(key: string): Promise<void>;
  presignedGetUrl(key: string, expiresInSeconds: number, filename: string): Promise<string>;
}

/**
 * S3-compatible object storage in the EU (Railway bucket). Falls back to an
 * in-memory map when not configured, so local development works without credentials.
 */
export function createStorage(env: Env): Storage {
  const configured = Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);

  if (!configured) {
    const memory = new Map<string, { body: Uint8Array; contentType: string }>();
    return {
      enabled: false,
      async put(key, body, contentType) {
        memory.set(key, { body, contentType });
      },
      async get(key) {
        return memory.get(key) ?? null;
      },
      async remove(key) {
        memory.delete(key);
      },
      async presignedGetUrl(key) {
        return `${env.APP_ORIGIN}/api/exports/${encodeURIComponent(key)}`;
      },
    };
  }

  const bucket = env.S3_BUCKET ?? '';
  const client = new S3Client({
    region: env.S3_REGION,
    ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT } : {}),
    forcePathStyle: env.S3_FORCE_PATH_STYLE === '1',
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? '',
    },
  });

  return {
    enabled: true,
    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
      );
    },
    async get(key) {
      try {
        const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        if (!result.Body) return null;
        const body = await result.Body.transformToByteArray();
        return { body, contentType: result.ContentType ?? 'application/octet-stream' };
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          error.name === 'NoSuchKey'
        )
          return null;
        throw error;
      }
    },
    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
    async presignedGetUrl(key, expiresInSeconds, filename) {
      return getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          ResponseContentDisposition: `attachment; filename="${filename}"`,
        }),
        { expiresIn: expiresInSeconds },
      );
    },
  };
}
