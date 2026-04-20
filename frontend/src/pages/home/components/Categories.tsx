import { Soup, HeartPulse, Beef, CupSoda, Cake, Pizza } from "lucide-react";
import { motion } from "motion/react";

const categories = [
  { id: "marmitas", name: "Marmitas", desc: "Clássica brasileira", icon: Soup, color: "text-red-500" },
  { id: "fitness", name: "Fitness", desc: "Coma sem culpa", icon: HeartPulse, color: "text-green-500" },
  { id: "carnes", name: "Carnes no Kilo", desc: "Churrasco no ponto", icon: Beef, color: "text-amber-600" },
  { id: "bebidas", name: "Bebidas", desc: "Geladas e sucos", icon: CupSoda, color: "text-orange-500" },
  { id: "sobremesas", name: "Sobremesas", desc: "O doce perfeito", icon: Cake, color: "text-pink-500" },
  { id: "pastel", name: "Pastel", desc: "Sequinho e recheado", icon: Pizza, color: "text-yellow-500" },
];

export default function Categories() {
  return (
    <section className="bg-white py-24 px-6 lg:px-8 relative z-30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-red-600 font-bold uppercase tracking-widest text-sm mb-4 block">Nosso Cardápio</span>
          <h2 className="text-4xl md:text-5xl font-black text-stone-900 leading-tight">
            Comida caseira com <br className="hidden md:block"/>
            <span className="text-red-600">sabor de verdade</span>
          </h2>

          <div className="mt-8 inline-flex flex-wrap justify-center items-center gap-4 text-sm font-medium text-stone-600 bg-stone-100 rounded-full px-6 py-3 border border-stone-200">
            <span>Av Brasil, 1020 - Centro</span>
            <span className="hidden md:inline text-stone-300">/</span>
            <span>30-45 min</span>
            <span className="hidden md:inline text-stone-300">/</span>
            <span className="text-green-600 font-bold">Frete Grátis acima de R$50</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.a
                href="#cardapio"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('cardapio')?.scrollIntoView({ behavior: 'smooth' });
                }}
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group flex flex-col items-center p-6 rounded-2xl bg-stone-50 border border-stone-100 hover:bg-white hover:border-red-100 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-white border border-stone-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className={`w-8 h-8 ${cat.color}`} />
                </div>
                <h3 className="font-bold text-stone-900 group-hover:text-red-600 transition-colors text-center">{cat.name}</h3>
                <p className="text-xs text-stone-500 text-center mt-1">{cat.desc}</p>
              </motion.a>
            )
          })}
        </div>
      </div>
    </section>
  );
}
