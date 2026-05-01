import React, { useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, LogOut, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { APP_ROLE_LABELS } from '@/lib/constants';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-500/15 text-red-400 border-red-500/20',
  RESPONSABILE: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  TECNICO: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  LETTURA: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
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
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() || null, avatar_url: avatarUrl || null })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profilo aggiornato');
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
      <SheetContent side="left" className="w-80 border-r border-white/[0.06] bg-[#0b1220] p-0 text-slate-200">
        <SheetHeader className="border-b border-white/[0.06] px-6 py-5">
          <SheetTitle className="text-base font-semibold text-white">Il tuo profilo</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <button
              className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-700 to-cyan-400 ring-2 ring-white/10 transition-all hover:ring-cyan-400/40"
              onClick={handleAvatarClick}
              disabled={uploading}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-white">{initials}</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={18} className="text-white" />
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
              <p className="text-[11px] text-slate-400">Caricamento...</p>
            )}
            <p className="text-[11px] text-slate-500">Clicca per cambiare foto</p>
          </div>

          {/* Ruolo badge */}
          <div className="flex justify-center">
            <Badge className={cn('border text-xs font-semibold', ROLE_COLORS[role] ?? ROLE_COLORS.LETTURA)}>
              {APP_ROLE_LABELS[role]}
            </Badge>
          </div>

          {/* Campi */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Nome completo</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nome Cognome"
                className="border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600 focus-visible:ring-cyan-400/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Email</Label>
              <Input
                value={profile?.email ?? ''}
                readOnly
                className="cursor-not-allowed border-white/10 bg-white/[0.02] text-slate-500"
              />
            </div>
          </div>

          {/* Salva */}
          <Button
            onClick={handleSave}
            disabled={saving || uploading}
            className="w-full gap-2 bg-cyan-500 font-semibold text-[#0b1220] hover:bg-cyan-400"
          >
            <Save size={15} />
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </Button>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.06] p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={16} />
            Disconnetti
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
