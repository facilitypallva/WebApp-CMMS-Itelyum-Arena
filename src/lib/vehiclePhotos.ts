import { supabase } from '@/lib/supabase';
import { withRequestTimeout } from '@/lib/resilientRequest';

export const VEHICLE_PHOTO_BUCKET = 'vehicles';
export const VEHICLE_PHOTO_MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

export function validateVehicleImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Puoi caricare solo immagini PNG o JPEG';
  }

  if (file.size > VEHICLE_PHOTO_MAX_SIZE) {
    return 'La foto supera il limite di 10MB';
  }

  return null;
}

function sanitizePathPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'vehicle';
}

function getFileExtension(file: File) {
  if (file.type === 'image/png') return 'png';
  return 'jpg';
}

export async function uploadVehiclePhoto(file: File, scope: string) {
  const folder = sanitizePathPart(scope);
  const timestamp = Date.now();
  const safeName = sanitizePathPart(file.name.replace(/\.[^/.]+$/, ''));
  const path = `${folder}/${timestamp}-${safeName}.${getFileExtension(file)}`;

  const { error } = await withRequestTimeout(
    () => supabase.storage.from(VEHICLE_PHOTO_BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    }),
    15_000,
    'Timeout durante il caricamento della foto'
  );

  if (error) throw error;

  const { data } = supabase.storage.from(VEHICLE_PHOTO_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?t=${timestamp}`;
}
