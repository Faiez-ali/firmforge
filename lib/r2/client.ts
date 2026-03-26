import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

/**
 * Upload a zip buffer to R2 and return the object key.
 */
export async function uploadProjectZip(
  projectId: string,
  zipBuffer: Buffer
): Promise<string> {
  const key = `projects/${projectId}/firmware.zip`;

  await R2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: zipBuffer,
      ContentType: "application/zip",
      Metadata: { projectId },
    })
  );

  return key;
}

/**
 * Generate a pre-signed download URL (24h expiry).
 */
export async function getDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(R2, command, { expiresIn: 86400 }); // 24 hours
}
