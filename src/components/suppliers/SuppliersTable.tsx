import React, { useMemo, useState } from 'react';
import { Plus, MoreHorizontal, Edit, Trash2, Building2, Phone, Mail, Tag, UserRound, BriefcaseBusiness } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSaveButton } from '@/components/ui/animated-save-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useTechnicians } from '@/hooks/useTechnicians';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Technician, TechnicianEmploymentType, Supplier } from '@/types';
import { TECHNICIAN_EMPLOYMENT_LABELS } from '@/lib/constants';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { waitForSaveFeedback, waitForSaveSuccessFeedback } from '@/lib/saveFeedback';

const EMPTY_SUPPLIER = { name: '', category: '', phone: '', email: '' };
const EMPTY_TECHNICIAN = {
  name: '',
  email: '',
  specialization: '',
  employment_type: 'INTERNAL' as TechnicianEmploymentType,
  supplier_id: '',
};

function normalizeSearchText(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function getTechnicianOrganizationLabel(technician: Technician) {
  if (technician.employment_type === 'INTERNAL') {
    return 'Pallacanestro Varese';
  }

  return technician.supplier?.name ?? 'Fornitore esterno';
}

export function SuppliersTable({
  globalSearch = '',
}: {
  globalSearch?: string;
}) {
  const { suppliers, loading: sLoading, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const {
    technicians,
    loading: tLoading,
    createTechnician,
    updateTechnician,
    deleteTechnician,
  } = useTechnicians();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'technicians'>('suppliers');
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [technicianModalOpen, setTechnicianModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [supplierForm, setSupplierForm] = useState(EMPTY_SUPPLIER);
  const [technicianForm, setTechnicianForm] = useState(EMPTY_TECHNICIAN);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [savingTechnician, setSavingTechnician] = useState(false);
  const normalizedSearch = globalSearch.trim().toLowerCase();

  const filteredSuppliers = useMemo(() => {
    if (!normalizedSearch) return suppliers;

    return suppliers.filter((supplier) =>
      normalizeSearchText([
        supplier.name,
        supplier.category,
        supplier.contact_info?.phone,
        supplier.contact_info?.email,
      ]).includes(normalizedSearch)
    );
  }, [normalizedSearch, suppliers]);

  const filteredTechnicians = useMemo(() => {
    if (!normalizedSearch) return technicians;

    return technicians.filter((technician) =>
      normalizeSearchText([
        technician.name,
        technician.email,
        technician.specialization,
        technician.supplier?.name,
        TECHNICIAN_EMPLOYMENT_LABELS[technician.employment_type],
      ]).includes(normalizedSearch)
    );
  }, [normalizedSearch, technicians]);

  const techniciansBySupplier = useMemo(() => {
    return technicians.reduce<Record<string, Technician[]>>((groups, technician) => {
      if (technician.employment_type !== 'EXTERNAL' || !technician.supplier_id) {
        return groups;
      }

      if (!groups[technician.supplier_id]) {
        groups[technician.supplier_id] = [];
      }

      groups[technician.supplier_id].push(technician);
      return groups;
    }, {});
  }, [technicians]);

  const selectedSupplierName = useMemo(() => {
    if (!technicianForm.supplier_id) return '';

    const matchedSupplier = suppliers.find((supplier) => supplier.id === technicianForm.supplier_id);
    if (matchedSupplier) return matchedSupplier.name;

    if (editingTechnician?.supplier_id === technicianForm.supplier_id) {
      return editingTechnician.supplier?.name ?? '';
    }

    return '';
  }, [editingTechnician, suppliers, technicianForm.supplier_id]);

  const openCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm(EMPTY_SUPPLIER);
    setSupplierModalOpen(true);
  };

  const openEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      category: supplier.category ?? '',
      phone: supplier.contact_info?.phone ?? '',
      email: supplier.contact_info?.email ?? '',
    });
    setSupplierModalOpen(true);
  };

  const openCreateTechnician = () => {
    setEditingTechnician(null);
    setTechnicianForm(EMPTY_TECHNICIAN);
    setTechnicianModalOpen(true);
  };

  const openEditTechnician = (technician: Technician) => {
    setEditingTechnician(technician);
    setTechnicianForm({
      name: technician.name,
      email: technician.email,
      specialization: technician.specialization ?? '',
      employment_type: technician.employment_type,
      supplier_id: technician.supplier_id ?? '',
    });
    setTechnicianModalOpen(true);
  };

  const handleSaveSupplier = async () => {
    if (savingSupplier) return;
    if (!supplierForm.name.trim()) { toast.error('Il nome è obbligatorio'); return; }
    setSavingSupplier(true);
    const saveStartedAt = Date.now();
    const payload = {
      name: supplierForm.name.trim(),
      category: supplierForm.category.trim() || null,
      contact_info: {
        phone: supplierForm.phone.trim() || null,
        email: supplierForm.email.trim() || null,
      },
    };
    try {
      const { error } = editingSupplier ? await updateSupplier(editingSupplier.id, payload) : await createSupplier(payload);
      if (error) {
        console.error('Supplier save error', error);
        toast.error(error.message || 'Errore nel salvataggio');
        return;
      }
      toast.success(editingSupplier ? 'Fornitore aggiornato' : 'Fornitore creato');
      await waitForSaveFeedback(saveStartedAt);
      setSavingSupplier(false);
      await waitForSaveSuccessFeedback();
      setSupplierModalOpen(false);
      setEditingSupplier(null);
      setSupplierForm(EMPTY_SUPPLIER);
    } catch (error) {
      console.error('Supplier save failed', error);
      toast.error(error instanceof Error ? error.message : 'Errore nel salvataggio del fornitore');
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleSaveTechnician = async () => {
    if (savingTechnician) return;
    if (!technicianForm.name.trim()) {
      toast.error('Il nome del tecnico è obbligatorio');
      return;
    }

    if (!technicianForm.email.trim()) {
      toast.error('L’email del tecnico è obbligatoria');
      return;
    }

    if (technicianForm.employment_type === 'EXTERNAL' && !technicianForm.supplier_id) {
      toast.error('Seleziona il fornitore del tecnico esterno');
      return;
    }

    setSavingTechnician(true);
    const saveStartedAt = Date.now();
    const payload = {
      name: technicianForm.name.trim(),
      email: technicianForm.email.trim().toLowerCase(),
      specialization: technicianForm.specialization.trim() || null,
      employment_type: technicianForm.employment_type,
      supplier_id: technicianForm.employment_type === 'EXTERNAL' ? technicianForm.supplier_id : null,
    };
    try {
      const { error } = editingTechnician
        ? await updateTechnician(editingTechnician.id, payload)
        : await createTechnician(payload);
      if (error) {
        console.error('Technician save error', error);
        toast.error(error.message || 'Errore nel salvataggio del tecnico');
        return;
      }
      toast.success(editingTechnician ? 'Tecnico aggiornato' : 'Tecnico creato');
      await waitForSaveFeedback(saveStartedAt);
      setSavingTechnician(false);
      await waitForSaveSuccessFeedback();
      setTechnicianModalOpen(false);
      setEditingTechnician(null);
      setTechnicianForm(EMPTY_TECHNICIAN);
    } catch (error) {
      console.error('Technician save failed', error);
      toast.error(error instanceof Error ? error.message : 'Errore nel salvataggio del tecnico');
    } finally {
      setSavingTechnician(false);
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (!confirm(`Eliminare "${name}"?`)) return;
    const { error } = await deleteSupplier(id);
    if (error) toast.error('Errore durante l\'eliminazione');
    else toast.success('Fornitore eliminato');
  };

  const handleDeleteTechnician = async (id: string, name: string) => {
    if (!confirm(`Eliminare il tecnico "${name}"?`)) return;
    const { error } = await deleteTechnician(id);
    if (error) toast.error('Errore durante l\'eliminazione');
    else toast.success('Tecnico eliminato');
  };

  const actionLabel = activeTab === 'suppliers' ? 'Nuovo Fornitore' : 'Nuovo Tecnico';
  const handlePrimaryAction = () => {
    if (activeTab === 'suppliers') {
      openCreateSupplier();
      return;
    }

    openCreateTechnician();
  };

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-[#E5E4DF] bg-white">
        <div className="border-b border-[#E5E4DF] bg-[#FAFAF9] px-6 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888780]">
            Anagrafiche / Fornitori e Tecnici
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#1C1B18]">Fornitori e Tecnici</h1>
            <p className="mt-0.5 text-sm text-[#5F5E5A]">
              {suppliers.length} fornitori
              {' · '}
              {technicians.filter((t) => t.employment_type === 'INTERNAL').length} interni
              {' · '}
              {technicians.filter((t) => t.employment_type === 'EXTERNAL').length} esterni
            </p>
          </div>
          <Button
            className="h-10 gap-2 rounded-lg bg-[#2ECC71] px-4 text-sm font-semibold text-[#0A3D1F] shadow-none hover:bg-[#27B463]"
            onClick={handlePrimaryAction}
          >
            <Plus size={16} /> {actionLabel}
          </Button>
        </div>
      </div>

      {/* ── Tabs + content ──────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'suppliers' | 'technicians')}>
        <div className="overflow-hidden rounded-xl border border-[#E5E4DF] bg-white">

          {/* Tab bar */}
          <div className="border-b border-[#E5E4DF] bg-[#FAFAF9] px-4 py-3">
            <TabsList className="h-10 rounded-lg bg-[#E5E4DF] p-1">
              <TabsTrigger
                value="suppliers"
                className="h-8 rounded-md px-4 text-sm font-medium text-[#888780] data-[state=active]:bg-white data-[state=active]:text-[#1C1B18] data-[state=active]:shadow-none"
              >
                Fornitori ({filteredSuppliers.length})
              </TabsTrigger>
              <TabsTrigger
                value="technicians"
                className="h-8 rounded-md px-4 text-sm font-medium text-[#888780] data-[state=active]:bg-white data-[state=active]:text-[#1C1B18] data-[state=active]:shadow-none"
              >
                Tecnici ({filteredTechnicians.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Suppliers ─────────────────────────────────────── */}
          <TabsContent value="suppliers" className="mt-0 p-6">
            {sLoading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2ECC71] border-t-transparent" />
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F1EFE8]">
                  <Building2 size={28} className="text-[#888780]" />
                </div>
                <p className="text-base font-bold text-[#1C1B18]">Nessun fornitore trovato</p>
                <p className="mt-1.5 text-sm text-[#5F5E5A]">
                  {globalSearch ? 'Prova con un altro termine di ricerca.' : 'Aggiungi il primo fornitore per iniziare.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSuppliers.map((s) => (
                  <div key={s.id} className="rounded-lg border border-[#E5E4DF] bg-white transition-colors hover:border-[#D3D1C7]">
                    <div className="space-y-3 p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAFBF1]">
                          <Building2 size={18} className="text-[#1A7A3C]" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-[#888780] hover:bg-[#F1EFE8] hover:text-[#1C1B18]">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border border-[#E5E4DF] p-1.5">
                            <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg text-[#1C1B18] focus:bg-[#F1EFE8]" onClick={() => openEditSupplier(s)}>
                              <Edit size={14} /> Modifica
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#E5E4DF]" />
                            <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg text-[#A83228] focus:bg-[#FFF0EE] focus:text-[#A83228]" onClick={() => handleDeleteSupplier(s.id, s.name)}>
                              <Trash2 size={14} /> Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div>
                        <p className="font-semibold text-[#1C1B18]">{s.name}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {s.category && (
                            <span className="flex items-center gap-1 rounded-md bg-[#F1EFE8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5F5E5A]">
                              <Tag size={9} /> {s.category}
                            </span>
                          )}
                          <Popover>
                            <PopoverTrigger
                              render={
                                <button type="button">
                                  <span className="flex cursor-pointer items-center gap-1 rounded-md border border-[#E5E4DF] px-2 py-0.5 text-[10px] font-semibold text-[#888780] hover:bg-[#F1EFE8]">
                                    <UserRound size={10} />
                                    {(techniciansBySupplier[s.id] ?? []).length} tecnici
                                  </span>
                                </button>
                              }
                            />
                            <PopoverContent align="start" className="w-72 rounded-xl border border-[#E5E4DF] p-4">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm font-semibold text-[#1C1B18]">{s.name}</p>
                                  <p className="text-xs text-[#888780]">Tecnici esterni associati</p>
                                </div>
                                {(techniciansBySupplier[s.id] ?? []).length === 0 ? (
                                  <p className="text-sm text-[#5F5E5A]">Nessun tecnico associato.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {(techniciansBySupplier[s.id] ?? []).map((technician) => (
                                      <div key={technician.id} className="rounded-lg border border-[#E5E4DF] bg-[#FAFAF9] px-3 py-2">
                                        <p className="text-sm font-semibold text-[#1C1B18]">{technician.name}</p>
                                        <p className="text-xs text-[#5F5E5A]">{technician.specialization || 'Tecnico generico'}</p>
                                        <p className="mt-0.5 text-xs text-[#888780]">{technician.email}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {(s.contact_info?.phone || s.contact_info?.email) && (
                        <div className="space-y-1 border-t border-[#E5E4DF] pt-3">
                          {s.contact_info.phone && (
                            <p className="flex items-center gap-1.5 text-xs text-[#5F5E5A]">
                              <Phone size={11} className="text-[#888780]" /> {s.contact_info.phone}
                            </p>
                          )}
                          {s.contact_info.email && (
                            <p className="flex items-center gap-1.5 text-xs text-[#5F5E5A]">
                              <Mail size={11} className="text-[#888780]" /> {s.contact_info.email}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Technicians ───────────────────────────────────── */}
          <TabsContent value="technicians" className="mt-0 p-6">
            {tLoading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2ECC71] border-t-transparent" />
              </div>
            ) : filteredTechnicians.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F1EFE8]">
                  <UserRound size={28} className="text-[#888780]" />
                </div>
                <p className="text-base font-bold text-[#1C1B18]">Nessun tecnico trovato</p>
                <p className="mt-1.5 text-sm text-[#5F5E5A]">
                  {globalSearch ? 'Prova con un altro termine di ricerca.' : 'Aggiungi il primo tecnico per iniziare.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTechnicians.map((t) => (
                  <div key={t.id} className="rounded-lg border border-[#E5E4DF] bg-white transition-colors hover:border-[#D3D1C7]">
                    <div className="space-y-3 p-5">
                      <div className="flex items-start justify-between">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          t.employment_type === 'INTERNAL' ? 'bg-[#EAFBF1]' : 'bg-[#F1EFE8]'
                        )}>
                          <UserRound size={18} className={t.employment_type === 'INTERNAL' ? 'text-[#1A7A3C]' : 'text-[#5F5E5A]'} />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-[#888780] hover:bg-[#F1EFE8] hover:text-[#1C1B18]">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border border-[#E5E4DF] p-1.5">
                            <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg text-[#1C1B18] focus:bg-[#F1EFE8]" onClick={() => openEditTechnician(t)}>
                              <Edit size={14} /> Modifica
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#E5E4DF]" />
                            <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg text-[#A83228] focus:bg-[#FFF0EE] focus:text-[#A83228]" onClick={() => handleDeleteTechnician(t.id, t.name)}>
                              <Trash2 size={14} /> Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div>
                        <p className="font-semibold text-[#1C1B18]">{t.name}</p>
                        <p className="text-xs text-[#888780]">{t.specialization || 'Tecnico generico'}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(
                          'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]',
                          t.employment_type === 'INTERNAL'
                            ? 'bg-[#EAFBF1] text-[#1A7A3C]'
                            : 'bg-[#F1EFE8] text-[#5F5E5A]'
                        )}>
                          {TECHNICIAN_EMPLOYMENT_LABELS[t.employment_type]}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[#5F5E5A]">
                          <BriefcaseBusiness size={11} className="text-[#888780]" />
                          {getTechnicianOrganizationLabel(t)}
                        </span>
                      </div>

                      <div className="border-t border-[#E5E4DF] pt-3">
                        <p className="flex items-center gap-1.5 text-xs text-[#5F5E5A]">
                          <Mail size={11} className="text-[#888780]" /> {t.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

        </div>
      </Tabs>

      {/* ── Supplier modal ──────────────────────────────────────── */}
      <Dialog open={supplierModalOpen} onOpenChange={(open) => { setSupplierModalOpen(open); if (!open) setSavingSupplier(false); }}>
        <DialogContent className="w-[min(94vw,960px)] max-w-none sm:max-w-none gap-0 overflow-hidden rounded-xl border border-[#E5E4DF] p-0">
          <DialogHeader className="border-b border-[#E5E4DF] bg-white px-8 py-5">
            <DialogTitle className="text-lg font-bold text-[#1C1B18]">
              {editingSupplier ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 bg-[#FAFAF9] px-8 py-6 max-h-[70vh] overflow-y-auto">
            {/* Anagrafica */}
            <div className="min-w-0 rounded-xl border border-[#E5E4DF] bg-white p-6 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#888780]">Anagrafica</p>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1C1B18]">Nome <span className="text-[#E24B4A]">*</span></Label>
                <Input value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="Es. Tecno Impianti srl" className="h-11 w-full min-w-0 rounded-lg border-[#D3D1C7] bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1C1B18]">Categoria</Label>
                <Input value={supplierForm.category} onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })} placeholder="Es. Antincendio, Elettrico..." className="h-11 w-full min-w-0 rounded-lg border-[#D3D1C7] bg-white" />
              </div>
            </div>
            {/* Contatti */}
            <div className="min-w-0 rounded-xl border border-[#E5E4DF] bg-white p-6 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#888780]">Contatti</p>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1C1B18]">Telefono</Label>
                <Input value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="+39 02..." className="h-11 w-full min-w-0 rounded-lg border-[#D3D1C7] bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1C1B18]">Email</Label>
                <Input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} placeholder="info@fornitore.it" className="h-11 w-full min-w-0 rounded-lg border-[#D3D1C7] bg-white" />
              </div>
            </div>
          </div>
          <DialogFooter className="flex w-full items-center justify-end gap-3 border-t border-[#E5E4DF] bg-white px-8 py-5">
            <Button variant="outline" className="h-11 rounded-lg border-[#E5E4DF] px-6 text-sm font-semibold text-[#5F5E5A] hover:bg-[#F1EFE8]" onClick={() => setSupplierModalOpen(false)}>Annulla</Button>
            <AnimatedSaveButton onClick={handleSaveSupplier} isSaving={savingSupplier} idleLabel="Salva" />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Technician modal ────────────────────────────────────── */}
      <Dialog open={technicianModalOpen} onOpenChange={setTechnicianModalOpen}>
        <DialogContent className="w-[min(94vw,960px)] max-w-none sm:max-w-none gap-0 overflow-hidden rounded-xl border border-[#E5E4DF] p-0">
          <DialogHeader className="border-b border-[#E5E4DF] bg-white px-8 py-5">
            <DialogTitle className="text-lg font-bold text-[#1C1B18]">
              {editingTechnician ? 'Modifica Tecnico' : 'Nuovo Tecnico'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 bg-[#FAFAF9] px-8 py-6 max-h-[70vh] overflow-y-auto">
            {/* Identità tecnico */}
            <div className="min-w-0 rounded-xl border border-[#E5E4DF] bg-white p-6 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#888780]">Identità tecnico</p>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1C1B18]">Nome <span className="text-[#E24B4A]">*</span></Label>
                <Input value={technicianForm.name} onChange={(e) => setTechnicianForm({ ...technicianForm, name: e.target.value })} placeholder="Es. Mario Rossi" className="h-11 w-full min-w-0 rounded-lg border-[#D3D1C7] bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1C1B18]">Email <span className="text-[#E24B4A]">*</span></Label>
                <Input type="email" value={technicianForm.email} onChange={(e) => setTechnicianForm({ ...technicianForm, email: e.target.value })} placeholder="m.rossi@..." className="h-11 w-full min-w-0 rounded-lg border-[#D3D1C7] bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1C1B18]">Specializzazione</Label>
                <Input value={technicianForm.specialization} onChange={(e) => setTechnicianForm({ ...technicianForm, specialization: e.target.value })} placeholder="Es. Elettrico, HVAC..." className="h-11 w-full min-w-0 rounded-lg border-[#D3D1C7] bg-white" />
              </div>
            </div>
            {/* Assegnazione */}
            <div className="min-w-0 rounded-xl border border-[#E5E4DF] bg-white p-6 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#888780]">Assegnazione</p>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-[#1C1B18]">Tipologia</Label>
                <Select
                  value={technicianForm.employment_type}
                  onValueChange={(value) => setTechnicianForm({
                    ...technicianForm,
                    employment_type: value as TechnicianEmploymentType,
                    supplier_id: value === 'EXTERNAL' ? technicianForm.supplier_id : '',
                  })}
                >
                  <SelectTrigger className="h-11 w-full min-w-0 rounded-lg border-[#D3D1C7]"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-lg border border-[#E5E4DF]">
                    <SelectItem value="INTERNAL">Interno</SelectItem>
                    <SelectItem value="EXTERNAL">Esterno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {technicianForm.employment_type === 'EXTERNAL' && (
                <div
                  key={technicianModalOpen ? `${editingTechnician?.id ?? 'new'}-${suppliers.length}` : 'closed'}
                  className="space-y-1.5"
                >
                  <Label className="text-[13px] font-semibold text-[#1C1B18]">Fornitore <span className="text-[#E24B4A]">*</span></Label>
                  <Select value={technicianForm.supplier_id} onValueChange={(value) => setTechnicianForm({ ...technicianForm, supplier_id: value })}>
                    <SelectTrigger className="h-11 w-full min-w-0 rounded-lg border-[#D3D1C7]">
                      <SelectValue placeholder="Seleziona fornitore...">
                        {selectedSupplierName || undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-[#E5E4DF]">
                      {suppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {technicianForm.employment_type === 'INTERNAL' && (
                <div className="rounded-lg border border-[#D3D1C7] bg-[#EAFBF1] px-3 py-2.5 text-xs text-[#1A7A3C]">
                  Questo tecnico sarà considerato manodopera interna di Pallacanestro Varese.
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex w-full items-center justify-end gap-3 border-t border-[#E5E4DF] bg-white px-8 py-5">
            <Button variant="outline" className="h-11 rounded-lg border-[#E5E4DF] px-6 text-sm font-semibold text-[#5F5E5A] hover:bg-[#F1EFE8]" onClick={() => setTechnicianModalOpen(false)}>Annulla</Button>
            <AnimatedSaveButton onClick={handleSaveTechnician} isSaving={savingTechnician} idleLabel="Salva" />
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
