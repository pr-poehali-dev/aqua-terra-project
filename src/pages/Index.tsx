import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';

const LEAD_URL = 'https://functions.poehali.dev/65042d39-89d6-40d3-9d30-42b0ccb9d003';
const ARTICLES_URL = 'https://functions.poehali.dev/c111c540-337c-4680-8bd9-f05e940f8dbf';
const PRODUCTS_URL = 'https://functions.poehali.dev/31fd2710-461b-4a20-9d16-02264d66dd19';
const SERVICES_URL = 'https://functions.poehali.dev/830e0abf-4c6e-434b-b914-bacffaa6c73f';

interface Service {
  id: number;
  icon: string;
  title: string;
  description: string;
  price_from: number;
  price_unit: string;
  tags: string[];
  active: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  tag: string;
  icon: string;
  photo_url: string | null;
  description: string;
}

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
  { id: 'prices', label: 'Цены' },
  { id: 'shop', label: 'Магазин' },
  { id: 'portfolio', label: 'Портфолио' },
  { id: 'articles', label: 'Статьи' },
  { id: 'quiz', label: '🎁 Тест' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contacts', label: 'Контакты' },
];

const SERVICES_FALLBACK = [
  { id: 1, icon: 'Fish',   title: 'Оформление аквариума',   description: 'Дизайн, декор, растения, грунт — под ключ. Пресные и морские системы.',          price_from: 5000,  price_unit: 'за работу', tags: ['Пресный','Морской'],     active: true },
  { id: 2, icon: 'Turtle', title: 'Оформление террариума',  description: 'Создание живого биотопа под конкретный вид рептилий, амфибий или пауков.',         price_from: 4000,  price_unit: 'за работу', tags: ['Тропик','Пустыня'],      active: true },
  { id: 3, icon: 'Sprout', title: 'Флорариум / Палюдариум', description: 'Стеклянные сады с живыми растениями, мхами и водопадами.',                        price_from: 6000,  price_unit: 'за работу', tags: ['Флорариум','Палюдариум'],active: true },
  { id: 4, icon: 'Wrench', title: 'Обслуживание',           description: 'Регулярный уход: чистка, подмена воды, контроль параметров, корм.',               price_from: 1500,  price_unit: 'за визит',  tags: ['Разовый','Договор'],     active: true },
  { id: 5, icon: 'Truck',  title: 'Перевозка',              description: 'Бережная транспортировка аквариумов и террариумов с обитателями.',                price_from: 2000,  price_unit: 'за выезд',  tags: ['По городу','МО'],        active: true },
  { id: 6, icon: 'Star',   title: 'Консультация',           description: 'Подбор оборудования, животных, параметров воды — онлайн или на выезде.',          price_from: 500,   price_unit: 'онлайн',    tags: ['Онлайн','Выезд'],        active: true },
];

const CATEGORIES = [
  { id: 'all', label: 'Всё', icon: 'LayoutGrid' },
  { id: 'animals', label: 'Животные', icon: 'Bug' },
  { id: 'food', label: 'Корма', icon: 'Wheat' },
  { id: 'supplies', label: 'Материалы', icon: 'Package' },
];



const PORTFOLIO = [
  { title: 'Морской риф 400л', tag: 'Аквариум', icon: 'Fish' },
  { title: 'Тропический палюдариум', tag: 'Палюдариум', icon: 'Waves' },
  { title: 'Пустынный террариум', tag: 'Террариум', icon: 'Turtle' },
  { title: 'Акваскейп «Лес»', tag: 'Аквариум', icon: 'Sprout' },
];



const QUIZ = [
  {
    question: 'Что тебя привлекает больше всего?',
    answers: [
      { text: '🌊 Подводный мир и рыбы', type: 'aqua' },
      { text: '🦎 Рептилии и экзотические животные', type: 'terra' },
      { text: '🌿 Растения и живая природа', type: 'flora' },
    ],
  },
  {
    question: 'Какую атмосферу ты хочешь дома?',
    answers: [
      { text: '💙 Спокойную и медитативную', type: 'aqua' },
      { text: '🔥 Дикую и необычную', type: 'terra' },
      { text: '🍃 Тёплую и уютную', type: 'flora' },
    ],
  },
  {
    question: 'Сколько времени готов уделять уходу?',
    answers: [
      { text: '⏱ Минимум, всё само', type: 'flora' },
      { text: '🕐 Раз в неделю с удовольствием', type: 'aqua' },
      { text: '🕐 Каждый день — мне нравится', type: 'terra' },
    ],
  },
];

const RESULTS: Record<string, { emoji: string; title: string; desc: string; tip: string }> = {
  aqua: {
    emoji: '🐠',
    title: 'Хранитель Рифа',
    desc: 'Ты создан для подводного мира. Твоя стихия — аквариумы с живыми растениями, яркими рыбами и успокаивающим течением воды.',
    tip: 'В нашем Telegram — советы по запуску первого аквариума и подборки лучших рыб для начинающих.',
  },
  terra: {
    emoji: '🦎',
    title: 'Повелитель Пустыни',
    desc: 'Ты любишь необычное и смелое. Экзотические рептилии, пауки и нестандартные питомцы — твой выбор.',
    tip: 'В нашем Telegram — гайды по уходу за геккончиками, хамелеонами и другими экзотами.',
  },
  flora: {
    emoji: '🌿',
    title: 'Дух Джунглей',
    desc: 'Ты ценишь живую природу и уют. Флорариумы, палюдариумы и зелёные уголки — твоё призвание.',
    tip: 'В нашем Telegram — идеи для зелёных уголков дома и советы по растениям для любых условий.',
  },
};

const FAQ = [
  { q: 'Как часто нужно обслуживать аквариум?', a: 'Зависит от объёма и населения — обычно раз в 1-2 недели. Мы подберём индивидуальный график.' },
  { q: 'Вы перевозите аквариумы с рыбами?', a: 'Да, мы бережно транспортируем как систему, так и обитателей с сохранением параметров воды.' },
  { q: 'Можно ли заказать животное под заказ?', a: 'Конечно. Напишите нам, какой вид интересует — подберём здорового питомца от проверенных заводчиков.' },
  { q: 'Даёте ли гарантию на оформление?', a: 'Да, на все работы и оборудование действует гарантия, условия обсуждаем индивидуально.' },
];

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

function CartOrderForm({ onSubmit, sending }: { onSubmit: (contact: string) => void; sending: boolean }) {
  const [contact, setContact] = useState('');
  return (
    <div className="space-y-3">
      <input
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Телефон или Telegram для связи"
        className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
      />
      <Button className="w-full" size="lg" disabled={sending} onClick={() => onSubmit(contact)}>
        {sending ? 'Отправляем…' : 'Оформить заказ'}
      </Button>
      <p className="text-xs text-muted-foreground text-center">Мы свяжемся для подтверждения и оплаты</p>
    </div>
  );
}

const Index = () => {
  const { toast } = useToast();
  const cart = useCart();
  const [cat, setCat] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [sending, setSending] = useState(false);
  const [orderSending, setOrderSending] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<(Article & { content?: string }) | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [quizStep, setQuizStep] = useState(0);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({ aqua: 0, terra: 0, flora: 0 });
  const [quizResult, setQuizResult] = useState<string | null>(null);

  const answerQuiz = (type: string) => {
    const next = { ...quizScores, [type]: quizScores[type] + 1 };
    setQuizScores(next);
    if (quizStep + 1 >= QUIZ.length) {
      const winner = Object.entries(next).sort((a, b) => b[1] - a[1])[0][0];
      setQuizResult(winner);
    } else {
      setQuizStep(quizStep + 1);
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizScores({ aqua: 0, terra: 0, flora: 0 });
    setQuizResult(null);
  };
  const filtered = cat === 'all' ? products : products.filter((p) => p.category === cat);

  useEffect(() => {
    fetch(ARTICLES_URL).then((r) => r.json()).then(setArticles).catch(() => {});
    fetch(PRODUCTS_URL).then((r) => r.json()).then(setProducts).catch(() => {});
    fetch(SERVICES_URL).then((r) => r.json()).then((d) => { setServices(d); setServicesLoaded(true); }).catch(() => setServicesLoaded(true));
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openArticle = async (slug: string) => {
    const res = await fetch(`${ARTICLES_URL}?slug=${slug}`);
    const data = await res.json();
    setSelectedArticle(data);
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

  const submitOrder = async (contact: string) => {
    if (!contact.trim()) {
      toast({ title: 'Введите телефон или Telegram для связи', variant: 'destructive' });
      return;
    }
    setOrderSending(true);
    const itemsList = cart.items.map((i) => `• ${i.name} × ${i.qty} = ${(i.priceNum * i.qty).toLocaleString('ru')} ₽`).join('\n');
    const message = `🛒 Заказ из корзины\n\nКонтакт: ${contact}\n\nТовары:\n${itemsList}\n\nИтого: ${cart.total.toLocaleString('ru')} ₽`;
    try {
      const res = await fetch(LEAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Заказ из корзины', contact, message }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Заказ отправлен!', description: 'Мы свяжемся с вами для подтверждения.' });
      cart.clear();
      cart.setOpen(false);
    } catch {
      toast({ title: 'Не удалось отправить', description: 'Напишите нам напрямую.', variant: 'destructive' });
    } finally {
      setOrderSending(false);
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
          <div className="flex items-center gap-2">
            <Button onClick={() => scrollTo('contacts')} className="hidden md:inline-flex">Связаться</Button>
            <button
              onClick={() => cart.setOpen(true)}
              className="relative grid place-items-center w-11 h-11 rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <Icon name="ShoppingCart" size={22} />
              {cart.count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-secondary text-white text-xs font-bold rounded-full grid place-items-center">
                  {cart.count}
                </span>
              )}
            </button>
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              <Icon name={menuOpen ? 'X' : 'Menu'} size={26} />
            </button>
          </div>
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
              <Logo size="lg" light className="mb-5" />
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

        {/* Quiz promo button */}
        <button
          onClick={() => scrollTo('quiz')}
          className="absolute bottom-10 right-6 md:right-12 z-20 group animate-wiggle"
          aria-label="Пройти тест и получить скидку"
        >
          {/* pulse rings */}
          <span className="absolute inset-0 rounded-2xl bg-yellow-400 animate-pulse-ring opacity-70" />
          <span className="absolute inset-0 rounded-2xl bg-yellow-400 animate-pulse-ring opacity-50" style={{ animationDelay: '0.5s' }} />

          <div className="relative bg-gradient-to-br from-yellow-400 to-orange-400 text-gray-900 rounded-2xl px-5 py-4 shadow-2xl flex flex-col items-center gap-1 min-w-[160px] group-hover:scale-105 transition-transform duration-200">
            <span className="text-3xl">🎁</span>
            <span className="font-bold text-base leading-tight text-center">Скидка 10%</span>
            <span className="text-xs font-medium text-gray-800/80 text-center leading-tight">Пройди тест и получи<br />промокод + розыгрыш</span>
            <span className="mt-1 flex items-center gap-1 text-xs font-bold bg-white/30 rounded-full px-3 py-0.5">
              Попробовать <Icon name="ArrowRight" size={12} />
            </span>
          </div>
        </button>
      </section>

      {/* Services */}
      <section id="services" className="py-24 container px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="mb-4">Услуги</Badge>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary">Что мы делаем</h2>
          <p className="mt-4 text-muted-foreground">От идеи до готовой экосистемы — берём на себя весь процесс.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(servicesLoaded ? services : SERVICES_FALLBACK).map((s) => (
            <Card key={s.title} className="p-7 hover-scale border-border hover:border-secondary/50 transition-colors">
              <span className="grid place-items-center w-14 h-14 rounded-xl bg-secondary/10 text-secondary mb-5">
                <Icon name={s.icon} size={28} />
              </span>
              <h3 className="font-display text-2xl font-semibold text-primary mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Prices */}
      <section id="prices" className="py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4">Цены</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary">Стоимость услуг</h2>
            <p className="mt-4 text-muted-foreground">Итоговая цена зависит от объёма и сложности — уточним на консультации.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(servicesLoaded ? services : SERVICES_FALLBACK).map((s) => (
              <Card key={s.id ?? s.title} className="p-7 flex flex-col hover-scale border-border hover:border-primary/30 transition-colors">
                <span className="grid place-items-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-5">
                  <Icon name={s.icon} size={28} />
                </span>
                <h3 className="font-display text-2xl font-semibold text-primary mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-5">{s.description}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {(s.tags || []).map((t: string) => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
                <div className="flex items-end justify-between border-t border-border pt-5">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">от</p>
                    <p className="font-display text-3xl font-bold text-primary leading-none">
                      {(s.price_from ?? 0).toLocaleString('ru')} <span className="text-base font-sans font-normal">₽</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{s.price_unit}</p>
                  </div>
                  <Button size="sm" onClick={() => scrollTo('contacts')}>Заказать</Button>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-10">
            Цены указаны ориентировочно. Точный расчёт — после обсуждения вашего проекта.
          </p>
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
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-10">Товары загружаются…</p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <Card key={p.id} className="overflow-hidden hover-scale group cursor-pointer" onClick={() => setSelectedProduct(p)}>
                <div className="aspect-[4/3] gradient-deep grid place-items-center text-white/90 relative overflow-hidden">
                  {p.photo_url
                    ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover absolute inset-0" />
                    : <Icon name={p.icon} size={56} className="group-hover:animate-float" />
                  }
                  <Badge className="absolute top-3 left-3 bg-sand text-primary hover:bg-sand z-10">{p.tag}</Badge>
                </div>
                <div className="p-5 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-primary">{p.name}</h3>
                    <p className="text-secondary font-bold mt-1">{p.price.toLocaleString('ru')} ₽</p>
                  </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="shrink-0"
                    onClick={(e) => { e.stopPropagation(); cart.add({ name: p.name, price: `${p.price}`, icon: p.icon, tag: p.tag }); }}
                  >
                    <Icon name="ShoppingCart" size={18} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Product modal */}
          {selectedProduct && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
              <Card className="w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="aspect-video gradient-deep relative overflow-hidden">
                  {selectedProduct.photo_url
                    ? <img src={selectedProduct.photo_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full grid place-items-center text-white/60"><Icon name={selectedProduct.icon} size={72} /></div>
                  }
                  <button onClick={() => setSelectedProduct(null)} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 grid place-items-center text-white transition-colors">
                    <Icon name="X" size={18} />
                  </button>
                  <Badge className="absolute top-3 left-3 bg-sand text-primary hover:bg-sand">{selectedProduct.tag}</Badge>
                </div>
                <div className="p-6">
                  <h2 className="font-display text-2xl font-bold text-primary mb-1">{selectedProduct.name}</h2>
                  <p className="text-secondary text-2xl font-bold mb-4">{selectedProduct.price.toLocaleString('ru')} ₽</p>
                  {selectedProduct.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed mb-5 whitespace-pre-line">{selectedProduct.description}</p>
                  )}
                  <Button className="w-full" size="lg" onClick={() => { cart.add({ name: selectedProduct.name, price: `${selectedProduct.price}`, icon: selectedProduct.icon, tag: selectedProduct.tag }); setSelectedProduct(null); }}>
                    <Icon name="ShoppingCart" size={18} className="mr-2" /> В корзину
                  </Button>
                </div>
              </Card>
            </div>
          )}
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
              <div
                className="prose prose-sm max-w-none text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: selectedArticle.content || '' }}
              />
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

      {/* Quiz */}
      <section id="quiz" className="py-24 container px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">Тест</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary">Кто ты в мире экзотики?</h2>
            <p className="mt-4 text-muted-foreground">3 вопроса — и ты узнаешь свой тип + получишь подарок 🎁</p>
          </div>

          <Card className="p-8 md:p-10">
            {quizResult ? (
              /* Result screen */
              <div className="text-center">
                <div className="text-7xl mb-4">{RESULTS[quizResult].emoji}</div>
                <h3 className="font-display text-3xl font-bold text-primary mb-3">{RESULTS[quizResult].title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">{RESULTS[quizResult].desc}</p>

                <div className="bg-muted/60 rounded-2xl p-6 mb-8 text-left">
                  <p className="text-sm font-semibold text-primary mb-1">💡 Специально для тебя:</p>
                  <p className="text-muted-foreground text-sm">{RESULTS[quizResult].tip}</p>
                </div>

                <div className="gradient-deep rounded-2xl p-6 mb-6 text-white">
                  <p className="text-white/80 text-sm mb-2">Подпишись на наш Telegram-канал и получи:</p>
                  <ul className="text-left space-y-2 mb-5">
                    <li className="flex items-center gap-2 text-sm"><Icon name="Tag" size={16} className="text-sand shrink-0" /> Промокод <strong>AQUA10</strong> — скидка 10% на первый заказ</li>
                    <li className="flex items-center gap-2 text-sm"><Icon name="Gift" size={16} className="text-sand shrink-0" /> Участие в ежемесячном розыгрыше призов из магазина</li>
                    <li className="flex items-center gap-2 text-sm"><Icon name="BookOpen" size={16} className="text-sand shrink-0" /> Эксклюзивный контент для твоего типа</li>
                  </ul>
                  <a
                    href="https://t.me/aquascale"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-white text-primary font-bold py-3 rounded-xl hover:bg-sand transition-colors text-base"
                  >
                    <Icon name="Send" size={20} /> Подписаться на Telegram
                  </a>
                </div>

                <button onClick={resetQuiz} className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4">
                  Пройти тест заново
                </button>
              </div>
            ) : (
              /* Question screen */
              <div>
                <div className="flex justify-between items-center mb-8">
                  <span className="text-sm text-muted-foreground">Вопрос {quizStep + 1} из {QUIZ.length}</span>
                  <div className="flex gap-1.5">
                    {QUIZ.map((_, i) => (
                      <span key={i} className={`h-2 rounded-full transition-all duration-300 ${i <= quizStep ? 'bg-primary w-8' : 'bg-muted w-4'}`} />
                    ))}
                  </div>
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-7 text-center">
                  {QUIZ[quizStep].question}
                </h3>
                <div className="space-y-3">
                  {QUIZ[quizStep].answers.map((a) => (
                    <button
                      key={a.text}
                      onClick={() => answerQuiz(a.type)}
                      className="w-full text-left px-6 py-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 font-medium text-foreground text-base"
                    >
                      {a.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Cart Sheet */}
      <Sheet open={cart.open} onOpenChange={cart.setOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-display text-2xl text-primary">
              <Icon name="ShoppingCart" size={22} /> Корзина
              {cart.count > 0 && <Badge variant="secondary">{cart.count}</Badge>}
            </SheetTitle>
          </SheetHeader>

          {cart.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Icon name="ShoppingCart" size={48} className="opacity-20" />
              <p className="text-sm">Корзина пуста</p>
              <Button variant="outline" size="sm" onClick={() => { cart.setOpen(false); scrollTo('shop'); }}>
                Перейти в магазин
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto py-4">
              {/* Items */}
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="grid place-items-center w-12 h-12 rounded-lg gradient-deep text-white shrink-0">
                      <Icon name={item.icon} size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-primary truncate">{item.name}</p>
                      <p className="text-secondary text-sm font-bold">{item.priceNum.toLocaleString('ru')} ₽</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => cart.change(item.name, item.qty - 1)} className="w-7 h-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-sm font-bold">−</button>
                      <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                      <button onClick={() => cart.change(item.name, item.qty + 1)} className="w-7 h-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-sm font-bold">+</button>
                    </div>
                    <button onClick={() => cart.remove(item.name)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-border pt-4 mt-auto">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-muted-foreground">Итого:</span>
                  <span className="font-display text-2xl font-bold text-primary">{cart.total.toLocaleString('ru')} ₽</span>
                </div>

                {/* Contact for order */}
                <CartOrderForm onSubmit={submitOrder} sending={orderSending} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Scroll buttons */}
      {scrollY > 300 && (
        <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-11 h-11 rounded-full gradient-deep text-white shadow-lg hover:scale-110 transition-transform grid place-items-center"
            title="Наверх"
          >
            <Icon name="ArrowUp" size={20} />
          </button>
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="w-11 h-11 rounded-full bg-card border border-border text-muted-foreground shadow-lg hover:scale-110 hover:text-primary transition-all grid place-items-center"
            title="Вниз"
          >
            <Icon name="ArrowDown" size={20} />
          </button>
        </div>
      )}

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