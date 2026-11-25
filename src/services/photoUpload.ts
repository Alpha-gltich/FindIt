import { supabase } from './supabase';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const MIN_PHOTO_BYTES = 1024;

/**
 * Decodes the base64 JPEG data returned by expo-image-picker.
 * Pure TypeScript so it works in Hermes (React Native) and in the browser.
 */
function base64ToBytes(base64: string): Uint8Array {
  const value = base64.includes(',') ? base64.slice(base64.indexOf(',') + 1) : base64;
  const bytes = new Uint8Array(Math.floor((value.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let offset = 0;

  for (let i = 0; i < value.length; i += 1) {
    const index = BASE64_CHARS.indexOf(value.charAt(i));
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

/**
 * Uploads a photo picked with expo-image-picker to the report-photos bucket.
 *
 * expo-image-picker returns the image data as base64, which is decoded here
 * into raw bytes. React Native's fetch() cannot reliably read the local file
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

  const bytes = base64ToBytes(base64);

  if (bytes.byteLength < MIN_PHOTO_BYTES) {
    throw new Error('That photo was empty. Please pick it again.');
  }

  const fileName = `${userId}/${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('report-photos')
    .upload(fileName, bytes, {
      contentType: 'image/jpeg',
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('report-photos').getPublicUrl(fileName);
  return data.publicUrl;
}
