import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Send, Signature } from 'lucide-react';
import { motion } from 'motion/react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { runResilientRequest } from '@/lib/resilientRequest';
import arenaOsLogo from '@/assets/arenaos-logo-horizontal.svg';
import pallacanestroLogo from '@/assets/pallacanestro-varese-logo.png';

type BookingFormState = {
  requester_name: string;
  requester_surname: string;
  requester_email: string;
  departure: string;
  destination: string;
  trip_date: string;
  departure_time: string;
  return_time: string;
  reason: string;
};

const EMPTY_FORM: BookingFormState = {
  requester_name: '',
  requester_surname: '',
  requester_email: '',
  departure: '',
  destination: '',
  trip_date: '',
  departure_time: '',
  return_time: '',
  reason: '',
};

function formatToday() {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function getSignatureDelay() {
  return 65 + Math.floor(Math.random() * 56);
}

export default function PublicBookingForm() {
  const { slug } = useParams();
  const submitLockRef = useRef(false);
  const [form, setForm] = useState<BookingFormState>(EMPTY_FORM);
  const [signatureText, setSignatureText] = useState('');
  const [signatureComplete, setSignatureComplete] = useState(false);
  const [lineComplete, setLineComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingCode, setBookingCode] = useState('');

  const signatureName = `${form.requester_name.trim()} ${form.requester_surname.trim()}`.trim();
  const requiredFieldsComplete = useMemo(() => (
    Boolean(
      form.requester_name.trim()
      && form.requester_surname.trim()
      && form.requester_email.trim()
      && form.departure.trim()
      && form.destination.trim()
      && form.trip_date
      && form.departure_time
      && form.reason.trim()
    )
  ), [form]);

  useEffect(() => {
    setSignatureText('');
    setSignatureComplete(false);
    setLineComplete(false);

    if (!requiredFieldsComplete || !signatureName) return;

    let cancelled = false;
    let timeoutId: number | undefined;
    let lineTimeoutId: number | undefined;

    const writeChar = (index: number) => {
      if (cancelled) return;

      setSignatureText(signatureName.slice(0, index));

      if (index >= signatureName.length) {
        setSignatureComplete(true);
        lineTimeoutId = window.setTimeout(() => {
          if (!cancelled) setLineComplete(true);
        }, 580);
        return;
      }

      timeoutId = window.setTimeout(() => writeChar(index + 1), getSignatureDelay());
    };

    timeoutId = window.setTimeout(() => writeChar(1), 160);

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      if (lineTimeoutId) window.clearTimeout(lineTimeoutId);
    };
  }, [requiredFieldsComplete, signatureName]);

  const updateField = (field: keyof BookingFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitLockRef.current || loading) return;

    if (!requiredFieldsComplete || !signatureComplete || !lineComplete) {
      toast.error('Completa tutti i campi obbligatori e attendi la firma digitale');
      return;
    }

    submitLockRef.current = true;
    setLoading(true);

    try {
      const { data: codeData, error: codeError } = await runResilientRequest(
        (signal) => supabase.rpc('next_vehicle_booking_code').abortSignal(signal),
        {
          label: 'vehicle booking code',
          timeoutMessage: 'Timeout durante la generazione del codice prenotazione',
        }
      );

      if (codeError) throw codeError;

      const nextBookingCode = typeof codeData === 'string' ? codeData : '';
      if (!nextBookingCode) throw new Error('Codice prenotazione non generato');

      const payload = {
        booking_code: nextBookingCode,
        requester_name: form.requester_name.trim(),
        requester_surname: form.requester_surname.trim(),
        requester_email: form.requester_email.trim().toLowerCase(),
        departure: form.departure.trim(),
        destination: form.destination.trim(),
        trip_date: form.trip_date,
        departure_time: form.departure_time,
        return_time: form.return_time || null,
        reason: form.reason.trim(),
        signature_name: signatureName,
        status: 'pending' as const,
        fm_notes: slug ? `Richiesta da link /booking/${slug}` : null,
      };

      const { error } = await runResilientRequest(
        (signal) => supabase.from('vehicle_bookings').insert(payload).abortSignal(signal),
        {
          label: 'vehicle booking insert',
          timeoutMessage: 'Timeout durante l\'invio della richiesta',
        }
      );

      if (error) throw error;

      setBookingCode(nextBookingCode);
      setSubmitted(true);
      setForm(EMPTY_FORM);
    } catch (error) {
      console.error('Public booking submit failed', error);
      toast.error(error instanceof Error ? error.message : 'Errore nell\'invio. Riprova.');
    } finally {
      submitLockRef.current = false;
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-[3rem] border border-slate-100 bg-white p-12 text-center shadow-xl"
        >
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="mb-3 text-3xl font-bold text-slate-800">Richiesta inviata.</h2>
          {bookingCode && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-primary/10 px-5 py-2.5 font-mono text-lg font-black tracking-wider text-primary">
              {bookingCode}
            </div>
          )}
          <p className="mb-8 font-medium text-slate-500">
            Il responsabile ti contatterà via email.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setBookingCode('');
            }}
            className="h-12 rounded-2xl border-slate-200 px-8 font-bold"
          >
            Invia un'altra richiesta
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/login-arena-bg.webp')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-white/80" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10" />

      <div className="relative z-10 w-full max-w-2xl space-y-8">
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-4">
            <img src={pallacanestroLogo} alt="Pallacanestro Varese" className="h-16 w-16 rounded-2xl object-contain" />
            <img src={arenaOsLogo} alt="ArenaOS" className="h-14 w-auto max-w-[260px] object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Prenotazione mezzo</h1>
          <p className="text-lg font-semibold text-slate-500">Itelyum Arena · Pallacanestro Varese</p>
        </div>

        <Card className="rounded-[3rem] border-none bg-white p-4 shadow-2xl">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl">Dettagli viaggio</CardTitle>
            <CardDescription className="text-base font-medium">
              Compila la richiesta. Il Facility Manager assegnerà il mezzo disponibile.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="booking-name" className="ml-1 text-sm font-bold text-slate-700">Nome *</Label>
                  <Input id="booking-name" required value={form.requester_name} onChange={(event) => updateField('requester_name', event.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-surname" className="ml-1 text-sm font-bold text-slate-700">Cognome *</Label>
                  <Input id="booking-surname" required value={form.requester_surname} onChange={(event) => updateField('requester_surname', event.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking-email" className="ml-1 text-sm font-bold text-slate-700">Email aziendale *</Label>
                <Input id="booking-email" type="email" required value={form.requester_email} onChange={(event) => updateField('requester_email', event.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="booking-departure" className="ml-1 text-sm font-bold text-slate-700">Partenza *</Label>
                  <Input id="booking-departure" required placeholder="es. Itelyum Arena" value={form.departure} onChange={(event) => updateField('departure', event.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-destination" className="ml-1 text-sm font-bold text-slate-700">Destinazione *</Label>
                  <Input id="booking-destination" required value={form.destination} onChange={(event) => updateField('destination', event.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="booking-date" className="ml-1 text-sm font-bold text-slate-700">Data *</Label>
                  <Input id="booking-date" type="date" required value={form.trip_date} onChange={(event) => updateField('trip_date', event.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-departure-time" className="ml-1 text-sm font-bold text-slate-700">Ora partenza *</Label>
                  <Input id="booking-departure-time" type="time" required value={form.departure_time} onChange={(event) => updateField('departure_time', event.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-return-time" className="ml-1 text-sm font-bold text-slate-700">Ora ritorno</Label>
                  <Input id="booking-return-time" type="time" value={form.return_time} onChange={(event) => updateField('return_time', event.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking-reason" className="ml-1 text-sm font-bold text-slate-700">Motivo del viaggio *</Label>
                <Textarea id="booking-reason" required rows={4} value={form.reason} onChange={(event) => updateField('reason', event.target.value)} className="rounded-[1.5rem] border-slate-100 bg-slate-50/50 p-4" />
              </div>

              {requiredFieldsComplete && (
                <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/60 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Signature size={16} /> Firma digitale
                  </div>
                  <div className="min-h-14 font-serif text-3xl italic text-slate-900">
                    {signatureText}
                    {!signatureComplete && <span className="animate-pulse">|</span>}
                  </div>
                  <div className="mt-3 h-px bg-slate-200">
                    <div
                      className="h-px bg-slate-900 transition-[width] duration-500"
                      style={{ width: signatureComplete ? '100%' : '0%' }}
                    />
                  </div>
                  {lineComplete && (
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      Firmato digitalmente il {formatToday()}
                    </p>
                  )}
                </div>
              )}

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading || !requiredFieldsComplete || !signatureComplete || !lineComplete}
                  className="flex h-14 w-full gap-3 rounded-2xl bg-primary text-lg font-bold text-white shadow-xl shadow-primary/20 hover:bg-primary/90"
                >
                  {loading ? 'Invio in corso...' : <><span>Invia richiesta</span><Send size={20} /></>}
                </Button>
                <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
