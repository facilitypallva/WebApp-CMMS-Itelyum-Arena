import { addDays, differenceInDays } from 'date-fns';
import { AssetStatus } from '@/types';

export function calculateAssetStatus(lastVerification: string | null, frequencyDays: number): AssetStatus {
  if (!lastVerification) return 'SCADUTO';
  const next = addDays(new Date(lastVerification), frequencyDays);
  const days = differenceInDays(next, new Date());
  if (days < 0) return 'SCADUTO';
  if (days <= 30) return 'IN SCADENZA';
  return 'IN REGOLA';
}

export function getNextVerificationDate(lastVerification: string | null, frequencyDays: number): Date | null {
  if (!lastVerification) return null;
  return addDays(new Date(lastVerification), frequencyDays);
}

export interface ParsedAssetSerial {
  raw: string;
  equipmentCode: string;
  locationCode: string;
  progressiveCode: string;
}

export function parseAssetSerial(serial: string | null | undefined): ParsedAssetSerial | null {
  if (!serial) return null;
  const cleaned = serial.trim().toUpperCase();
  const match = cleaned.match(/^([A-Z0-9]+)-([A-Z0-9]+)-(\d{3})$/);
  if (!match) return null;

  return {
    raw: cleaned,
    equipmentCode: match[1],
    locationCode: match[2],
    progressiveCode: match[3],
  };
}
