import React, { useRef, useState } from 'react';
import { Send, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { runResilientRequest, withRequestTimeout } from '@/lib/resilientRequest';
import { useLocations } from '@/hooks/useLocations';
import { TICKET_PROBLEM_CATEGORIES } from '@/lib/constants';
import { ArenaOsLogo } from '@/components/brand/ArenaOsLogo';

async function notifyTicketStakeholders(payload: {
  ticketId: string;
  ticketCode: string;
  reporterName: string;
  reporterEmail: string;
  locationName: string | null;
  problemCategory: string | null;
  description: string;
  photoUrl: string | null;
}) {
  const response = await withRequestTimeout(
    (signal) => fetch('/api/ticket-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    }),
    10_000,
    'Timeout durante l\'invio delle notifiche'
  );

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error || 'Errore durante l\'invio delle notifiche');
  }

  return response.json();
}

export function PublicTicketForm() {
  const { locations, loading: locationsLoading } = useLocations();
  const submitLockRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketCode, setTicketCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', location_id: '', problem_category: '', description: '',
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (file && !file.type.startsWith('image/')) {
      toast.error('Puoi caricare solo immagini');
      e.target.value = '';
      return;
    }

    if (file && file.size > 10 * 1024 * 1024) {
      toast.error('La foto supera il limite di 10MB');
      e.target.value = '';
      return;
    }

    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || loading) return;
    if (!form.location_id) { toast.error('Seleziona un\'ubicazione'); return; }
    if (!form.problem_category) { toast.error('Seleziona il tipo di problema'); return; }
    submitLockRef.current = true;
    setLoading(true);

    try {
      let photoUrl: string | null = null;
      const payload = {
        reporter_name: form.name.trim(),
        reporter_email: form.email.trim().toLowerCase(),
        location_id: form.location_id,
        problem_category: form.problem_category,
        description: form.description.trim(),
        status: 'OPEN' as const,
        photo_url: null as string | null,
      };

      if (photoFile) {
        const safeName = `public_tickets/${Date.now()}_${photoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: uploadError } = await withRequestTimeout(
          (_signal) => supabase.storage.from('tickets').upload(safeName, photoFile, { upsert: false }),
          15_000,
          'Timeout durante il caricamento della foto'
        );

        if (uploadError) {
          console.error('Ticket photo upload failed', uploadError);
          toast.warning('Foto non caricata. Invio la segnalazione senza allegato.');
        } else {
          const { data: publicUrlData } = supabase.storage.from('tickets').getPublicUrl(safeName);
          photoUrl = publicUrlData.publicUrl;
        }
      }

      payload.photo_url = photoUrl;

      const selectedLocationName = locations.find((location) => location.id === form.location_id)?.name ?? null;

      const { data, error } = await runResilientRequest(
        (signal) => supabase.from('tickets').insert(payload).select('id, code').abortSignal(signal).single(),
        {
          label: 'ticket insert',
          timeoutMessage: 'Timeout durante l\'invio della segnalazione',
        }
      );

      if (error) {
        console.error('Ticket insert failed', error);
        toast.error(error.message || 'Errore nell\'invio. Riprova.');
        return;
      }

      setTicketCode(data?.code ?? '');
      setSubmitted(true);
      setPhotoFile(null);
      setPhotoPreview(null);

      try {
        await notifyTicketStakeholders({
          ticketId: data?.id ?? '',
          ticketCode: data?.code ?? '',
          reporterName: payload.reporter_name,
          reporterEmail: payload.reporter_email,
          locationName: selectedLocationName,
          problemCategory: payload.problem_category,
          description: payload.description,
          photoUrl,
        });
      } catch (notificationError) {
        console.error('Ticket stakeholder notification failed', notificationError);
        toast.warning('Segnalazione inviata, ma email e notifiche potrebbero non essere partite correttamente.');
      }
    } catch (error) {
      console.error('Public ticket submit failed', error);
      const message = error instanceof Error ? error.message : 'Errore nell\'invio. Riprova.';
      toast.error(message);
    } finally {
      submitLockRef.current = false;
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="relative min-h-screen bg-[#f8fafc]">
        <img
          src="/login-seats-bg.jpg"
          alt=""
          aria-hidden="true"
          className="fixed inset-0 -z-30 h-full w-full object-cover opacity-60 saturate-50"
        />
        <div className="fixed inset-0 -z-20 bg-white/55" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="shrink-0 px-6 py-3 sm:px-10 lg:px-14">
            <ArenaOsLogo className="h-9 w-[170px] drop-shadow-sm" />
          </header>

          <main className="flex-1 px-6 pb-8 sm:px-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(460px,500px)] lg:items-center lg:px-14 lg:pb-0">
            <div className="hidden lg:block" />
            <section className="flex items-center justify-center py-8 lg:py-0">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full max-w-[480px] rounded-2xl border border-white/80 bg-white/95 p-8 text-center shadow-xl shadow-slate-900/8 backdrop-blur-sm"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#EAFBF1] text-[#1A7A3C]">
                  <CheckCircle2 size={32} strokeWidth={1.75} />
                </div>
                <h2 className="mb-2 text-2xl font-bold tracking-[-0.02em] text-[#1C1B18]">Segnalazione inviata!</h2>
                {ticketCode && (
                  <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-lg bg-[#EAFBF1] px-4 py-2 text-base font-bold tabular-nums tracking-[0.06em] text-[#1A7A3C]">
                    {ticketCode}
                  </div>
                )}
                <p className="mb-6 text-sm leading-relaxed text-[#5F5E5A]">
                  La tua segnalazione è stata ricevuta. Il team tecnico interverrà il prima possibile.
                  {form.email && ' Riceverai una mail di conferma.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', location_id: '', problem_category: '', description: '' }); }}
                  className="h-9 rounded-lg border-[#E5E4DF] px-6 font-semibold text-[#1C1B18] hover:bg-[#F1EFE8]"
                >
                  Invia un'altra segnalazione
                </Button>
              </motion.div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f8fafc]">
      <img
        src="/login-seats-bg.jpg"
        alt=""
        aria-hidden="true"
        className="fixed inset-0 -z-30 h-full w-full object-cover opacity-60 saturate-50"
      />
      <div className="fixed inset-0 -z-20 bg-white/55" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Logo header */}
        <header className="shrink-0 px-6 py-3 sm:px-10 lg:px-14">
          <ArenaOsLogo className="h-9 w-[170px] drop-shadow-sm" />
        </header>

        {/* Two-column grid — fills remaining height, items centered */}
        <main className="flex-1 px-6 pb-8 sm:px-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(460px,500px)] lg:items-center lg:px-14 lg:pb-0">

          {/* Left — hero tagline, desktop only */}
          <div className="hidden lg:flex lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888780]">
                Itelyum Arena
              </p>
              <h2 className="mt-3 text-[48px] font-bold leading-[1.05] tracking-[-0.03em] text-[#1C1B18]">
                Segnala un<br />problema
              </h2>
              <p className="mt-4 max-w-[320px] text-[15px] leading-relaxed text-[#5F5E5A]">
                La tua segnalazione arriva direttamente al team tecnico di manutenzione.
                Interveniamo il prima possibile.
              </p>
            </div>
          </div>

          {/* Right — compact form card */}
          <section className="flex items-start justify-center py-6 lg:items-center lg:py-0">
            <div className="w-full max-w-[480px] rounded-2xl border border-white/80 bg-white/95 shadow-xl shadow-slate-900/8 backdrop-blur-sm">

              {/* Card header */}
              <div className="border-b border-[#E5E4DF]/60 px-6 pb-4 pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#888780]">
                  Itelyum Arena
                </p>
                <h1 className="mt-1.5 text-xl font-bold tracking-[-0.02em] text-[#1C1B18]">
                  Segnala un guasto
                </h1>
                <p className="mt-1 text-sm text-[#5F5E5A]">
                  Compila i dettagli, il team tecnico riceverà subito la richiesta.
                </p>
              </div>

              {/* Form body */}
              <div className="px-6 py-4">
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Chi sei — name + email */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#888780]">Chi sei</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="name" className="text-[12px] font-semibold text-[#1C1B18]">
                          Chi segnala <span className="text-[#E24B4A]">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="Es. Marco Rossi"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="h-9 rounded-lg border-[#E5E4DF] bg-white px-3 text-sm text-[#1C1B18] placeholder:text-[#888780] shadow-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="email" className="text-[12px] font-semibold text-[#1C1B18]">
                          Email <span className="text-[#E24B4A]">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="m.rossi@example.com"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="h-9 rounded-lg border-[#E5E4DF] bg-white px-3 text-sm text-[#1C1B18] placeholder:text-[#888780] shadow-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dove / Problema — location + category */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#888780]">Dove / Problema</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-[12px] font-semibold text-[#1C1B18]">
                          Ubicazione <span className="text-[#E24B4A]">*</span>
                        </Label>
                        <Select
                          required
                          value={form.location_id}
                          onValueChange={(v) => setForm({ ...form, location_id: v })}
                          disabled={locationsLoading || locations.length === 0}
                        >
                          <SelectTrigger className="h-9 rounded-lg border-[#E5E4DF] bg-white text-sm text-[#1C1B18] shadow-none">
                            <SelectValue placeholder={locationsLoading ? 'Caricamento...' : 'Seleziona...'} />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border border-[#E5E4DF]">
                            {locations.map((l) => (
                              <SelectItem key={l.id} value={l.id}>
                                {l.name.replace(/^00_/, '')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[12px] font-semibold text-[#1C1B18]">
                          Tipo problema <span className="text-[#E24B4A]">*</span>
                        </Label>
                        <Select
                          required
                          value={form.problem_category}
                          onValueChange={(v) => setForm({ ...form, problem_category: v })}
                        >
                          <SelectTrigger className="h-9 rounded-lg border-[#E5E4DF] bg-white text-sm text-[#1C1B18] shadow-none">
                            <SelectValue placeholder="Categoria..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border border-[#E5E4DF]">
                            {TICKET_PROBLEM_CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {!locationsLoading && locations.length === 0 && (
                      <p className="text-xs font-medium text-[#A8531A]">
                        Nessuna ubicazione disponibile. Verifica la policy pubblica di lettura su `locations` in Supabase.
                      </p>
                    )}
                  </div>

                  {/* Descrizione */}
                  <div className="space-y-1">
                    <Label htmlFor="desc" className="text-[12px] font-semibold text-[#1C1B18]">
                      Descrizione <span className="text-[#E24B4A]">*</span>
                    </Label>
                    <Textarea
                      id="desc"
                      placeholder="Sii specifico: cosa non funziona, da quando, se c'è stato un evento scatenante..."
                      rows={2}
                      required
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="rounded-lg border-[#E5E4DF] bg-white px-3 py-2 text-sm text-[#1C1B18] placeholder:text-[#888780] shadow-none resize-none"
                    />
                  </div>

                  {/* Foto — compact strip */}
                  <div>
                    {photoPreview ? (
                      <div className="relative overflow-hidden rounded-lg border border-[#E5E4DF]">
                        <img src={photoPreview} alt="Anteprima" className="w-full max-h-28 object-cover" />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-[#E5E4DF] bg-white text-[#5F5E5A] shadow-sm transition-colors hover:text-[#A83228]"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#E5E4DF] bg-[#FAFAF9]/80 transition-colors hover:border-[#2ECC71] hover:bg-[#EAFBF1]">
                        <ImageIcon size={15} className="text-[#888780]" />
                        <span className="text-xs font-medium text-[#5F5E5A]">
                          Foto allegata <span className="text-[#888780]">(opzionale)</span> · max 10MB
                        </span>
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                      </label>
                    )}
                  </div>

                  {/* Submit */}
                  <div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 rounded-lg bg-[#2ECC71] text-[14px] font-semibold text-[#0A3D1F] hover:bg-[#27B463] disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A3D1F] border-t-transparent" />
                          Invio in corso...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Invia segnalazione
                          <Send size={16} />
                        </span>
                      )}
                    </Button>
                    <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-[#888780]">
                      Gestito dal Team Pallacanestro Varese
                    </p>
                  </div>

                </form>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
