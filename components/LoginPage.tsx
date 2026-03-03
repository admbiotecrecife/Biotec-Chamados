'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Lock, User, ArrowRight, Building2 } from 'lucide-react';
import Image from 'next/image';

interface LoginPageProps {
  onLogin: (user: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/users');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro na resposta do servidor');
      }

      if (!Array.isArray(data)) {
        throw new Error('Formato de dados inválido recebido do servidor');
      }

      const userFound = data.find((u: any) => 
        u.login.toLowerCase().trim() === email.toLowerCase().trim() && u.pass.trim() === password.trim()
      );

      if (userFound) {
        onLogin(userFound.login);
      } else {
        setError('Usuário ou senha incorretos. Verifique suas credenciais.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message === 'Failed to fetch' ? 'Erro ao conectar com o servidor.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f8] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="bg-[#00a859] p-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="text-3xl font-bold">b</span>
          </div>
          <h1 className="text-2xl font-bold">Painel de Chamados</h1>
          <p className="mt-2 text-white/80">Gestão de Manutenção Biotec</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="email">
                E-mail ou Usuário
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  className="w-full rounded-lg border-slate-200 bg-slate-50 py-3 pl-10 text-slate-900 focus:border-[#00a859] focus:ring-[#00a859]"
                  id="email"
                  type="text"
                  placeholder="admin@condominio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  className="w-full rounded-lg border-slate-200 bg-slate-50 py-3 pl-10 text-slate-900 focus:border-[#00a859] focus:ring-[#00a859]"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-medium text-red-500"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00a859] py-4 text-base font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Acessar Painel
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Esqueceu sua senha? Entre em contato com o suporte Biotec.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
