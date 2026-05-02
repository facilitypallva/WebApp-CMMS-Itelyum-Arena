import React, { useMemo, useState } from 'react';
import { Plus, Search, ShieldCheck, UserCog, MoreHorizontal, Pencil, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AnimatedSaveButton } from '@/components/ui/animated-save-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { APP_ROLE_LABELS } from '@/lib/constants';
import { AppRole, UserProfile } from '@/types';

type UserFormState = {
  full_name: string;
  email: string;
  role: AppRole;
  is_active: boolean;
  password: string;
};

const EMPTY_FORM: UserFormState = {
  full_name: '',
  email: '',
  role: 'LETTURA',
  is_active: true,
  password: '',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function getRoleBadgeClass(role: AppRole) {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'RESPONSABILE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'TECNICO':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'LETTURA':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function UsersManagement() {
  const { profiles, loading, createUser, updateUser, fetchProfiles } = useProfiles();
  const { user: currentUser, refreshProfile } = useAuth();
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return profiles;

    return profiles.filter((profile) =>
      [profile.full_name, profile.email, profile.role]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [profiles, query]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (profile: UserProfile) => {
    setEditingUser(profile);
    setForm({
      full_name: profile.full_name ?? '',
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active,
      password: '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error('Il nome completo è obbligatorio');
      return;
    }

    if (!form.email.trim()) {
      toast.error('L’email è obbligatoria');
      return;
    }

    if (!editingUser && !form.password.trim()) {
      toast.error('La password temporanea è obbligatoria');
      return;
    }

    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      is_active: form.is_active,
      password: form.password.trim() || undefined,
    };

    const { error } = editingUser
      ? await updateUser(editingUser.id, payload)
      : await createUser({ ...payload, password: form.password.trim() });

    setSaving(false);

    if (error) {
      console.error('User save error', error);
      toast.error(error.message || 'Errore nel salvataggio utente');
      return;
    }

    if (editingUser?.id === currentUser?.id) {
      await refreshProfile();
    }

    toast.success(editingUser ? 'Utente aggiornato' : 'Utente creato');
    setModalOpen(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  };

  const handleToggleActive = async (profile: UserProfile) => {
    setSaving(true);
    const { error } = await updateUser(profile.id, {
      full_name: profile.full_name ?? '',
      email: profile.email,
      role: profile.role,
      is_active: !profile.is_active,
    });
    setSaving(false);

    if (error) {
      console.error('User activation error', error);
      toast.error(error.message || 'Errore nell’aggiornamento stato utente');
      return;
    }

    if (profile.id === currentUser?.id) {
      await refreshProfile();
    }

    toast.success(!profile.is_active ? 'Utente riattivato' : 'Utente disattivato');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Search className="h-5 w-5 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca per nome, email o ruolo..."
            className="w-[320px] border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-lg gap-2" onClick={() => fetchProfiles(true)}>
            <RefreshCw size={16} />
            Aggiorna
          </Button>
          <Button className="rounded-lg gap-2 font-bold shadow-lg shadow-primary/20" onClick={openCreateModal}>
            <Plus size={16} />
            Nuovo Utente
          </Button>
        </div>
      </div>

      <div className="arena-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-6 py-4">Utente</TableHead>
              <TableHead className="px-6 py-4">Email</TableHead>
              <TableHead className="px-6 py-4">Ruolo</TableHead>
              <TableHead className="px-6 py-4">Stato</TableHead>
              <TableHead className="px-6 py-4">Creato</TableHead>
              <TableHead className="px-6 py-4 text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-10 text-center text-slate-400">
                  Caricamento utenti...
                </TableCell>
              </TableRow>
            )}

            {!loading && filteredProfiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-10 text-center text-slate-400">
                  Nessun utente trovato
                </TableCell>
              </TableRow>
            )}

            {!loading && filteredProfiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      {profile.role === 'ADMIN' ? <ShieldCheck size={18} /> : <UserCog size={18} />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{profile.full_name || 'Utente senza nome'}</p>
                      <p className="text-xs text-slate-400">
                        {profile.id === currentUser?.id ? 'Utente corrente' : APP_ROLE_LABELS[profile.role]}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-slate-600">{profile.email}</TableCell>
                <TableCell className="px-6 py-4">
                  <Badge className={`rounded-full border ${getRoleBadgeClass(profile.role)}`}>
                    {APP_ROLE_LABELS[profile.role]}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge className={`rounded-full border ${profile.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {profile.is_active ? 'Attivo' : 'Disattivato'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-slate-500">{formatDate(profile.created_at)}</TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex">
                        <Button variant="ghost" size="icon" className="rounded-lg">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-lg">
                      <DropdownMenuItem onClick={() => openEditModal(profile)} className="gap-2">
                        <Pencil size={14} />
                        Modifica
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => void handleToggleActive(profile)}
                        className="gap-2"
                        disabled={saving}
                      >
                        <ShieldCheck size={14} />
                        {profile.is_active ? 'Disattiva' : 'Riattiva'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl rounded-xl p-0 overflow-hidden">
          <DialogHeader className="border-b px-8 py-6">
            <DialogTitle className="text-2xl font-bold">
              {editingUser ? 'Modifica Utente' : 'Nuovo Utente'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 px-8 py-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="user-full-name">Nome completo</Label>
              <Input
                id="user-full-name"
                value={form.full_name}
                onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                placeholder="Mario Rossi"
                className="h-12 rounded-lg"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="mario.rossi@varesebasket.it"
                className="h-12 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Ruolo</Label>
              <Select value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value as AppRole }))}>
                <SelectTrigger className="h-12 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {Object.entries(APP_ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stato</Label>
              <Select
                value={form.is_active ? 'active' : 'inactive'}
                onValueChange={(value) => setForm((current) => ({ ...current, is_active: value === 'active' }))}
              >
                <SelectTrigger className="h-12 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="active">Attivo</SelectItem>
                  <SelectItem value="inactive">Disattivato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="user-password">
                {editingUser ? 'Nuova password temporanea' : 'Password temporanea'}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={editingUser ? 'Lascia vuoto per non cambiarla' : 'Inserisci una password iniziale'}
                className="h-12 rounded-lg"
              />
            </div>
          </div>

          <DialogFooter className="border-t px-8 py-6">
            <Button variant="outline" className="rounded-lg" onClick={() => setModalOpen(false)}>
              Annulla
            </Button>
            <AnimatedSaveButton className="rounded-lg" onClick={() => void handleSave()} isSaving={saving} idleLabel="Salva" />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
