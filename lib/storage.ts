import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET || "nat-images";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.dev`;

const client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

export async function uploadImage(
  businessId: string,
  file: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  // Validate file type
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowed.includes(contentType)) {
    throw new Error(`Invalid file type: ${contentType}. Allowed: ${allowed.join(", ")}`);
  }

  // Validate size (5MB max)
  if (file.length > 5 * 1024 * 1024) {
    throw new Error("File too large. Maximum 5MB.");
  }

  // Generate unique key: /[businessId]/[uuid].[ext]
  const ext = filename.split(".").pop() || "jpg";
  const key = `${businessId}/${crypto.randomUUID()}.${ext}`;

  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));

  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteImage(url: string): Promise<void> {
  // Extract key from URL
  const key = url.replace(`${R2_PUBLIC_URL}/`, "");
  if (!key || key === url) return; // not an R2 URL, skip

  await client.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  }));
}

export function isR2Url(url: string): boolean {
  return url.startsWith(R2_PUBLIC_URL);
}
