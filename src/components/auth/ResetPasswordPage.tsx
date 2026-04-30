import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import arenaOsLogo from '@/assets/arenaos-logo-horizontal.svg';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { loading, session, updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('La password deve contenere almeno 8 caratteri');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }

    setSaving(true);
    const { error } = await updatePassword(password);

    if (error) {
      setSaving(false);
      toast.error('Non sono riuscito ad aggiornare la password');
      return;
    }

    await signOut();
    toast.success('Password aggiornata. Ora puoi accedere.');
    navigate('/login', { replace: true });
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
          <div className="w-full max-w-[420px] rounded-[2rem] border border-white/80 bg-white/90 p-7 shadow-2xl shadow-slate-900/15 backdrop-blur-md sm:p-9">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Reset password</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Imposta nuova password</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Scegli una nuova password per il tuo account ArenaOS.
            </p>

            {loading ? (
              <div className="mt-8 flex justify-center">
                <div className="size-8 rounded-full border-4 border-blue-800 border-t-transparent animate-spin" />
              </div>
            ) : session ? (
              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-semibold text-slate-800">Nuova password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Almeno 8 caratteri"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm shadow-sm focus-visible:border-blue-700 focus-visible:ring-blue-700/15"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-slate-800">Conferma password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Ripeti la password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm shadow-sm focus-visible:border-blue-700 focus-visible:ring-blue-700/15"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="h-11 w-full rounded-xl bg-blue-800 text-sm font-bold text-white shadow-lg shadow-blue-900/15 hover:bg-blue-900"
                >
                  {saving ? 'Salvataggio...' : 'Aggiorna password'}
                </Button>
              </form>
            ) : (
              <div className="mt-7 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-600">
                Il link di recupero non e valido o e scaduto. Richiedine uno nuovo dalla pagina di login.
              </div>
            )}

            <Link to="/login" className="mt-7 block text-center text-sm font-semibold text-blue-800 hover:text-blue-950">
              Torna al login
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
