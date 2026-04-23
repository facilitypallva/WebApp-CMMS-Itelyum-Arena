import React, { useRef, useState } from 'react';
import { Send, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { runResilientRequest, withRequestTimeout } from '@/lib/resilientRequest';
import { useLocations } from '@/hooks/useLocations';
import { TICKET_PROBLEM_CATEGORIES } from '@/lib/constants';
import vareseLogo from '@/assets/pallacanestro-varese-logo.png';

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-xl border border-slate-100"
        >
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Segnalazione inviata!</h2>
          {ticketCode && (
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-black px-5 py-2.5 rounded-2xl text-lg mb-6 tracking-wider">
              {ticketCode}
            </div>
          )}
          <p className="text-slate-500 font-medium mb-8">
            La tua segnalazione è stata ricevuta. Il team tecnico interverrà il prima possibile.
            {form.email && ' Riceverai una mail di conferma.'}
          </p>
          <Button
            variant="outline"
            onClick={() => { setSubmitted(false); setForm({ name: '', email: '', location_id: '', problem_category: '', description: '' }); }}
            className="rounded-2xl h-12 px-8 font-bold border-slate-200"
          >
            Invia un'altra segnalazione
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center p-2">
            <img src={vareseLogo} alt="Pallacanestro Varese" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Segnala un Guasto</h1>
          <p className="text-slate-500 font-semibold text-lg">Pallacanestro Varese · Itelyum Arena</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] p-4 bg-white">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl">Dettagli del Problema</CardTitle>
            <CardDescription className="text-base font-medium">
              Fornisci più informazioni possibili per aiutarci ad intervenire velocemente.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Chi segnala */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-bold text-slate-700 ml-1">Chi segnala *</Label>
                  <Input
                    id="name"
                    placeholder="Es. Marco Rossi"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Email di contatto *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m.rossi@example.com"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4"
                  />
                </div>
              </div>

              {/* Dove */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 ml-1">Dove si trova il problema *</Label>
                <Select
                  required
                  value={form.location_id}
                  onValueChange={(v) => setForm({ ...form, location_id: v })}
                  disabled={locationsLoading || locations.length === 0}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4">
                    <SelectValue placeholder={locationsLoading ? 'Caricamento ubicazioni...' : 'Seleziona il locale o l\'area...'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name.replace(/^00_/, '')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!locationsLoading && locations.length === 0 && (
                  <p className="text-xs font-medium text-amber-600">
                    Nessuna ubicazione disponibile. Verifica la policy pubblica di lettura su `locations` in Supabase.
                  </p>
                )}
              </div>

              {/* Tipo di problema */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 ml-1">Tipo di problema *</Label>
                <Select required value={form.problem_category} onValueChange={(v) => setForm({ ...form, problem_category: v })}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4">
                    <SelectValue placeholder="Seleziona la categoria..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {TICKET_PROBLEM_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descrizione */}
              <div className="space-y-2">
                <Label htmlFor="desc" className="text-sm font-bold text-slate-700 ml-1">Descrivi cosa non funziona *</Label>
                <Textarea
                  id="desc"
                  placeholder="Sii specifico: cosa non funziona, da quando, se c'è stato un evento scatenante..."
                  rows={4}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="rounded-[1.5rem] border-slate-100 bg-slate-50/50 p-4"
                />
              </div>

              {/* Foto */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                  <ImageIcon size={16} /> Allega una foto (opzionale)
                </Label>
                {photoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-100">
                    <img src={photoPreview} alt="Anteprima" className="w-full max-h-48 object-cover" />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <ImageIcon size={24} className="text-slate-300" />
                    <span className="text-sm text-slate-400 font-medium">Clicca per caricare una foto</span>
                    <span className="text-xs text-slate-300">JPG, PNG, WebP · max 10MB</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </label>
                )}
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 flex gap-3"
                >
                  {loading ? 'Invio in corso...' : <><span>Invia Segnalazione</span><Send size={20} /></>}
                </Button>
                <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
                  Gestito dal Team Pallacanestro Varese
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
