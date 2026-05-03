import { useRef, useState, type DragEvent } from 'react';
import { ImagePlus, Loader2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { validateVehicleImageFile } from '@/lib/vehiclePhotos';

type VehicleImageUploaderProps = {
  imageUrl: string | null;
  previewUrl: string | null;
  fileName?: string | null;
  disabled?: boolean;
  uploading?: boolean;
  onFileSelect: (file: File, previewUrl: string) => void;
  onRemove?: () => void;
};

export function VehicleImageUploader({
  imageUrl,
  previewUrl,
  fileName,
  disabled = false,
  uploading = false,
  onFileSelect,
  onRemove,
}: VehicleImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const activeImage = previewUrl || imageUrl;
  const canPick = !disabled && !uploading;

  const handleFile = (file: File | null) => {
    if (!file || !canPick) return;

    const validationError = validateVehicleImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const nextPreview = typeof event.target?.result === 'string' ? event.target.result : '';
      onFileSelect(file, nextPreview);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0] ?? null);
  };

  return (
    <div className="space-y-2">
      <label
        className={cn(
          'group relative flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[var(--arena-radius-lg)] border border-dashed border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] p-4 text-center transition-all',
          canPick && 'hover:border-[var(--arena-accent)]/40 hover:bg-[var(--arena-accent-soft)]',
          isDragging && 'border-[var(--arena-accent)] bg-[var(--arena-accent-soft)] ring-4 ring-[var(--arena-accent)]/10',
          disabled && 'cursor-default border-solid bg-[var(--arena-surface-subtle)]'
        )}
        onDragOver={(event) => {
          if (!canPick) return;
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {activeImage ? (
          <>
            <img src={activeImage} alt="Foto veicolo" className="h-40 w-full object-contain" />
            {canPick && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-full border border-[var(--arena-border-soft)] bg-[var(--arena-surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--arena-text-primary)] shadow-lg shadow-black/30">
                  Cambia immagine
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface-elevated)] text-[var(--arena-accent)]">
              {uploading ? <Loader2 size={24} className="animate-spin" /> : <ImagePlus size={25} />}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--arena-text-primary)]">
                {canPick ? 'Trascina qui la foto del veicolo' : 'Nessuna immagine caricata'}
              </p>
              <p className="mt-1 text-xs font-medium text-[var(--arena-text-muted)]">
                {canPick ? 'oppure clicca per selezionare PNG/JPEG' : 'Premi Modifica per caricare una foto'}
              </p>
            </div>
            {canPick && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--arena-border-soft)] bg-[var(--arena-surface-elevated)] px-3 py-1 text-xs font-semibold text-[var(--arena-text-secondary)]">
                <UploadCloud size={13} /> Max 10MB
              </span>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          disabled={!canPick}
          onChange={(event) => {
            handleFile(event.target.files?.[0] ?? null);
            event.currentTarget.value = '';
          }}
        />
      </label>

      {(fileName || activeImage) && canPick && onRemove && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--arena-radius-md)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] px-3 py-2">
          <p className="truncate text-xs font-semibold text-[var(--arena-text-muted)]">{fileName || 'Immagine caricata'}</p>
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-[var(--arena-danger)] hover:bg-[var(--arena-danger-soft)] hover:text-[var(--arena-danger)]" onClick={onRemove}>
            <X size={13} /> Rimuovi
          </Button>
        </div>
      )}
    </div>
  );
}
