import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Camera,
  Award,
  LogOut,
  Settings,
  ChevronRight,
  LogIn,
  Gift,
  MapPin,
  Clock,
  Wallet,
  Shield,
} from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import { useAuth } from "../../context/AuthContext";
import { useAppContext } from "../../context/AppContext";
import { supabase } from "../../lib/supabase";
import AuthModal from "../../components/auth/AuthModal";

export default function Perfil() {
  const { user, profile, signOut, refreshProfile, updateProfile, isAdmin } = useAuth();
  const { settings } = useAppContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [nickname, setNickname] = useState(profile?.nickname || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const tier = (pts: number) =>
    pts >= 1000
      ? { name: "Ouro", color: "from-amber-400 to-amber-600" }
      : pts >= 500
      ? { name: "Prata", color: "from-stone-300 to-stone-500" }
      : { name: "Bronze", color: "from-orange-400 to-orange-700" };

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/avatar_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return alert("Erro ao enviar: " + error.message);
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await updateProfile({ avatar_url: data.publicUrl });
    await refreshProfile();
  };

  const saveProfile = async () => {
    setSaving(true);
    await updateProfile({ nickname, username });
    setSaving(false);
  };

  if (!user) {
    return (
      <>
        <TopBar title="Perfil" />
        <div className="max-w-md mx-auto px-5 pt-10 pb-28 text-center">
          <div className="w-24 h-24 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-6">
            <LogIn className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-stone-900 tracking-tight">Entre no Vitória</h2>
          <p className="text-stone-500 font-medium mt-2 mb-8">
            Acesse para gerenciar pedidos, pontos fidelidade e muito mais.
          </p>
          <button
            onClick={() => setAuthOpen(true)}
            data-testid="perfil-login-btn"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-lg py-4 rounded-2xl"
          >
            Entrar ou cadastrar
          </button>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  const pts = profile?.loyalty_points || 0;
  const t = tier(pts);
  const next = pts >= 1000 ? 1000 : pts >= 500 ? 1000 : 500;
  const pctToNext = Math.min(100, Math.round((pts / next) * 100));

  return (
    <>
      <TopBar title="Perfil" />
      <div className="max-w-2xl mx-auto px-5 pb-28 pt-2 space-y-6">
        {/* avatar + name */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] border border-stone-100 p-6 shadow-sm"
          data-testid="perfil-card"
        >
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-red-600 text-white text-3xl font-black flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  (profile?.nickname || profile?.full_name || user.email || "?")[0]?.toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                data-testid="perfil-avatar-upload"
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-stone-900 text-white flex items-center justify-center border-[3px] border-white shadow"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickAvatar}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-2xl text-stone-900 truncate">
                {profile?.nickname || profile?.full_name || "Você"}
              </p>
              <p className="text-stone-500 font-bold text-sm">@{profile?.username || "usuario"}</p>
              <p className="text-xs text-stone-400 font-medium truncate">{user.email}</p>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 mt-2 text-[10px] uppercase tracking-widest font-black bg-red-600 text-white px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <label className="block">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                Apelido
              </span>
              <input
                data-testid="perfil-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 mt-1 font-bold"
                placeholder="Como quer ser chamado"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                Usuário (@)
              </span>
              <input
                data-testid="perfil-username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 mt-1 font-bold"
                placeholder="usuario"
              />
            </label>
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            data-testid="perfil-save"
            className="mt-4 w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-2xl transition disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </motion.div>

        {/* Loyalty */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`rounded-[32px] p-6 bg-gradient-to-br ${t.color} text-white shadow-xl`}
          data-testid="perfil-loyalty"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] font-bold opacity-80">
                Programa Fidelidade
              </p>
              <p className="text-3xl font-black">{pts} pts</p>
              <p className="text-sm font-bold opacity-90">Nível {t.name}</p>
            </div>
            <Award className="w-14 h-14 opacity-90" strokeWidth={1.5} />
          </div>
          <div className="mt-4 bg-white/30 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pctToNext}%` }}
              className="h-full bg-white rounded-full"
            />
          </div>
          <p className="text-xs font-bold mt-2 opacity-90">
            {pts < next ? `Faltam ${next - pts} pts para o próximo nível` : "Nível máximo alcançado"}
          </p>
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { pts: 100, reward: "Sobremesa" },
              { pts: 300, reward: "Bebida 2L" },
              { pts: 500, reward: "Marmita P" },
            ].map((r) => (
              <div
                key={r.pts}
                className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center border border-white/20"
              >
                <Gift className="w-5 h-5 mx-auto mb-1" />
                <p className="text-[10px] font-bold opacity-90">{r.pts} pts</p>
                <p className="text-xs font-black">{r.reward}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Settings preview */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[32px] border border-stone-100 divide-y divide-stone-100 overflow-hidden"
          data-testid="perfil-settings"
        >
          <SettingRow icon={<MapPin className="w-5 h-5" />} label="Localização" value={settings.address} />
          <SettingRow icon={<Clock className="w-5 h-5" />} label="Horários" value={settings.hours} />
          <SettingRow
            icon={<Clock className="w-5 h-5" />}
            label="Entrega"
            value={`${settings.delivery_time} • Retirada: ${settings.pickup_time}`}
          />
          <SettingRow
            icon={<Wallet className="w-5 h-5" />}
            label="Pagamentos"
            value={settings.payment_methods.join(" • ")}
          />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isAdmin && (
            <Link
              to="/ajustes"
              data-testid="perfil-admin-link"
              className="bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl py-4 px-5 flex items-center justify-between transition"
            >
              <span className="flex items-center gap-3">
                <Shield className="w-5 h-5" /> Painel Admin
              </span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          )}
          <button
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
            data-testid="perfil-logout"
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-2xl py-4 px-5 flex items-center justify-between transition"
          >
            <span className="flex items-center gap-3">
              <LogOut className="w-5 h-5" /> Sair
            </span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}

function SettingRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-widest font-bold text-stone-400">{label}</p>
        <p className="font-bold text-stone-900 truncate">{value}</p>
      </div>
    </div>
  );
}
