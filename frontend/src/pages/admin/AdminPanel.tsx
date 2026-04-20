import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  Shield,
  Users,
  BarChart3,
  Utensils,
  Settings2,
  Sparkles,
  Wand2,
  Star,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAppContext } from "../../context/AppContext";
import { supabase, BACKEND_URL } from "../../lib/supabase";
import type { Ingredient, Product, Profile, AppSettings } from "../../lib/types";
import { cn } from "../../lib/utils";

type Tab = "produtos" | "imagens" | "usuarios" | "metricas" | "ajustes" | "depoimentos";

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const { products, refreshProducts, settings, saveSettings } = useAppContext();
  const [tab, setTab] = useState<Tab>("produtos");

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4 px-6 text-center">
        <Shield className="w-12 h-12 text-red-600" />
        <h1 className="text-3xl font-black text-stone-900">Acesso Restrito</h1>
        <p className="text-stone-500 font-medium max-w-sm">
          Somente administradores podem acessar o painel. Entre com a conta admin.
        </p>
        <Link to="/" className="text-red-600 font-bold hover:underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              data-testid="admin-back"
              className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Painel</p>
              <p className="font-black text-stone-900 text-lg">Administração</p>
            </div>
          </div>
          <span className="bg-red-100 text-red-700 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
            <Shield className="w-3 h-3" /> Admin
          </span>
        </div>
        <nav className="max-w-7xl mx-auto px-3 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: "produtos", label: "Produtos", icon: Utensils },
            { id: "imagens", label: "Imagens", icon: ImageIcon },
            { id: "depoimentos", label: "Depoimentos", icon: Star },
            { id: "usuarios", label: "Usuários", icon: Users },
            { id: "metricas", label: "Métricas", icon: BarChart3 },
            { id: "ajustes", label: "Ajustes", icon: Settings2 },
          ].map((t) => {
            const Icon = t.icon as any;
            return (
              <button
                key={t.id}
                data-testid={`admin-tab-${t.id}`}
                onClick={() => setTab(t.id as Tab)}
                className={cn(
                  "flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-full transition-all shrink-0",
                  tab === t.id
                    ? "bg-stone-900 text-white"
                    : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
                )}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-6">
        {tab === "produtos" && <ProductsTab products={products} refresh={refreshProducts} />}
        {tab === "imagens" && <ImagesTab />}
        {tab === "depoimentos" && <TestimonialsTab />}
        {tab === "usuarios" && <UsersTab />}
        {tab === "metricas" && <MetricsTab />}
        {tab === "ajustes" && <SettingsTab settings={settings} save={saveSettings} />}
      </main>
    </div>
  );
}

// ------------------------------------------------------------
// PRODUCTS
// ------------------------------------------------------------
function ProductsTab({ products, refresh }: { products: Product[]; refresh: () => Promise<void> }) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const createNew = async () => {
    const { data, error } = await supabase
      .from("products")
      .insert({
        category: "marmitas",
        name: "Novo Produto",
        description: "Descrição breve",
        price: 20,
        image_url: "https://placehold.co/600x600/dc2626/ffffff?text=Vitoria",
        stock: 50,
      })
      .select()
      .single();
    if (error) return alert(error.message);
    await refresh();
    setEditing(data as Product);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return alert(error.message);
    await refresh();
  };

  const aiDescribe = async (p: Product) => {
    setAiLoading(p.id + "-desc");
    try {
      const r = await fetch(`${BACKEND_URL}/api/ai/describe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: p.name, category: p.category }),
      });
      const j = await r.json();
      if (j.description) {
        await supabase.from("products").update({ description: j.description }).eq("id", p.id);
        await refresh();
      }
    } catch {
      /* noop */
    }
    setAiLoading(null);
  };

  const aiBadge = async (p: Product) => {
    setAiLoading(p.id + "-badge");
    try {
      const r = await fetch(`${BACKEND_URL}/api/ai/badge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: p.name, description: p.description }),
      });
      const j = await r.json();
      if (j.badge) {
        await supabase.from("products").update({ badge: j.badge }).eq("id", p.id);
        await refresh();
      }
    } catch {
      /* noop */
    }
    setAiLoading(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black text-stone-900">Produtos</h2>
        <button
          data-testid="admin-new-product"
          onClick={createNew}
          className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full px-4 py-2 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>
      <div className="grid gap-3">
        {products.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-stone-100 p-4 flex gap-4 items-center"
            data-testid={`admin-product-${p.id}`}
          >
            <img
              src={p.image_url || p.image}
              alt={p.name}
              className="w-20 h-20 rounded-2xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest bg-stone-100 text-stone-500 font-bold px-2 py-0.5 rounded-md">
                  {p.category}
                </span>
                {p.badge && (
                  <span
                    className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md text-white"
                    style={{ backgroundColor: p.badge_color || "#dc2626" }}
                  >
                    {p.badge}
                  </span>
                )}
                <span className="text-[10px] text-stone-400 font-bold">Estoque: {p.stock}</span>
              </div>
              <p className="font-black text-stone-900 truncate">{p.name}</p>
              <p className="text-sm text-stone-500 truncate">{p.description}</p>
              <p className="font-black text-red-600 mt-1">
                R$ {Number(p.price).toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => setEditing(p)}
                data-testid={`admin-edit-${p.id}`}
                className="bg-stone-900 text-white font-bold text-xs rounded-full px-3 py-2"
              >
                Editar
              </button>
              <button
                onClick={() => aiDescribe(p)}
                disabled={aiLoading === p.id + "-desc"}
                data-testid={`admin-ai-desc-${p.id}`}
                className="bg-amber-100 text-amber-700 font-bold text-xs rounded-full px-3 py-2 flex items-center gap-1 disabled:opacity-60"
              >
                <Sparkles className="w-3 h-3" /> {aiLoading === p.id + "-desc" ? "..." : "IA desc"}
              </button>
              <button
                onClick={() => aiBadge(p)}
                disabled={aiLoading === p.id + "-badge"}
                data-testid={`admin-ai-badge-${p.id}`}
                className="bg-violet-100 text-violet-700 font-bold text-xs rounded-full px-3 py-2 flex items-center gap-1 disabled:opacity-60"
              >
                <Wand2 className="w-3 h-3" /> {aiLoading === p.id + "-badge" ? "..." : "IA badge"}
              </button>
              <button
                onClick={() => remove(p.id)}
                data-testid={`admin-del-${p.id}`}
                className="bg-red-50 text-red-600 font-bold text-xs rounded-full px-3 py-2 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      {editing && (
        <ProductEditor product={editing} onClose={() => setEditing(null)} onSaved={refresh} />
      )}
    </div>
  );
}

function ProductEditor({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [data, setData] = useState<Product>(product);
  const [ings, setIngs] = useState<Ingredient[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("product_ingredients")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order")
      .then(({ data }) => setIngs((data as Ingredient[]) || []));
  }, [product.id]);

  const uploadImage = async (file: File) => {
    const path = `${product.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) return alert(error.message);
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setData((d) => ({ ...d, image_url: urlData.publicUrl }));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("products")
      .update({
        category: data.category,
        name: data.name,
        description: data.description,
        long_description: data.long_description,
        price: Number(data.price),
        image_url: data.image_url,
        badge: data.badge || null,
        badge_color: data.badge_color || null,
        stock: Number(data.stock),
        sort_order: Number(data.sort_order) || 0,
        active: data.active,
      })
      .eq("id", product.id);
    if (error) {
      setSaving(false);
      return alert(error.message);
    }
    // ingredients upsert
    for (const ing of ings) {
      if (ing.id.startsWith("new-")) {
        await supabase.from("product_ingredients").insert({
          product_id: product.id,
          name: ing.name,
          price: ing.price,
          default_included: ing.default_included,
          removable: ing.removable,
          stock: ing.stock,
          sort_order: ing.sort_order,
        });
      } else {
        await supabase
          .from("product_ingredients")
          .update({
            name: ing.name,
            price: ing.price,
            default_included: ing.default_included,
            removable: ing.removable,
            stock: ing.stock,
            sort_order: ing.sort_order,
          })
          .eq("id", ing.id);
      }
    }
    setSaving(false);
    await onSaved();
    onClose();
  };

  const addIng = () =>
    setIngs((p) => [
      ...p,
      {
        id: "new-" + Math.random().toString(36).slice(2),
        product_id: product.id,
        name: "Novo ingrediente",
        price: 0,
        default_included: true,
        removable: true,
        stock: 9999,
        sort_order: p.length,
      },
    ]);
  const delIng = async (id: string) => {
    if (!id.startsWith("new-")) await supabase.from("product_ingredients").delete().eq("id", id);
    setIngs((p) => p.filter((i) => i.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-stone-900">Editar produto</h3>
          <button
            onClick={onClose}
            data-testid="admin-editor-close"
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200"
          >
            ✕
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nome" testId="edit-name">
            <input
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 font-bold"
            />
          </Field>
          <Field label="Categoria" testId="edit-category">
            <select
              value={data.category}
              onChange={(e) => setData({ ...data, category: e.target.value })}
              className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 font-bold"
            >
              {["marmitas", "fitness", "carnes", "bebidas", "sobremesas", "pastel"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Preço" testId="edit-price">
            <input
              type="number"
              step="0.01"
              value={data.price}
              onChange={(e) => setData({ ...data, price: Number(e.target.value) })}
              className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 font-bold"
            />
          </Field>
          <Field label="Estoque" testId="edit-stock">
            <input
              type="number"
              value={data.stock}
              onChange={(e) => setData({ ...data, stock: Number(e.target.value) })}
              className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 font-bold"
            />
          </Field>
          <Field label="Badge (ex: Mais Vendido)" testId="edit-badge">
            <input
              value={data.badge || ""}
              onChange={(e) => setData({ ...data, badge: e.target.value })}
              className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 font-bold"
            />
          </Field>
          <Field label="Cor do badge (hex)" testId="edit-badge-color">
            <input
              type="color"
              value={data.badge_color || "#dc2626"}
              onChange={(e) => setData({ ...data, badge_color: e.target.value })}
              className="w-full h-11 rounded-xl border-2 border-stone-200"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descrição curta" testId="edit-desc">
              <textarea
                value={data.description || ""}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 font-medium"
                rows={2}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Descrição completa (página do produto)" testId="edit-longdesc">
              <textarea
                value={data.long_description || ""}
                onChange={(e) => setData({ ...data, long_description: e.target.value })}
                className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 font-medium"
                rows={3}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Imagem do produto" testId="edit-image">
              <div className="flex items-center gap-3">
                <img
                  src={data.image_url || "https://placehold.co/120x120"}
                  className="w-20 h-20 rounded-2xl object-cover border border-stone-200"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                  className="text-sm font-bold flex-1"
                />
              </div>
            </Field>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-black text-stone-900">Ingredientes</h4>
            <button
              onClick={addIng}
              data-testid="admin-add-ingredient"
              className="bg-stone-900 text-white font-bold text-xs rounded-full px-3 py-1.5 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {ings.map((ing, idx) => (
              <div key={ing.id} className="grid grid-cols-12 gap-2 items-center bg-stone-50 rounded-2xl p-2" data-testid={`admin-ing-${idx}`}>
                <input
                  placeholder="Nome"
                  value={ing.name}
                  onChange={(e) =>
                    setIngs((p) => p.map((x) => (x.id === ing.id ? { ...x, name: e.target.value } : x)))
                  }
                  className="col-span-4 border border-stone-200 rounded-lg px-2 py-1.5 text-sm font-bold"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Preço"
                  value={ing.price}
                  onChange={(e) =>
                    setIngs((p) =>
                      p.map((x) => (x.id === ing.id ? { ...x, price: Number(e.target.value) } : x))
                    )
                  }
                  className="col-span-2 border border-stone-200 rounded-lg px-2 py-1.5 text-sm font-bold"
                />
                <input
                  type="number"
                  placeholder="Estoque"
                  value={ing.stock}
                  onChange={(e) =>
                    setIngs((p) =>
                      p.map((x) => (x.id === ing.id ? { ...x, stock: Number(e.target.value) } : x))
                    )
                  }
                  className="col-span-2 border border-stone-200 rounded-lg px-2 py-1.5 text-sm font-bold"
                />
                <label className="col-span-2 flex items-center gap-1 text-xs font-bold text-stone-600">
                  <input
                    type="checkbox"
                    checked={ing.default_included}
                    onChange={(e) =>
                      setIngs((p) =>
                        p.map((x) =>
                          x.id === ing.id ? { ...x, default_included: e.target.checked } : x
                        )
                      )
                    }
                  />
                  Padrão
                </label>
                <label className="col-span-1 flex items-center gap-1 text-xs font-bold text-stone-600">
                  <input
                    type="checkbox"
                    checked={ing.removable}
                    onChange={(e) =>
                      setIngs((p) =>
                        p.map((x) => (x.id === ing.id ? { ...x, removable: e.target.checked } : x))
                      )
                    }
                  />
                  Rem.
                </label>
                <button
                  onClick={() => delIng(ing.id)}
                  className="col-span-1 bg-red-50 text-red-600 rounded-lg p-1.5 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          data-testid="admin-save-product"
          className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-2xl transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" /> {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  testId,
  children,
}: {
  label: string;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" data-testid={testId}>
      <span className="text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}

// ------------------------------------------------------------
// IMAGES (site images via Supabase storage upload)
// ------------------------------------------------------------
function ImagesTab() {
  const { siteImages, setSiteImages } = useAppContext();
  const upload = async (file: File, slot: string) => {
    const path = `${slot}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("site-images").upload(path, file, { upsert: true });
    if (error) return alert(error.message);
    const { data } = supabase.storage.from("site-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleHero = async (idx: number, file: File) => {
    const url = await upload(file, "hero");
    if (!url) return;
    const newArr = [...siteImages.heroSlides];
    newArr[idx] = url;
    setSiteImages({ ...siteImages, heroSlides: newArr });
  };
  const handleBenefit = async (idx: number, file: File) => {
    const url = await upload(file, "benefits");
    if (!url) return;
    const newArr = [...siteImages.benefitsImages];
    newArr[idx] = url;
    setSiteImages({ ...siteImages, benefitsImages: newArr });
  };
  const handleBanner = async (file: File) => {
    const url = await upload(file, "banner");
    if (!url) return;
    setSiteImages({ ...siteImages, bannerBg: url });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-stone-900">Imagens do site</h2>

      <Section title="Hero (topo)">
        <div className="grid sm:grid-cols-3 gap-3">
          {siteImages.heroSlides.map((u, i) => (
            <ImageCell key={i} url={u} onChange={(f) => handleHero(i, f)} />
          ))}
        </div>
      </Section>

      <Section title="Banner promocional">
        <ImageCell url={siteImages.bannerBg} onChange={handleBanner} wide />
      </Section>

      <Section title="Benefícios">
        <div className="grid sm:grid-cols-3 gap-3">
          {siteImages.benefitsImages.map((u, i) => (
            <ImageCell key={i} url={u} onChange={(f) => handleBenefit(i, f)} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-stone-100 p-5">
      <h3 className="font-black text-stone-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ImageCell({
  url,
  onChange,
  wide,
}: {
  url: string;
  onChange: (f: File) => void;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-50",
        wide ? "h-40" : "h-32"
      )}
    >
      <img src={url} className="w-full h-full object-cover" />
      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
        <span className="text-white font-bold flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Trocar
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
        />
      </label>
    </div>
  );
}

// ------------------------------------------------------------
// USERS
// ------------------------------------------------------------
function UsersTab() {
  const [users, setUsers] = useState<Profile[]>([]);
  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setUsers(data as Profile[]);
  };
  useEffect(() => {
    load();
  }, []);

  const toggleAdmin = async (u: Profile) => {
    const next = u.role === "admin" ? "user" : "admin";
    if (!confirm(`Tornar ${u.email} ${next === "admin" ? "ADMIN" : "usuário comum"}?`)) return;
    const { error } = await supabase.from("profiles").update({ role: next }).eq("id", u.id);
    if (error) return alert(error.message);
    await load();
  };

  return (
    <div>
      <h2 className="text-2xl font-black text-stone-900 mb-4">Usuários</h2>
      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white rounded-3xl border border-stone-100 p-4 flex items-center gap-4"
            data-testid={`admin-user-${u.id}`}
          >
            <div className="w-12 h-12 rounded-full bg-red-600 text-white font-black flex items-center justify-center overflow-hidden">
              {u.avatar_url ? (
                <img src={u.avatar_url} className="w-full h-full object-cover" />
              ) : (
                (u.nickname || u.full_name || u.email)[0]?.toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-stone-900 truncate">
                {u.nickname || u.full_name || u.email}
              </p>
              <p className="text-xs text-stone-500 font-medium truncate">{u.email}</p>
            </div>
            <button
              onClick={() => toggleAdmin(u)}
              data-testid={`admin-toggle-${u.id}`}
              className={cn(
                "font-bold text-xs rounded-full px-3 py-2 transition",
                u.role === "admin"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              )}
            >
              {u.role === "admin" ? "Admin" : "Tornar admin"}
            </button>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-stone-500 font-medium text-center py-8">
            Nenhum usuário cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// METRICS
// ------------------------------------------------------------
function MetricsTab() {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    revenue: 0,
    testimonials: 0,
    avgRating: 0,
  });
  useEffect(() => {
    (async () => {
      const [u, o, t] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total, created_at"),
        supabase.from("testimonials").select("rating"),
      ]);
      const orders = (o.data as any[]) || [];
      const rev = orders.reduce((s, r) => s + Number(r.total || 0), 0);
      const testims = (t.data as any[]) || [];
      const avg = testims.length
        ? testims.reduce((s, r) => s + Number(r.rating || 0), 0) / testims.length
        : 0;
      setStats({
        users: u.count || 0,
        orders: orders.length,
        revenue: rev,
        testimonials: testims.length,
        avgRating: avg,
      });
    })();
  }, []);

  const Card = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
    <div className="bg-white rounded-3xl border border-stone-100 p-5">
      <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500">{label}</p>
      <p className="text-3xl font-black text-stone-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-stone-500 font-medium mt-1">{hint}</p>}
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-black text-stone-900 mb-4">Métricas</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="admin-metrics">
        <Card label="Usuários" value={`${stats.users}`} />
        <Card label="Pedidos" value={`${stats.orders}`} />
        <Card
          label="Receita total"
          value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
            stats.revenue
          )}
        />
        <Card label="Depoimentos" value={`${stats.testimonials}`} />
        <Card
          label="Avaliação média"
          value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"}
          hint="estrelas"
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// SETTINGS
// ------------------------------------------------------------
// ------------------------------------------------------------
// TESTIMONIALS (admin)
// ------------------------------------------------------------
function TestimonialsTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiReplying, setAiReplying] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("testimonials")
      .select(
        "id, user_id, rating, content, created_at, profiles!inner(nickname, full_name, username, avatar_url, email)"
      )
      .order("created_at", { ascending: false });
    setRows((data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Excluir este depoimento? Essa ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) return alert(error.message);
    await load();
  };

  const aiReply = async (t: any) => {
    setAiReplying(t.id);
    try {
      const r = await fetch(`${BACKEND_URL}/api/ai/reply-testimonial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: t.profiles?.nickname || t.profiles?.full_name || "Cliente",
          rating: t.rating,
          content: t.content,
        }),
      });
      const j = await r.json();
      if (j.reply) setReplies((p) => ({ ...p, [t.id]: j.reply }));
    } catch (e) {
      alert("Falha ao gerar resposta.");
    }
    setAiReplying(null);
  };

  return (
    <div data-testid="admin-testimonials">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black text-stone-900">Depoimentos</h2>
        <button
          onClick={load}
          className="text-xs font-bold bg-stone-100 hover:bg-stone-200 rounded-full px-3 py-1.5"
        >
          Recarregar
        </button>
      </div>

      {loading ? (
        <p className="text-stone-500 font-medium text-center py-8">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-stone-500 font-medium text-center py-8">Nenhum depoimento ainda.</p>
      ) : (
        <div className="grid gap-3">
          {rows.map((t) => {
            const author = t.profiles || {};
            return (
              <div
                key={t.id}
                className="bg-white rounded-3xl border border-stone-100 p-5"
                data-testid={`admin-testimonial-${t.id}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-red-600 text-white font-black flex items-center justify-center overflow-hidden">
                    {author.avatar_url ? (
                      <img src={author.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      (author.nickname || author.full_name || "?")[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-stone-900 truncate">
                      {author.nickname || author.full_name || "Cliente"}
                    </p>
                    <p className="text-xs text-stone-500 font-medium truncate">
                      @{author.username || "usuario"} · {author.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < t.rating ? "text-amber-400 fill-amber-400" : "text-stone-200"
                        )}
                      />
                    ))}
                  </div>
                </div>
                {t.content ? (
                  <p className="text-stone-700 leading-relaxed text-sm">"{t.content}"</p>
                ) : (
                  <p className="text-stone-400 italic text-sm font-medium">
                    Sem comentário — apenas avaliação em estrelas.
                  </p>
                )}
                <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-3">
                  {new Date(t.created_at).toLocaleString("pt-BR")}
                </p>
                {replies[t.id] && (
                  <div className="mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1">
                      Sugestão de resposta (IA)
                    </p>
                    <p className="text-sm text-stone-800 font-medium">{replies[t.id]}</p>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => aiReply(t)}
                    disabled={aiReplying === t.id}
                    data-testid={`admin-testimonial-reply-${t.id}`}
                    className="bg-violet-100 text-violet-700 font-bold text-xs rounded-full px-3 py-2 flex items-center gap-1 disabled:opacity-60"
                  >
                    <MessageCircle className="w-3 h-3" />
                    {aiReplying === t.id ? "Gerando..." : "Sugerir resposta (IA)"}
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    data-testid={`admin-testimonial-delete-${t.id}`}
                    className="bg-red-50 text-red-600 font-bold text-xs rounded-full px-3 py-2 flex items-center gap-1 hover:bg-red-100"
                  >
                    <Trash2 className="w-3 h-3" /> Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function SettingsTab({
  settings,
  save,
}: {
  settings: AppSettings;
  save: (s: AppSettings) => Promise<void>;
}) {
  const [s, setS] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);
  useEffect(() => setS(settings), [settings]);

  const saveIt = async () => {
    setSaving(true);
    try {
      await save(s);
    } catch (e: any) {
      alert(e?.message || String(e));
    }
    setSaving(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-black text-stone-900 mb-4">Ajustes do estabelecimento</h2>
      <div className="bg-white rounded-3xl border border-stone-100 p-5 space-y-3" data-testid="admin-settings">
        <Field label="Endereço / Localização" testId="set-address">
          <input
            value={s.address}
            onChange={(e) => setS({ ...s, address: e.target.value })}
            className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 font-bold"
          />
        </Field>
        <Field label="Horários" testId="set-hours">
          <input
            value={s.hours}
            onChange={(e) => setS({ ...s, hours: e.target.value })}
            className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 font-bold"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Tempo de entrega" testId="set-delivery">
            <input
              value={s.delivery_time}
              onChange={(e) => setS({ ...s, delivery_time: e.target.value })}
              className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 font-bold"
            />
          </Field>
          <Field label="Tempo de retirada" testId="set-pickup">
            <input
              value={s.pickup_time}
              onChange={(e) => setS({ ...s, pickup_time: e.target.value })}
              className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 font-bold"
            />
          </Field>
        </div>
        <Field label="Métodos de pagamento (separe por vírgula)" testId="set-payments">
          <input
            value={s.payment_methods.join(", ")}
            onChange={(e) =>
              setS({
                ...s,
                payment_methods: e.target.value
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
            className="w-full border-2 border-stone-200 focus:border-red-600 rounded-xl px-3 py-2 font-bold"
          />
        </Field>
        <button
          onClick={saveIt}
          disabled={saving}
          data-testid="admin-save-settings"
          className="mt-3 bg-red-600 hover:bg-red-700 text-white font-black px-5 py-3 rounded-2xl disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar ajustes"}
        </button>
      </div>
    </div>
  );
}
