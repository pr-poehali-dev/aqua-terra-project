import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

const LEAD_URL = 'https://functions.poehali.dev/65042d39-89d6-40d3-9d30-42b0ccb9d003';
const ARTICLES_URL = 'https://functions.poehali.dev/c111c540-337c-4680-8bd9-f05e940f8dbf';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  cover_url: string | null;
  created_at: string;
}

const HERO_IMG = 'https://cdn.poehali.dev/projects/a4014f0d-2686-48db-be64-812eb2af31a9/files/e5f0d30d-ddcd-4698-9e7c-61167861b392.jpg';

const NAV = [
  { id: 'home', label: 'Главная' },
  { id: 'services', label: 'Услуги' },
  { id: 'shop', label: 'Магазин' },
  { id: 'portfolio', label: 'Портфолио' },
  { id: 'articles', label: 'Статьи' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contacts', label: 'Контакты' },
];

const SERVICES = [
  { icon: 'Fish', title: 'Аквариумы', desc: 'Оформление, обслуживание и перевозка пресных и морских аквариумов любой сложности.' },
  { icon: 'Turtle', title: 'Террариумы', desc: 'Создание и сервис террариумов под рептилий, амфибий и членистоногих.' },
  { icon: 'Sprout', title: 'Флорариумы', desc: 'Живые композиции из растений в стекле — для дома и офиса.' },
  { icon: 'Waves', title: 'Палюдариумы', desc: 'Гибрид воды и суши: тропический уголок природы под ключ.' },
  { icon: 'Wrench', title: 'Обслуживание', desc: 'Регулярный уход, чистка, подмена воды, контроль параметров.' },
  { icon: 'Truck', title: 'Перевозка', desc: 'Бережная транспортировка систем и обитателей без стресса.' },
];

const CATEGORIES = [
  { id: 'all', label: 'Всё', icon: 'LayoutGrid' },
  { id: 'animals', label: 'Животные', icon: 'Bug' },
  { id: 'food', label: 'Корма', icon: 'Wheat' },
  { id: 'supplies', label: 'Материалы', icon: 'Package' },
];

const PRODUCTS = [
  { name: 'Геккон эублефар', price: '4 500 ₽', cat: 'animals', tag: 'Рептилия', icon: 'Turtle' },
  { name: 'Креветка Вишня', price: '120 ₽', cat: 'animals', tag: 'Аквариум', icon: 'Fish' },
  { name: 'Паук-птицеед', price: '2 800 ₽', cat: 'animals', tag: 'Экзотика', icon: 'Bug' },
  { name: 'Сверчок банановый', price: '350 ₽', cat: 'food', tag: 'Живой корм', icon: 'Bug' },
  { name: 'Мыши кормовые', price: '90 ₽', cat: 'food', tag: 'Заморозка', icon: 'Wheat' },
  { name: 'Зофобас', price: '420 ₽', cat: 'food', tag: 'Живой корм', icon: 'Wheat' },
  { name: 'Грунт питательный', price: '1 200 ₽', cat: 'supplies', tag: 'Аквариум', icon: 'Package' },
  { name: 'Лампа УФ для рептилий', price: '2 100 ₽', cat: 'supplies', tag: 'Террариум', icon: 'Lightbulb' },
  { name: 'Фильтр внешний', price: '5 600 ₽', cat: 'supplies', tag: 'Оборудование', icon: 'Settings' },
];

const PORTFOLIO = [
  { title: 'Морской риф 400л', tag: 'Аквариум', icon: 'Fish' },
  { title: 'Тропический палюдариум', tag: 'Палюдариум', icon: 'Waves' },
  { title: 'Пустынный террариум', tag: 'Террариум', icon: 'Turtle' },
  { title: 'Акваскейп «Лес»', tag: 'Аквариум', icon: 'Sprout' },
];

const FAQ = [
  { q: 'Как часто нужно обслуживать аквариум?', a: 'Зависит от объёма и населения — обычно раз в 1-2 недели. Мы подберём индивидуальный график.' },
  { q: 'Вы перевозите аквариумы с рыбами?', a: 'Да, мы бережно транспортируем как систему, так и обитателей с сохранением параметров воды.' },
  { q: 'Можно ли заказать животное под заказ?', a: 'Конечно. Напишите нам, какой вид интересует — подберём здорового питомца от проверенных заводчиков.' },
  { q: 'Даёте ли гарантию на оформление?', a: 'Да, на все работы и оборудование действует гарантия, условия обсуждаем индивидуально.' },
];

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const Index = () => {
  const { toast } = useToast();
  const [cat, setCat] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [sending, setSending] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<(Article & { content?: string }) | null>(null);
  const filtered = cat === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.cat === cat);

  useEffect(() => {
    fetch(ARTICLES_URL).then((r) => r.json()).then(setArticles).catch(() => {});
  }, []);

  const openArticle = async (slug: string) => {
    const res = await fetch(`${ARTICLES_URL}?slug=${slug}`);
    const data = await res.json();
    setSelectedArticle(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) {
      toast({ title: 'Заполните имя и контакт', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const res = await fetch(LEAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Заявка отправлена!', description: 'Мы свяжемся с вами в ближайшее время.' });
      setForm({ name: '', contact: '', message: '' });
    } catch {
      toast({ title: 'Не удалось отправить', description: 'Попробуйте позже или напишите нам напрямую.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container flex items-center justify-between h-20 px-4 md:px-6">
          <button onClick={() => scrollTo('home')}>
            <Logo size="sm" />
          </button>
          <nav className="hidden md:flex items-center gap-7">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => scrollTo(n.id)} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {n.label}
              </button>
            ))}
          </nav>
          <Button onClick={() => scrollTo('contacts')} className="hidden md:inline-flex">Связаться</Button>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? 'X' : 'Menu'} size={26} />
          </button>
        </div>
        {menuOpen && (
          <nav className="md:hidden flex flex-col gap-1 px-4 pb-4 border-t border-border bg-background">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => { scrollTo(n.id); setMenuOpen(false); }} className="text-left py-2 text-sm font-medium text-muted-foreground hover:text-primary">
                {n.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative pt-20 min-h-[92vh] flex items-center overflow-hidden">
        <img src={HERO_IMG} alt="Аквариум" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-deep opacity-80" />
        <div className="container relative z-10 px-4 md:px-6 py-20">
          <div className="max-w-3xl animate-fade-in">
            <div className="mb-6">
              <Logo size="lg" className="mb-5" />
              <Badge className="bg-white/95 text-primary hover:bg-white border-0 text-sm font-semibold px-4 py-1.5 shadow-md">
                Аквариумы · Террариумы · Экзотика
              </Badge>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-[1.05] text-balance">
              Живая природа<br />в вашем доме
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/85 max-w-xl">
              Оформление, обслуживание и перевозка аквариумов и террариумов любой сложности. Магазин экзотических животных, кормов и материалов.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button size="lg" onClick={() => scrollTo('services')} className="bg-sand text-primary hover:bg-sand/90 text-base">
                Наши услуги
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollTo('shop')} className="bg-white/10 border-white/40 text-white hover:bg-white/20 text-base">
                В магазин <Icon name="ArrowRight" size={18} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 container px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="mb-4">Услуги</Badge>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary">Что мы делаем</h2>
          <p className="mt-4 text-muted-foreground">От идеи до готовой экосистемы — берём на себя весь процесс.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <Card key={s.title} className="p-7 hover-scale border-border hover:border-secondary/50 transition-colors">
              <span className="grid place-items-center w-14 h-14 rounded-xl bg-secondary/10 text-secondary mb-5">
                <Icon name={s.icon} size={28} />
              </span>
              <h3 className="font-display text-2xl font-semibold text-primary mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Shop */}
      <section id="shop" className="py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4">Магазин</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary">Каталог</h2>
            <p className="mt-4 text-muted-foreground">Животные, корма и расходные материалы — фильтруйте по категориям.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors border ${
                  cat === c.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                <Icon name={c.icon} size={16} />
                {c.label}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <Card key={p.name} className="overflow-hidden hover-scale group">
                <div className="aspect-[4/3] gradient-deep grid place-items-center text-white/90 relative">
                  <Icon name={p.icon} size={56} className="group-hover:animate-float" />
                  <Badge className="absolute top-3 left-3 bg-sand text-primary hover:bg-sand">{p.tag}</Badge>
                </div>
                <div className="p-5 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-primary">{p.name}</h3>
                    <p className="text-secondary font-bold mt-1">{p.price}</p>
                  </div>
                  <Button size="icon" variant="secondary" className="shrink-0">
                    <Icon name="ShoppingCart" size={18} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-24 container px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="mb-4">Портфолио</Badge>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary">Наши работы</h2>
          <p className="mt-4 text-muted-foreground">Реализованные проекты разной сложности и стилистики.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PORTFOLIO.map((p) => (
            <div key={p.title} className="group relative aspect-[3/4] rounded-2xl overflow-hidden gradient-deep cursor-pointer">
              <div className="absolute inset-0 grid place-items-center opacity-30 group-hover:opacity-50 transition-opacity">
                <Icon name={p.icon} size={64} className="text-white" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
                <Badge className="bg-sand text-primary hover:bg-sand mb-2">{p.tag}</Badge>
                <h3 className="font-display text-xl font-semibold text-white">{p.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section id="articles" className="py-24 container px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="mb-4">Статьи</Badge>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary">Полезные материалы</h2>
          <p className="mt-4 text-muted-foreground">Советы по уходу, обустройству и содержанию живых систем.</p>
        </div>
        {articles.length === 0 ? (
          <p className="text-center text-muted-foreground">Статьи скоро появятся.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((a) => (
              <Card key={a.id} className="overflow-hidden hover-scale group cursor-pointer" onClick={() => openArticle(a.slug)}>
                <div className="aspect-[16/9] gradient-deep grid place-items-center text-white/40">
                  {a.cover_url
                    ? <img src={a.cover_url} alt={a.title} className="w-full h-full object-cover" />
                    : <Icon name="BookOpen" size={48} />}
                </div>
                <div className="p-5">
                  <Badge variant="outline" className="text-xs mb-3">{a.category}</Badge>
                  <h3 className="font-display text-xl font-semibold text-primary mb-2 leading-snug">{a.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{a.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-secondary text-sm font-medium mt-4">
                    Читать <Icon name="ArrowRight" size={14} />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Article modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4 md:p-10" onClick={() => setSelectedArticle(null)}>
          <Card className="w-full max-w-3xl my-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 md:p-10">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <Badge variant="outline" className="mb-3">{selectedArticle.category}</Badge>
                  <h2 className="font-display text-3xl font-bold text-primary">{selectedArticle.title}</h2>
                </div>
                <button onClick={() => setSelectedArticle(null)} className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors">
                  <Icon name="X" size={22} />
                </button>
              </div>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
                {selectedArticle.content}
              </div>
            </div>
          </Card>
        </div>
      )}

      <section id="faq" className="py-24 bg-muted/50">
        <div className="container px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary">Частые вопросы</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-card border border-border rounded-xl px-5">
                <AccordionTrigger className="text-left font-medium text-primary hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contacts */}
      <section id="contacts" className="py-24 container px-4 md:px-6">
        <Card className="overflow-hidden grid md:grid-cols-2">
          <div className="gradient-deep p-10 md:p-12 text-white">
            <h2 className="font-display text-4xl font-bold mb-4">Свяжитесь с нами</h2>
            <p className="text-white/80 mb-8">Расскажите о задаче — подберём решение под ваш интерьер и бюджет.</p>
            <p className="text-white/70 text-sm mb-5 -mt-4">Алексей Мосягин</p>
            <ul className="space-y-4 text-white/90">
              <li className="flex items-center gap-3">
                <Icon name="Phone" size={20} />
                <a href="tel:+79055337226" className="hover:text-white transition-colors">+7 905 533 7226</a>
              </li>
              <li className="flex items-center gap-3">
                <Icon name="Mail" size={20} />
                <a href="mailto:aquascale@mail.ru" className="hover:text-white transition-colors">aquascale@mail.ru</a>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="MapPin" size={20} className="mt-0.5 shrink-0" />
                <span>Московская обл., г. Звенигород,<br />ул. Садовая, д. 2</span>
              </li>
            </ul>
            <div className="flex gap-3 mt-8">
              <a href="https://t.me/aquascale" target="_blank" rel="noopener noreferrer" className="grid place-items-center w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Icon name="Send" size={20} />
              </a>
              <a href="https://wa.me/79055337226" target="_blank" rel="noopener noreferrer" className="grid place-items-center w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Icon name="MessageCircle" size={20} />
              </a>
            </div>
          </div>
          <form className="p-10 md:p-12 space-y-4" onSubmit={submitLead}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-12 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ваше имя"
            />
            <input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full h-12 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Телефон или email"
            />
            <textarea
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Опишите задачу"
            />
            <Button size="lg" type="submit" disabled={sending} className="w-full">
              {sending ? 'Отправляем…' : 'Отправить заявку'}
            </Button>
          </form>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo size="sm" />
          <p>© 2026 AquaScale — АкваТерра Студия. Живая природа в вашем доме.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;