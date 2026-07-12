import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.R2_ENDPOINT;
const bucket = process.env.R2_BUCKET;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const R2_BUCKET = bucket ?? "";

// ¿Están configuradas las credenciales? (para dar un error claro si faltan)
export function r2Configurado(): boolean {
  return Boolean(endpoint && bucket && accessKeyId && secretAccessKey);
}

let _client: S3Client | null = null;
function client(): S3Client {
  if (!r2Configurado()) {
    throw new Error(
      "R2 no está configurado: define R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID y R2_SECRET_ACCESS_KEY en .env.local",
    );
  }
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });
  }
  return _client;
}

export async function subirObjeto(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string,
): Promise<void> {
  await client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

// URL temporal firmada para VER un objeto (por defecto 1 hora).
export async function urlFirmadaGet(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn },
  );
}

export async function borrarObjeto(key: string): Promise<void> {
  await client().send(
    new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  );
}
