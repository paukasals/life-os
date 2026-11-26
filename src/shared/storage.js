import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import path from 'path';

// Cloudflare R2 is S3-API-compatible — same SDK as AWS S3, pointed at R2's
// endpoint. Used to host finished Creative Studio videos at a public URL,
// which Buffer's createPost needs (Buffer's API doesn't accept direct file
// uploads — only a public URL it fetches from).
const REQUIRED_VARS = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL_BASE',
];

function getConfig() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `storage.js: missing required env var(s): ${missing.join(', ')}. ` +
        'See .env.example for what each one is and where to find it in the Cloudflare dashboard.'
    );
  }
  return {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicUrlBase: process.env.R2_PUBLIC_URL_BASE.replace(/\/$/, ''),
  };
}

function getClient(config) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

const CONTENT_TYPE_BY_EXT = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

/**
 * Uploads a local file to the R2 bucket and returns its public URL.
 * @param {string} filePath - local path to the file to upload.
 * @param {string} key - the object key (path) to store it under in the bucket,
 *   e.g. "finished/V3.cut.mp4".
 * @returns {Promise<string>} the public URL Buffer (or anything else) can fetch.
 */
export async function uploadToR2(filePath, key) {
  const config = getConfig();
  const client = getClient(config);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPE_BY_EXT[ext] || 'application/octet-stream';

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentType,
    })
  );

  return `${config.publicUrlBase}/${key}`;
}
