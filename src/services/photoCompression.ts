import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.72;

function toDataUri(base64: string): string {
  if (base64.startsWith('data:')) {
    return base64;
  }
  return `data:image/jpeg;base64,${base64}`;
}

/**
 * Downsample and compress a picked photo before upload.
 *
 * The original picker base64 is used as a fallback so a manipulation failure
 * never blocks a report from being submitted.
 */
export async function compressPickedPhoto(
  uri: string,
  fallbackBase64?: string | null
): Promise<string> {
  try {
    const context = ImageManipulator.manipulate(uri, {
      maxWidth: MAX_DIMENSION,
      maxHeight: MAX_DIMENSION,
    });
    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({
      compress: JPEG_QUALITY,
      format: SaveFormat.JPEG,
      base64: true,
    });

    if (!result.base64) {
      throw new Error('Compressed photo contained no data.');
    }

    return `data:image/jpeg;base64,${result.base64}`;
  } catch (error) {
    if (fallbackBase64) {
      return toDataUri(fallbackBase64);
    }
    throw error;
  }
}
