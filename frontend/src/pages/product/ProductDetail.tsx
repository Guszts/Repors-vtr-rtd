import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ShoppingBag, Minus, Plus, Check } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import { useAppContext } from "../../context/AppContext";
import { supabase } from "../../lib/supabase";
import type { Ingredient } from "../../lib/types";
import { cn } from "../../lib/utils";

const currency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function ProductDetail() {
  const { id } = useParams();
  const { products, addToCart } = useAppContext();
  const product = products.find((p) => p.id === id);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({}); // id -> included?
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    // Only hit Supabase for UUID-shaped ids (Supabase products use uuid)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      setIngredients([]);
      setSelected({});
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("product_ingredients")
        .select("*")
        .eq("product_id", id)
        .order("sort_order", { ascending: true });
      const rows = (data as Ingredient[]) || [];
      setIngredients(rows);
      const next: Record<string, boolean> = {};
      rows.forEach((r) => (next[r.id] = r.default_included));
      setSelected(next);
      setLoading(false);
    })();
  }, [id]);

  const extras = useMemo(() => {
    const removed: string[] = [];
    const added: { name: string; price: number }[] = [];
    let priceDelta = 0;
    ingredients.forEach((ing) => {
      const isSel = selected[ing.id];
      if (ing.default_included && !isSel) removed.push(ing.name);
      if (!ing.default_included && isSel) {
        added.push({ name: ing.name, price: ing.price });
        priceDelta += ing.price;
      }
    });
    return { removed, added, priceDelta };
  }, [ingredients, selected]);

  if (!product) {
    return (
      <>
        <TopBar title="Produto" back />
        <div className="max-w-md mx-auto px-5 py-16 text-center">
          <p className="font-bold text-stone-500 mb-4">Produto não encontrado.</p>
          <Link to="/" className="text-red-600 font-bold hover:underline">
            Voltar
          </Link>
        </div>
      </>
    );
  }

  const unitPrice = product.price + extras.priceDelta;
  const total = unitPrice * qty;
  const outOfStock = product.stock <= 0;

  const add = () => {
    addToCart(product, {
      quantity: qty,
      unitPrice,
      extras: {
        removedIngredients: extras.removed,
        extras: extras.added,
      },
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1600);
  };

  return (
    <>
      <TopBar title={product.name} back transparent />
      <div className="pb-32" data-testid="product-detail">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative h-[52vh] min-h-[320px] bg-stone-900 overflow-hidden"
        >
          <img
            src={product.image_url || product.image}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/20 to-transparent" />
          <div className="absolute left-0 right-0 bottom-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/90 backdrop-blur text-stone-900 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                {product.category}
              </span>
              {product.badge && (
                <span
                  className="text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ backgroundColor: product.badge_color || "#dc2626" }}
                >
                  {product.badge}
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
              {product.name}
            </h1>
            <p className="text-white/90 font-medium mt-2 max-w-2xl">{product.description}</p>
          </div>
        </motion.div>

        <div className="max-w-3xl mx-auto px-5 -mt-6">
          {product.long_description && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[28px] border border-stone-100 p-6 shadow-md mb-4"
            >
              <h3 className="font-black text-stone-900 mb-2">Sobre este prato</h3>
              <p className="text-stone-600 leading-relaxed">{product.long_description}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-[28px] border border-stone-100 p-6 shadow-sm"
            data-testid="ingredients-panel"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-stone-900 text-xl">Monte do seu jeito</h3>
              {loading && <span className="text-xs text-stone-400 font-bold">Carregando...</span>}
            </div>
            {!loading && ingredients.length === 0 && (
              <p className="text-stone-500 font-medium text-sm">
                Este prato vem completo como na descrição. Sem customizações disponíveis.
              </p>
            )}
            <ul className="space-y-2">
              {ingredients.map((ing) => {
                const isSel = !!selected[ing.id];
                const disabled = ing.default_included && !ing.removable;
                const isOut = ing.stock <= 0;
                return (
                  <li key={ing.id}>
                    <button
                      type="button"
                      disabled={disabled || isOut}
                      onClick={() =>
                        !disabled && !isOut && setSelected((s) => ({ ...s, [ing.id]: !s[ing.id] }))
                      }
                      data-testid={`ing-${ing.id}`}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 p-3 rounded-2xl border-2 transition-all",
                        isSel
                          ? "bg-red-50 border-red-200"
                          : "bg-white border-stone-100 hover:border-stone-200",
                        (disabled || isOut) && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                            isSel ? "bg-red-600 border-red-600 text-white" : "border-stone-300"
                          )}
                        >
                          {isSel && <Check className="w-4 h-4" />}
                        </span>
                        <div className="min-w-0 text-left">
                          <p className="font-bold text-stone-900 truncate">{ing.name}</p>
                          <p className="text-[11px] uppercase tracking-widest font-bold text-stone-400">
                            {ing.default_included ? "Padrão" : "Adicional"}
                            {isOut && " • Esgotado"}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-sm shrink-0">
                        {ing.price > 0 ? `+ ${currency(ing.price)}` : "Grátis"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          <div className="mt-5 flex items-center justify-between bg-white rounded-[28px] border border-stone-100 p-5 shadow-sm">
            <div>
              <p className="text-[11px] uppercase tracking-widest font-bold text-stone-400">Quantidade</p>
              <p className="font-black text-stone-900 text-2xl">{qty}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                data-testid="product-qty-dec"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-11 h-11 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center active:scale-90 transition"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                data-testid="product-qty-inc"
                onClick={() => setQty((q) => q + 1)}
                className="w-11 h-11 rounded-full bg-stone-900 text-white hover:bg-stone-800 flex items-center justify-center active:scale-90 transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* sticky add to cart */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="fixed bottom-24 left-3 right-3 z-30"
      >
        <button
          disabled={outOfStock}
          onClick={add}
          data-testid="product-add-to-cart"
          className={cn(
            "w-full bg-red-600 hover:bg-red-700 text-white font-black text-lg py-4 rounded-[28px] shadow-[0_12px_40px_rgba(220,38,38,0.35)] transition hover:-translate-y-0.5 flex items-center justify-between px-6",
            outOfStock && "opacity-60 cursor-not-allowed"
          )}
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {outOfStock ? "Sem estoque" : "Adicionar ao pedido"}
          </span>
          <span className="font-black">{currency(total)}</span>
        </button>
      </motion.div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white font-bold px-5 py-3 rounded-full shadow-lg"
            data-testid="product-success-toast"
          >
            Adicionado ao carrinho!
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
