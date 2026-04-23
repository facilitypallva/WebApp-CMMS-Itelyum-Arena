import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import vareseLogo from '@/assets/pallacanestro-varese-logo.png';

export function LoginPage() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) toast.error('Credenziali non valide');
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center p-6">
      <img
        src="/login-arena-bg.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-30 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-black/85 via-slate-950/60 to-red-950/70" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.16),transparent_34%),linear-gradient(to_top,rgba(0,0,0,0.74),transparent_45%)]" />

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-24 w-24 items-center justify-center p-2 drop-shadow-2xl">
            <img src={vareseLogo} alt="Pallacanestro Varese" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg">Pallacanestro Varese</h1>
          <p className="font-medium text-white/75">CMMS Arena Operations</p>
        </div>

        <div className="rounded-[2rem] border border-white/30 bg-white/90 p-8 shadow-2xl shadow-black/35 backdrop-blur-xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Accedi</h2>
            <p className="text-sm text-slate-500 mt-1">Inserisci le tue credenziali per continuare</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-slate-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@itelyum.it"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-2 border-slate-300 bg-white/95 shadow-sm focus-visible:border-slate-900 focus-visible:ring-slate-900/15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-slate-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-2 border-slate-300 bg-white/95 shadow-sm focus-visible:border-slate-900 focus-visible:ring-slate-900/15"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold text-base shadow-lg shadow-primary/20"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
