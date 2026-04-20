import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Star, Plus, Filter, Search, X } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import { useAppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "../../components/auth/AuthModal";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";

export default function Depoimentos() {
  const { testimonials, refreshTestimonials } = useAppContext();
  const { user, profile } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    refreshTestimonials();
  }, [refreshTestimonials]);

  const filtered = useMemo(
    () =>
      testimonials.filter((t) => {
        if (filter !== "all" && t.rating !== filter) return false;
        if (
          search &&
          !`${t.content || ""} ${t.author?.nickname || ""} ${t.author?.username || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [testimonials, filter, search]
  );

  const submit = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setSending(true);
    const { error } = await supabase.from("testimonials").insert({
      user_id: user.id,
      rating,
      content: content.trim() || null,
    });
    setSending(false);
    if (!error) {
      setComposerOpen(false);
      setContent("");
      setRating(5);
      refreshTestimonials();
    }
  };

  return (
    <>
      <TopBar title="Depoimentos" />
      <div className="max-w-3xl mx-auto px-5 pb-28 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              data-testid="depoimentos-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar depoimentos..."
              className="w-full rounded-2xl bg-white border border-stone-200 pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-red-500"
            />
          </div>
          <button
            onClick={() =>
              user ? setComposerOpen(true) : setAuthOpen(true)
            }
            data-testid="depoimentos-add"
            className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl px-4 py-2.5 flex items-center gap-1.5 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Avaliar
          </button>
        </motion.div>

        <div
          data-testid="depoimentos-filters"
          className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar"
        >
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="Todos" testId="filter-all" />
          {[5, 4, 3, 2, 1].map((s) => (
            <FilterChip
              key={s}
              active={filter === s}
              onClick={() => setFilter(s)}
              label={`${s}★`}
              testId={`filter-${s}`}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-500 font-medium" data-testid="depoimentos-empty">
            Nenhum depoimento por aqui ainda.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3" data-testid="depoimentos-list">
            {filtered.map((t, idx) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Link
                  to={`/depoimentos/${t.id}`}
                  data-testid={`depoimento-${t.id}`}
                  className="block bg-white rounded-3xl border border-stone-100 p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-red-600 text-white font-black flex items-center justify-center overflow-hidden shrink-0">
                      {t.author?.avatar_url ? (
                        <img src={t.author.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        (t.author?.nickname || t.author?.full_name || "?")[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-stone-900 truncate">
                        {t.author?.nickname || t.author?.full_name || "Cliente"}
                      </p>
                      <p className="text-xs text-stone-500 font-medium truncate">
                        @{t.author?.username || "usuario"}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3.5 h-3.5",
                            i < t.rating ? "text-amber-400 fill-amber-400" : "text-stone-200"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  {t.content && (
                    <p className="text-stone-600 leading-relaxed line-clamp-3 text-sm">“{t.content}”</p>
                  )}
                  <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mt-3">
                    {new Date(t.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <AnimatePresence>
        {composerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
            data-testid="depoimento-composer"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-7 relative"
            >
              <button
                onClick={() => setComposerOpen(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
                data-testid="composer-close"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-black text-stone-900">Deixe sua avaliação</h3>
              <p className="text-stone-500 font-medium text-sm mb-5">
                Só as estrelas já são suficientes — o comentário é opcional.
              </p>
              <div className="flex justify-center gap-1 mb-6" data-testid="composer-stars">
                {Array.from({ length: 5 }).map((_, i) => {
                  const val = i + 1;
                  const active = (hover || rating) >= val;
                  return (
                    <button
                      key={val}
                      onMouseEnter={() => setHover(val)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(val)}
                      data-testid={`composer-star-${val}`}
                      type="button"
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "w-10 h-10 transition-colors",
                          active ? "text-amber-400 fill-amber-400" : "text-stone-200"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                data-testid="composer-content"
                placeholder="Conte o que achou (opcional)..."
                className="w-full border-2 border-stone-200 rounded-2xl p-4 font-medium focus:outline-none focus:border-red-600 resize-none"
                rows={4}
              />
              <button
                onClick={submit}
                disabled={sending}
                data-testid="composer-submit"
                className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-black text-lg py-3.5 rounded-2xl transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {sending ? "Enviando..." : "Publicar avaliação"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  testId,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  testId: string;
  key?: React.Key;
}) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full font-bold text-sm transition-all shrink-0",
        active ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
      )}
    >
      {label}
    </button>
  );
}
