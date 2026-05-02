import React, { useMemo, useState } from 'react';
import { Plus, MoreHorizontal, Edit, Trash2, Building2, Phone, Mail, Tag, UserRound, BriefcaseBusiness } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSaveButton } from '@/components/ui/animated-save-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useTechnicians } from '@/hooks/useTechnicians';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Technician, TechnicianEmploymentType, Supplier } from '@/types';
import { TECHNICIAN_EMPLOYMENT_LABELS } from '@/lib/constants';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'suppliers' | 'technicians')}>
        <div className="flex justify-between items-center">
          <TabsList className="rounded-xl bg-slate-100">
            <TabsTrigger value="suppliers" className="rounded-lg">Fornitori</TabsTrigger>
            <TabsTrigger value="technicians" className="rounded-lg">Tecnici</TabsTrigger>
          </TabsList>
          <Button className="h-10 rounded-lg shadow-lg shadow-primary/20 bg-primary font-bold px-5 gap-2" onClick={handlePrimaryAction}>
            <Plus size={16} /> {actionLabel}
          </Button>
        </div>

        <TabsContent value="suppliers" className="mt-4">
          {sLoading ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.length === 0 && <p className="text-slate-400 col-span-3 text-center py-10">Nessun fornitore trovato</p>}
              {filteredSuppliers.map((s) => (
                <Card key={s.id} className="arena-card hover:shadow-md transition-all">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Building2 size={22} />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreHorizontal size={16} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl p-2">
                          <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" onClick={() => openEditSupplier(s)}><Edit size={14} /> Modifica</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer text-red-600" onClick={() => handleDeleteSupplier(s.id, s.name)}><Trash2 size={14} /> Elimina</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{s.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {s.category && <p className="text-xs text-slate-400 flex items-center gap-1"><Tag size={11} /> {s.category}</p>}
                        <Popover>
                          <PopoverTrigger
                            render={
                              <button type="button">
                                <Badge variant="outline" className="cursor-pointer rounded-full border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                                  <UserRound size={11} />
                                  {(techniciansBySupplier[s.id] ?? []).length} tecnici
                                </Badge>
                              </button>
                            }
                          />
                          <PopoverContent align="start" className="w-80 rounded-xl p-3">
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-bold text-slate-800">{s.name}</p>
                                <p className="text-xs text-slate-400">Tecnici esterni associati</p>
                              </div>
                              {(techniciansBySupplier[s.id] ?? []).length === 0 ? (
                                <p className="text-sm text-slate-500">Nessun tecnico associato a questo fornitore.</p>
                              ) : (
                                <div className="space-y-2">
                                  {(techniciansBySupplier[s.id] ?? []).map((technician) => (
                                    <div key={technician.id} className="rounded-xl bg-slate-50 px-3 py-2">
                                      <p className="text-sm font-semibold text-slate-800">{technician.name}</p>
                                      <p className="text-xs text-slate-500">{technician.specialization || 'Tecnico generico'}</p>
                                      <p className="mt-1 text-xs text-slate-400">{technician.email}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    {s.contact_info?.phone && <p className="text-xs text-slate-500 flex items-center gap-1.5"><Phone size={12} /> {s.contact_info.phone}</p>}
                    {s.contact_info?.email && <p className="text-xs text-slate-500 flex items-center gap-1.5"><Mail size={12} /> {s.contact_info.email}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="technicians" className="mt-4">
          {tLoading ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTechnicians.length === 0 && <p className="text-slate-400 col-span-3 text-center py-10">Nessun tecnico trovato</p>}
              {filteredTechnicians.map((t) => (
                <Card key={t.id} className="arena-card hover:shadow-md transition-all">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-primary">
                        <UserRound size={22} />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreHorizontal size={16} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl p-2">
                          <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" onClick={() => openEditTechnician(t)}><Edit size={14} /> Modifica</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer text-red-600" onClick={() => handleDeleteTechnician(t.id, t.name)}><Trash2 size={14} /> Elimina</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.specialization || 'Tecnico generico'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {TECHNICIAN_EMPLOYMENT_LABELS[t.employment_type]}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        <BriefcaseBusiness size={12} />
                        {getTechnicianOrganizationLabel(t)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5"><Mail size={12} /> {t.email}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={supplierModalOpen} onOpenChange={(open) => { setSupplierModalOpen(open); if (!open) setSavingSupplier(false); }}>
        <DialogContent className="rounded-xl max-w-md">
          <DialogHeader><DialogTitle>{editingSupplier ? 'Modifica Fornitore' : 'Nuovo Fornitore'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="Es. Tecno Impianti srl" className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Input value={supplierForm.category} onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })} placeholder="Es. Antincendio, Elettrico..." className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label>Telefono</Label>
              <Input value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="+39 02..." className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} placeholder="info@fornitore.it" className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setSupplierModalOpen(false)}>Annulla</Button>
            <AnimatedSaveButton onClick={handleSaveSupplier} isSaving={savingSupplier} idleLabel="Salva" />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={technicianModalOpen} onOpenChange={setTechnicianModalOpen}>
        <DialogContent className="rounded-xl max-w-md">
          <DialogHeader><DialogTitle>{editingTechnician ? 'Modifica Tecnico' : 'Nuovo Tecnico'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={technicianForm.name} onChange={(e) => setTechnicianForm({ ...technicianForm, name: e.target.value })} placeholder="Es. Mario Rossi" className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={technicianForm.email} onChange={(e) => setTechnicianForm({ ...technicianForm, email: e.target.value })} placeholder="m.rossi@..." className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label>Specializzazione</Label>
              <Input value={technicianForm.specialization} onChange={(e) => setTechnicianForm({ ...technicianForm, specialization: e.target.value })} placeholder="Es. Elettrico, HVAC..." className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label>Tipologia tecnico</Label>
              <Select
                value={technicianForm.employment_type}
                onValueChange={(value) => setTechnicianForm({
                  ...technicianForm,
                  employment_type: value as TechnicianEmploymentType,
                  supplier_id: value === 'EXTERNAL' ? technicianForm.supplier_id : '',
                })}
              >
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="INTERNAL">Interno</SelectItem>
                  <SelectItem value="EXTERNAL">Esterno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {technicianForm.employment_type === 'EXTERNAL' && (
              <div
                key={technicianModalOpen ? `${editingTechnician?.id ?? 'new'}-${suppliers.length}` : 'closed'}
                className="space-y-1"
              >
                <Label>Fornitore *</Label>
                <Select value={technicianForm.supplier_id} onValueChange={(value) => setTechnicianForm({ ...technicianForm, supplier_id: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Seleziona fornitore...">
                      {selectedSupplierName || undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {suppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {technicianForm.employment_type === 'INTERNAL' && (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Questo tecnico sara considerato manodopera interna di Pallacanestro Varese.
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setTechnicianModalOpen(false)}>Annulla</Button>
            <AnimatedSaveButton onClick={handleSaveTechnician} isSaving={savingTechnician} idleLabel="Salva" />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
