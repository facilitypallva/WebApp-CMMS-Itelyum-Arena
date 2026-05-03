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
          'group relative flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-4 text-center transition-all',
          canPick && 'hover:border-primary/40 hover:bg-primary/5',
          isDragging && 'border-primary bg-primary/5 ring-4 ring-primary/10',
          disabled && 'cursor-default border-solid bg-slate-50'
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
                <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-lg">
                  Cambia immagine
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-slate-100">
              {uploading ? <Loader2 size={24} className="animate-spin" /> : <ImagePlus size={25} />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {canPick ? 'Trascina qui la foto del veicolo' : 'Nessuna immagine caricata'}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                {canPick ? 'oppure clicca per selezionare PNG/JPEG' : 'Premi Modifica per caricare una foto'}
              </p>
            </div>
            {canPick && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-100">
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
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2">
          <p className="truncate text-xs font-semibold text-slate-500">{fileName || 'Immagine caricata'}</p>
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-red-600 hover:text-red-700" onClick={onRemove}>
            <X size={13} /> Rimuovi
          </Button>
        </div>
      )}
    </div>
  );
}
