import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import arenaOsLogo from '@/assets/arenaos-logo-horizontal.svg';

export function LoginPage() {
  const { user, signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberSession, setRememberSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password, rememberSession);
    setLoading(false);
    if (error) toast.error('Credenziali non valide');
  };

  const handlePasswordReset = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error('Inserisci prima la tua email');
      return;
    }

    setResetLoading(true);
    const { error } = await resetPassword(trimmedEmail);
    setResetLoading(false);

    if (error) {
      toast.error('Non sono riuscito a inviare il link di recupero');
      return;
    }

    toast.success('Ti abbiamo inviato un link per reimpostare la password');
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#f8fafc] text-slate-950">
      <img
        src="/login-seats-bg.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-30 h-full w-full object-cover opacity-70 saturate-90 contrast-110"
      />
      <div className="absolute inset-0 -z-20 bg-white/38" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_50%,rgba(255,255,255,0.82),rgba(255,255,255,0)_30%),radial-gradient(circle_at_76%_24%,rgba(241,245,249,0.5),rgba(255,255,255,0)_30%),linear-gradient(115deg,rgba(255,255,255,0.9)_0%,rgba(248,250,252,0.6)_48%,rgba(226,232,240,0.28)_100%)]" />
      <div aria-hidden="true" className="login-light-sweep pointer-events-none absolute inset-y-0 -left-1/3 z-0 w-1/2" />
      <div aria-hidden="true" className="login-ambient-glow pointer-events-none absolute left-[12%] top-[28%] z-0 h-72 w-72 rounded-full bg-white/45 blur-3xl sm:h-96 sm:w-96" />

      <img
        src={arenaOsLogo}
        alt="ArenaOS"
        className="absolute left-6 top-6 z-10 h-9 w-auto max-w-[170px] object-contain drop-shadow-[0_14px_28px_rgba(15,23,42,0.14)] sm:left-10 sm:top-8 sm:h-10 lg:left-14 lg:top-12"
      />

      <main className="grid min-h-screen px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:px-14 lg:py-12">
        <section className="flex items-center justify-center lg:col-start-2">
          <div className="w-full max-w-[420px] rounded-[2rem] border border-white/80 bg-white/90 p-7 py-10 shadow-2xl shadow-slate-900/15 backdrop-blur-md sm:p-10">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Accedi al pannello</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Inserisci le credenziali fornite dal tuo amministratore di impianto.
            </p>

            <form onSubmit={handleSubmit} className="mt-9 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-800">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@itelyumarena.it"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm shadow-sm focus-visible:border-blue-700 focus-visible:ring-blue-700/15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-800">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm shadow-sm focus-visible:border-blue-700 focus-visible:ring-blue-700/15"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(event) => setRememberSession(event.target.checked)}
                    className="size-4 rounded border-slate-300 accent-blue-800"
                  />
                  Resta connesso
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={resetLoading}
                  className="text-sm font-semibold text-blue-800 hover:text-blue-950 disabled:pointer-events-none disabled:opacity-60"
                >
                  {resetLoading ? 'Invio link...' : 'Password dimenticata?'}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-blue-800 text-sm font-bold text-white shadow-lg shadow-blue-900/15 hover:bg-blue-900"
              >
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </Button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
