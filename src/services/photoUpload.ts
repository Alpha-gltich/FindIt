import { supabase } from './supabase';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const MIN_PHOTO_BYTES = 1024;
const MAX_PHOTO_BYTES = 4.5 * 1024 * 1024;

type ImageType = {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
};

const IMAGE_TYPES: Record<string, ImageType> = {
  jpeg: { contentType: 'image/jpeg', extension: 'jpg' },
  png: { contentType: 'image/png', extension: 'png' },
  webp: { contentType: 'image/webp', extension: 'webp' },
};

/**
 * Decodes base64 JPEG/PNG/WebP data from expo-image-picker into raw bytes.
 * Pure TypeScript so it works in Hermes (React Native) and in the browser.
 */
function base64ToBytes(base64: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor((base64.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let offset = 0;

  for (let i = 0; i < base64.length; i += 1) {
    const index = BASE64_CHARS.indexOf(base64.charAt(i));
    if (index === -1) {
      continue;
    }

    buffer = ((buffer << 6) | index) & 0xffff;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      bytes[offset] = (buffer >> bits) & 0xff;
      offset += 1;
    }
  }

  return bytes.subarray(0, offset);
}

function splitDataUrl(value: string): { mimeType: string | null; base64: string } {
  const match = value.match(/^data:([^;,]+);base64,/);
  if (!match) {
    return { mimeType: null, base64: value };
  }
  return { mimeType: match[1].toLowerCase(), base64: value.slice(match[0].length) };
}

function detectImageType(mimeType: string | null, bytes: Uint8Array): ImageType {
  const mimeName = mimeType?.split('/')[1];
  if (mimeName === 'jpeg' || mimeName === 'jpg') return IMAGE_TYPES.jpeg;
  if (mimeName === 'png') return IMAGE_TYPES.png;
  if (mimeName === 'webp') return IMAGE_TYPES.webp;

  if (bytes[0] === 0xff && bytes[1] === 0xd8) return IMAGE_TYPES.jpeg;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return IMAGE_TYPES.png;
  }
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return IMAGE_TYPES.webp;
  }

  throw new Error('Only JPEG, PNG and WebP photos are supported.');
}

/**
 * Uploads a photo picked with expo-image-picker to the report-photos bucket.
 *
 * expo-image-picker returns the image data as base64, which is decoded here
 * into real bytes. React Native's fetch() cannot reliably read the local file
 * URI returned by the picker (it can return the text "File not found" with a
 * success response), so the base64 data is used instead.
 */
export async function uploadPickedPhoto(
  base64: string | null | undefined,
  userId: string
): Promise<string> {
  if (!base64) {
    throw new Error('That photo could not be read. Please pick it again.');
  }

  const { mimeType, base64: data } = splitDataUrl(base64);
  const bytes = base64ToBytes(data);
  const imageType = detectImageType(mimeType, bytes);

  if (bytes.byteLength < MIN_PHOTO_BYTES) {
    throw new Error('That photo was empty. Please pick it again.');
  }
  if (bytes.byteLength > MAX_PHOTO_BYTES) {
    throw new Error('That photo is too large. Please choose one under 4.5 MB.');
  }

  const fileName = `${userId}/${Date.now()}.${imageType.extension}`;

  const { error: uploadError } = await supabase.storage
    .from('report-photos')
    .upload(fileName, bytes, {
      contentType: imageType.contentType,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicData } = supabase.storage.from('report-photos').getPublicUrl(fileName);
  return publicData.publicUrl;
}
