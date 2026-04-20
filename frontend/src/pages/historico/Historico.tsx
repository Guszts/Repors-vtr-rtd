import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ShoppingBag, Package, Trash2, ChevronRight, Clock } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import { useAppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "../../components/auth/AuthModal";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";

const currency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function Historico() {
  const {
    cart,
    cartTotal,
    cartCount,
    removeFromCart,
    updateQuantity,
    clearCart,
    orders,
    refreshOrders,
  } = useAppContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"pedidos" | "carrinho">("carrinho");
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (user) refreshOrders(user.id);
  }, [user, refreshOrders]);

  const placeOrder = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!cart.length) return;
    setLoading(true);
    const items = cart.map((i) => ({
      product_id: i.product.id,
      name: i.product.name,
      qty: i.quantity,
      price: i.unitPrice,
      ingredients: i.extras?.removedIngredients,
    }));
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      total: cartTotal,
      items,
      status: "pending",
    });
    setLoading(false);
    if (!error) {
      clearCart();
      await refreshOrders(user.id);
      setTab("pedidos");
    }
  };

  return (
    <>
      <TopBar title="Histórico" />
      <div className="max-w-3xl mx-auto px-5 pb-28 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 bg-stone-100 rounded-full p-1 mb-6 gap-1"
          data-testid="historico-tabs"
        >
          {[
            { id: "carrinho", label: `Carrinho${cartCount ? ` (${cartCount})` : ""}`, icon: ShoppingBag },
            { id: "pedidos", label: "Pedidos", icon: Package },
          ].map((t) => {
            const Icon = t.icon as any;
            return (
              <button
                key={t.id}
                data-testid={`historico-tab-${t.id}`}
                onClick={() => setTab(t.id as any)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-full py-2.5 font-bold text-sm transition-all",
                  tab === t.id
                    ? "bg-white shadow-sm text-stone-900"
                    : "text-stone-500 hover:text-stone-700"
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </motion.div>

        {tab === "carrinho" && (
          <div data-testid="historico-cart">
            {cart.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag className="w-8 h-8" />}
                title="Seu carrinho está vazio"
                subtitle="Volte ao início e adicione seus pratos favoritos."
                cta={() => navigate("/")}
                ctaLabel="Ver cardápio"
              />
            ) : (
              <div className="space-y-3">
                {cart.map((i) => (
                  <motion.div
                    key={i.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-stone-100 p-4 flex gap-4 items-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                    data-testid={`cart-item-${i.product.id}`}
                  >
                    <img
                      src={i.product.image_url || i.product.image}
                      alt={i.product.name}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-stone-900 truncate">{i.product.name}</h4>
                      {i.extras?.removedIngredients?.length ? (
                        <p className="text-xs text-stone-500 font-medium">
                          Sem: {i.extras.removedIngredients.join(", ")}
                        </p>
                      ) : null}
                      {i.extras?.extras?.length ? (
                        <p className="text-xs text-red-600 font-bold">
                          + {i.extras.extras.map((e) => e.name).join(", ")}
                        </p>
                      ) : null}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-red-600 font-black">{currency(i.unitPrice)}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(i.key, i.quantity - 1)}
                            data-testid={`cart-dec-${i.product.id}`}
                            className="w-8 h-8 rounded-full bg-stone-100 font-black active:scale-90 transition"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-black">{i.quantity}</span>
                          <button
                            onClick={() => updateQuantity(i.key, i.quantity + 1)}
                            data-testid={`cart-inc-${i.product.id}`}
                            className="w-8 h-8 rounded-full bg-stone-900 text-white font-black active:scale-90 transition"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(i.key)}
                      data-testid={`cart-remove-${i.product.id}`}
                      className="w-9 h-9 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}

                <div className="sticky bottom-24 bg-white rounded-3xl border border-stone-100 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-stone-500 font-bold">Total</span>
                    <span className="text-2xl font-black text-stone-900">{currency(cartTotal)}</span>
                  </div>
                  <button
                    disabled={loading}
                    onClick={placeOrder}
                    data-testid="historico-place-order"
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-lg py-4 rounded-2xl transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {loading ? "Enviando..." : "Finalizar pedido"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "pedidos" && (
          <div data-testid="historico-orders">
            {!user ? (
              <EmptyState
                icon={<Package className="w-8 h-8" />}
                title="Entre para ver seus pedidos"
                subtitle="Seu histórico de pedidos fica salvo na sua conta."
                cta={() => setAuthOpen(true)}
                ctaLabel="Entrar"
              />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={<Package className="w-8 h-8" />}
                title="Sem pedidos por enquanto"
                subtitle="Assim que você fizer um pedido, ele aparece aqui."
                cta={() => navigate("/")}
                ctaLabel="Fazer pedido"
              />
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-stone-100 p-5"
                    data-testid={`order-${o.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">
                          Pedido
                        </span>
                        <p className="font-black text-stone-900">#{o.id.slice(0, 8)}</p>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-bold uppercase px-3 py-1 rounded-full",
                          o.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : o.status === "cancelled"
                            ? "bg-stone-100 text-stone-500"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {o.status === "completed" ? "Concluído" : o.status === "cancelled" ? "Cancelado" : "Em andamento"}
                      </span>
                    </div>
                    <ul className="space-y-1 mb-3">
                      {o.items.map((it, idx) => (
                        <li key={idx} className="flex justify-between text-sm font-medium text-stone-700">
                          <span>
                            {it.qty}× {it.name}
                          </span>
                          <span>{currency(it.price * it.qty)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                      <span className="text-xs text-stone-500 flex items-center gap-1 font-bold">
                        <Clock className="w-3 h-3" />
                        {new Date(o.created_at).toLocaleString("pt-BR")}
                      </span>
                      <span className="font-black text-red-600">{currency(o.total)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  cta,
  ctaLabel,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta?: () => void;
  ctaLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6" data-testid="empty-state">
      <div className="w-20 h-20 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-black text-stone-900 text-xl">{title}</h3>
      <p className="text-stone-500 font-medium mt-1 max-w-xs">{subtitle}</p>
      {cta && (
        <button
          onClick={cta}
          data-testid="empty-cta"
          className="mt-6 bg-red-600 text-white font-bold px-6 py-3 rounded-full hover:bg-red-700 transition flex items-center gap-2"
        >
          {ctaLabel} <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
