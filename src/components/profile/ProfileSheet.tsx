import React, { useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AnimatedSaveButton } from '@/components/ui/animated-save-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, LogOut, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { APP_ROLE_LABELS } from '@/lib/constants';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { waitForSaveFeedback, waitForSaveSuccessFeedback } from '@/lib/saveFeedback';

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'border-[#E24B4A]/25 bg-[#FFF0EE] text-[#A83228]',
  RESPONSABILE: 'border-[#2ECC71]/25 bg-[#EAFBF1] text-[#1A7A3C]',
  TECNICO: 'border-[#E8782A]/25 bg-[#FFF3E8] text-[#A8531A]',
  LETTURA: 'border-[#E5E4DF] bg-[#F1EFE8] text-[#5F5E5A]',
};

export function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const { profile, role, refreshProfile, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setAvatarUrl(profile?.avatar_url ?? '');
  }, [profile?.full_name, profile?.avatar_url]);

  const initials = (profile?.full_name ?? profile?.email ?? '??')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${profile.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(url);
    } catch {
      toast.error('Errore nel caricamento immagine');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const saveStartedAt = Date.now();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() || null, avatar_url: avatarUrl || null })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profilo aggiornato');
      await waitForSaveFeedback(saveStartedAt);
      setSaving(false);
      await waitForSaveSuccessFeedback();
      onOpenChange(false);
    } catch {
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Disconnesso');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[360px] border-r border-[#E5E4DF] bg-[#FAFAF9] p-0 text-[#1C1B18] shadow-[12px_0_32px_-24px_rgba(28,27,24,0.35)]">
        <SheetHeader className="border-b border-[#E5E4DF] bg-white px-6 py-5">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#888780]">Account</p>
            <SheetTitle className="text-lg font-bold tracking-[-0.02em] text-[#1C1B18]">Il tuo profilo</SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-5 p-5">
          {/* Avatar */}
          <div className="rounded-xl border border-[#E5E4DF] bg-white p-5 shadow-[0_1px_2px_rgba(28,27,24,0.04)]">
          <div className="flex flex-col items-center gap-3">
            <button
              className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#1C1B18] text-[#FAFAF9] ring-4 ring-[#F1EFE8] transition-all hover:ring-[#2ECC71]/25 focus-visible:outline-none focus-visible:ring-[#2ECC71]/40"
              onClick={handleAvatarClick}
              disabled={uploading}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-[#FAFAF9]">{initials}</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#1C1B18]/60 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={18} className="text-[#FAFAF9]" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            {uploading && (
              <p className="text-[11px] font-medium text-[#5F5E5A]">Caricamento...</p>
            )}
            <p className="text-[11px] font-semibold text-[#888780]">Clicca per cambiare foto</p>
          </div>
          </div>

          {/* Ruolo badge */}
          <div className="flex justify-center rounded-xl border border-[#E5E4DF] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(28,27,24,0.04)]">
            <Badge className={cn('rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]', ROLE_COLORS[role] ?? ROLE_COLORS.LETTURA)}>
              {APP_ROLE_LABELS[role]}
            </Badge>
          </div>

          {/* Campi */}
          <div className="space-y-4 rounded-xl border border-[#E5E4DF] bg-white p-4 shadow-[0_1px_2px_rgba(28,27,24,0.04)]">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-[#1C1B18]">Nome completo</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nome Cognome"
                className="h-10 rounded-lg border-[#E5E4DF] bg-white text-sm font-medium text-[#1C1B18] placeholder:text-[#888780] focus-visible:border-[#2ECC71] focus-visible:ring-[#2ECC71]/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-[#1C1B18]">Email</Label>
              <Input
                value={profile?.email ?? ''}
                readOnly
                className="h-10 cursor-not-allowed rounded-lg border-[#E5E4DF] bg-[#F1EFE8] text-sm font-medium text-[#5F5E5A]"
              />
            </div>
          </div>

          {/* Salva */}
          <AnimatedSaveButton
            onClick={handleSave}
            disabled={saving || uploading}
            isSaving={saving}
            idleLabel="Salva modifiche"
            idleIcon={<Save size={15} />}
            className="w-full rounded-xl bg-[#2ECC71] font-semibold text-[#0A3D1F] shadow-[0_8px_18px_-12px_rgba(46,204,113,0.75)] hover:bg-[#27B463] focus-visible:ring-[#2ECC71]/30"
          />
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#E5E4DF] bg-white p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#A83228] transition-colors hover:bg-[#FFF0EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E24B4A]/30"
          >
            <LogOut size={16} />
            Disconnetti
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
