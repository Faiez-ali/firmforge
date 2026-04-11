import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Lazy-initialized — checked at call time so missing vars don't break the build.
function getR2(): { client: S3Client; bucket: string } {
  const {
    CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_R2_ACCESS_KEY_ID,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    CLOUDFLARE_R2_BUCKET_NAME,
  } = process.env;

  if (
    !CLOUDFLARE_ACCOUNT_ID ||
    !CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    !CLOUDFLARE_R2_BUCKET_NAME
  ) {
    throw new Error(
      "Missing Cloudflare R2 environment variables. Required: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME"
    );
  }

  return {
    client: new S3Client({
      region: "auto",
      endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
    }),
    bucket: CLOUDFLARE_R2_BUCKET_NAME,
  };
}

/**
 * Upload a zip buffer to R2 and return the object key.
 */
export async function uploadProjectZip(
  projectId: string,
  zipBuffer: Buffer
): Promise<string> {
  const { client, bucket } = getR2();
  const key = `projects/${projectId}/firmware.zip`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
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
  const { client, bucket } = getR2();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: 86400 }); // 24 hours
}
