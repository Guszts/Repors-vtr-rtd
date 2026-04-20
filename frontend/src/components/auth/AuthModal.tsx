import React, { useState } from "react";
import type { ReactNode } from "react";
import { X, Mail, Lock, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";

type Mode = "login" | "signup";

export default function AuthModal({
  open,
  onClose,
  initial = "login",
}: {
  open: boolean;
  onClose: () => void;
  initial?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const res =
      mode === "login"
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, fullName || email.split("@")[0]);
    setLoading(false);
    if (res.error) setError(res.error);
    else {
      if (mode === "signup") setInfo("Conta criada! Verifique seu email (se ativado) e entre.");
      else onClose();
    }
  };

  const google = async () => {
    setError(null);
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);
    if (res.error)
      setError(
        res.error +
          " — configure o provedor Google em Supabase > Authentication > Providers para habilitar."
      );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          data-testid="auth-modal"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-7 pb-10 shadow-2xl relative"
          >
            <button
              onClick={onClose}
              data-testid="auth-close"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <span className="inline-block bg-red-100 text-red-700 font-bold uppercase tracking-widest text-[10px] px-3 py-1 rounded-full">
                {mode === "login" ? "Entrar" : "Criar conta"}
              </span>
              <h2 className="text-3xl font-black tracking-tight text-stone-900 mt-3">
                {mode === "login" ? "Bem-vindo de volta" : "Vamos começar"}
              </h2>
              <p className="text-stone-500 font-medium mt-1">
                {mode === "login"
                  ? "Entre para acompanhar seus pedidos e pontos fidelidade."
                  : "Cadastre-se e ganhe vantagens exclusivas da Vitória."}
              </p>
            </div>

            <button
              onClick={google}
              disabled={loading}
              data-testid="auth-google"
              className="w-full border-2 border-stone-200 rounded-2xl py-3 font-bold text-stone-900 hover:bg-stone-50 transition flex items-center justify-center gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.7-6.2 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.8 26.9 36 24 36c-5.1 0-9.4-3.3-11.2-7.9l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.4l6.6 5.6C41 35.4 44 30.1 44 24c0-1.3-.1-2.3-.4-3.5z" />
              </svg>
              Continuar com Google
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">ou</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <label className="block">
                  <span className="text-xs font-bold text-stone-500 mb-1 block uppercase tracking-wider">Nome</span>
                  <div className="relative">
                    <UserIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      data-testid="auth-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full border-2 border-stone-200 rounded-2xl px-12 py-3 font-medium focus:outline-none focus:border-red-600 transition"
                    />
                  </div>
                </label>
              )}
              <label className="block">
                <span className="text-xs font-bold text-stone-500 mb-1 block uppercase tracking-wider">Email</span>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    data-testid="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="w-full border-2 border-stone-200 rounded-2xl px-12 py-3 font-medium focus:outline-none focus:border-red-600 transition"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-stone-500 mb-1 block uppercase tracking-wider">Senha</span>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    data-testid="auth-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-2 border-stone-200 rounded-2xl px-12 py-3 font-medium focus:outline-none focus:border-red-600 transition"
                  />
                </div>
              </label>

              {error && (
                <p data-testid="auth-error" className="text-red-600 text-sm font-bold">
                  {error}
                </p>
              )}
              {info && (
                <p data-testid="auth-info" className="text-green-700 text-sm font-bold">
                  {info}
                </p>
              )}

              <button
                data-testid="auth-submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-2xl py-3.5 font-black text-lg transition hover:-translate-y-0.5 active:translate-y-0"
                type="submit"
              >
                {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
              </button>
            </form>

            <p className="text-center text-sm text-stone-500 font-medium mt-5">
              {mode === "login" ? "Ainda não tem conta? " : "Já tem conta? "}
              <button
                data-testid="auth-toggle-mode"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(null);
                  setInfo(null);
                }}
                className="text-red-600 font-bold hover:underline"
              >
                {mode === "login" ? "Cadastre-se" : "Entrar"}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
