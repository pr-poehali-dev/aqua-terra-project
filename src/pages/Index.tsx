import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Logo from '@/components/Logo';
import Bubbles from '@/components/Bubbles';
import WaveDivider from '@/components/WaveDivider';
import DecoIcons from '@/components/DecoIcons';
import StatCounter from '@/components/StatCounter';
import WaterCursor from '@/components/WaterCursor';
import Plankton from '@/components/Plankton';
import MagneticCard from '@/components/MagneticCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { useTheme } from '@/hooks/use-theme';

const LEAD_URL = 'https://functions.poehali.dev/65042d39-89d6-40d3-9d30-42b0ccb9d003';
const ARTICLES_URL = 'https://functions.poehali.dev/c111c540-337c-4680-8bd9-f05e940f8dbf';
const PRODUCTS_URL = 'https://functions.poehali.dev/31fd2710-461b-4a20-9d16-02264d66dd19';
const SERVICES_URL = 'https://functions.poehali.dev/830e0abf-4c6e-434b-b914-bacffaa6c73f';
const PORTFOLIO_URL = 'https://functions.poehali.dev/86ea5a33-361e-443c-8816-3050029776df';
const PROMO_URL = 'https://functions.poehali.dev/34b026bd-3d35-40ea-bc8d-90855ba968d3';
const SETTINGS_URL = 'https://functions.poehali.dev/9257c1cb-d389-4e76-a3a9-69b452c12431';
const CATALOG_URL = 'https://functions.poehali.dev/5792c301-10d8-4ade-8987-58fa81f89be1';

interface PortfolioItem {
  id: number; title: string; tag: string; description: string;
  icon: string; photo_url: string | null; sort_order: number; active: boolean;
}

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

const HERO_IMG = 'https://cdn.poehali.dev/projects/a4014f0d-2686-48db-be64-812eb2af31a9/files/edf7718f-66d3-447b-8d42-fca02e50ee2d.jpg';

const NAV = [
  { id: 'home', label: 'Главная' },
  { id: 'services', label: 'Услуги' },
  { id: 'prices', label: 'Цены' },
  { id: 'shop', label: 'Магазин' },
  { id: 'portfolio', label: 'Портфолио' },
  { id: 'articles', label: 'Статьи' },
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





const PORTFOLIO = [
  { title: 'Морской риф 400л', tag: 'Аквариум', icon: 'Fish' },
  { title: 'Тропический палюдариум', tag: 'Палюдариум', icon: 'Waves' },
  { title: 'Пустынный террариум', tag: 'Террариум', icon: 'Turtle' },
  { title: 'Акваскейп «Лес»', tag: 'Аквариум', icon: 'Sprout' },
];



const QUIZ_FALLBACK = [
  {
    question: 'Что тебя привлекает больше всего?',
    answers: [
      { text: 'Подводный мир и рыбы', type: 'aqua' },
      { text: 'Рептилии и экзотические животные', type: 'terra' },
      { text: 'Растения и живая природа', type: 'flora' },
    ],
  },
  {
    question: 'Какую атмосферу ты хочешь дома?',
    answers: [
      { text: 'Спокойную и медитативную', type: 'aqua' },
      { text: 'Дикую и необычную', type: 'terra' },
      { text: 'Тёплую и уютную', type: 'flora' },
    ],
  },
  {
    question: 'Сколько времени готов уделять уходу?',
    answers: [
      { text: 'Минимум, всё само', type: 'flora' },
      { text: 'Раз в неделю с удовольствием', type: 'aqua' },
      { text: 'Каждый день — мне нравится', type: 'terra' },
    ],
  },
];

const RESULT_SVG: Record<string, React.FC> = {
  aqua: () => (
    <svg width="80" height="80" viewBox="0 0 48 48" fill="none" stroke="hsl(var(--secondary))" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 24 C6 14 14 8 24 8 C34 8 42 14 42 24 C42 34 34 40 24 40 C14 40 6 34 6 24Z" />
      <path d="M6 24 C2 18 2 14 6 10 L6 24Z" />
      <path d="M6 24 C2 30 2 34 6 38 L6 24Z" />
      <circle cx="34" cy="18" r="2" fill="hsl(var(--secondary))" stroke="none" />
      <path d="M18 22 Q22 20 26 22 Q22 26 18 24Z" />
      <path d="M24 8 Q28 4 32 8" />
      <path d="M24 40 Q28 44 32 40" />
    </svg>
  ),
  terra: () => (
    <svg width="80" height="80" viewBox="0 0 48 48" fill="none" stroke="hsl(var(--secondary))" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 28 Q14 22 22 22 Q30 22 36 18 Q40 15 42 12" />
      <ellipse cx="20" cy="26" rx="8" ry="5" />
      <path d="M12 30 Q10 36 8 40" />
      <path d="M14 31 Q12 37 11 42" />
      <path d="M26 30 Q28 36 28 40" />
      <path d="M24 30 Q27 37 26 42" />
      <circle cx="14" cy="23" r="1.5" fill="hsl(var(--secondary))" stroke="none" />
      <path d="M36 18 Q39 14 42 12 M36 18 Q40 18 42 12" />
    </svg>
  ),
  flora: () => (
    <svg width="80" height="80" viewBox="0 0 48 48" fill="none" stroke="hsl(var(--secondary))" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 40 Q24 24 24 16" />
      <path d="M24 30 Q16 26 12 18 Q18 16 24 22" />
      <path d="M24 24 Q32 20 36 12 Q30 10 24 18" />
      <path d="M24 36 Q18 34 14 28 Q20 26 24 32" />
    </svg>
  ),
};

const RESULTS_FALLBACK: Record<string, { title: string; desc: string; tip: string }> = {
  aqua: {
    title: 'Хранитель Рифа',
    desc: 'Ты создан для подводного мира. Твоя стихия — аквариумы с живыми растениями, яркими рыбами и успокаивающим течением воды.',
    tip: 'В нашем Telegram — советы по запуску первого аквариума и подборки лучших рыб для начинающих.',
  },
  terra: {
    title: 'Повелитель Пустыни',
    desc: 'Ты любишь необычное и смелое. Экзотические рептилии, пауки и нестандартные питомцы — твой выбор.',
    tip: 'В нашем Telegram — гайды по уходу за геккончиками, хамелеонами и другими экзотами.',
  },
  flora: {
    title: 'Дух Джунглей',
    desc: 'Ты ценишь живую природу и уют. Флорариумы, палюдариумы и зелёные уголки — твоё призвание.',
    tip: 'В нашем Telegram — идеи для зелёных уголков дома и советы по растениям для любых условий.',
  },
};

const FAQ_FALLBACK = [
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
  const navigate = useNavigate();
  const cart = useCart();
  const { theme, toggle: toggleTheme } = useTheme();
  const [cat, setCat] = useState<string>('all');
  const [catalogSections, setCatalogSections] = useState<{id: number; slug: string; title: string; icon: string; active: boolean; categories: {id: number; slug: string; title: string; icon: string; active: boolean}[]}[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [sending, setSending] = useState(false);
  const [orderSending, setOrderSending] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<(Article & { content?: string }) | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);

  const SECTION_IDS = ['home', 'services', 'prices', 'shop', 'portfolio', 'articles', 'faq', 'contacts'];

  const goSection = (dir: 1 | -1) => {
    if (dir === -1 && activeSection === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const next = Math.max(0, Math.min(SECTION_IDS.length - 1, activeSection + dir));
    document.getElementById(SECTION_IDS[next])?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(next);
  };
  const heroImgRef = useRef<HTMLImageElement>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({ aqua: 0, terra: 0, flora: 0 });
  const [quizResult, setQuizResult] = useState<string | null>(null);

  // Dynamic content from API
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [faqData, setFaqData] = useState<{ q: string; a: string }[]>(FAQ_FALLBACK);
  const [quizData, setQuizData] = useState<{ question: string; answers: { text: string; type: string }[] }[]>(QUIZ_FALLBACK);
  const [resultsData, setResultsData] = useState<Record<string, { title: string; desc: string; tip: string }>>(RESULTS_FALLBACK);

  const applyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await fetch(`${PROMO_URL}?action=apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setPromoDiscount(data.discount);
        toast({ title: `Промокод применён! Скидка ${data.discount}%` });
      } else {
        setPromoError(data.error || 'Промокод не найден');
        setPromoDiscount(0);
      }
    } catch {
      setPromoError('Ошибка проверки промокода');
    } finally {
      setPromoLoading(false);
    }
  };

  const discountedTotal = promoDiscount > 0
    ? Math.round(cart.total * (1 - promoDiscount / 100))
    : cart.total;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return { products: [], articles: [] };
    return {
      products: products.filter(p =>
        p.name.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      ).slice(0, 5),
      articles: articles.filter(a =>
        a.title.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q)
      ).slice(0, 4),
    };
  }, [searchQuery, products, articles]);

  const answerQuiz = (type: string) => {
    const next = { ...quizScores, [type]: quizScores[type] + 1 };
    setQuizScores(next);
    if (quizStep + 1 >= quizData.length) {
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
  // Все категории из всех активных разделов каталога
  const allCatalogCategories = catalogSections
    .filter(s => s.active)
    .flatMap(s => s.categories.filter(c => c.active));

  const filtered = cat === 'all'
    ? products
    : products.filter((p) => {
        return (p as unknown as Record<string, string>)['category_slug'] === cat || p.category === cat;
      });

  useEffect(() => {
    fetch(ARTICLES_URL).then((r) => r.json()).then(setArticles).catch(() => {});
    fetch(PRODUCTS_URL).then((r) => r.json()).then(setProducts).catch(() => {});
    fetch(CATALOG_URL).then((r) => r.json()).then(setCatalogSections).catch(() => {});
    fetch(PORTFOLIO_URL).then((r) => r.json()).then(setPortfolioItems).catch(() => {});
    fetch(SERVICES_URL).then((r) => r.json()).then((d) => { setServices(d); setServicesLoaded(true); }).catch(() => setServicesLoaded(true));
    fetch(SETTINGS_URL).then(r => r.json()).then(d => {
      if (d.settings) setSiteSettings(d.settings);
      if (d.faq?.length) setFaqData(d.faq.map((f: {q: string; a: string}) => ({ q: f.q, a: f.a })));
      if (d.quiz?.length) setQuizData(d.quiz.map((q: {question: string; answers: {text: string; type: string}[]}) => ({ question: q.question, answers: q.answers })));
      if (d.quiz_results && Object.keys(d.quiz_results).length) setResultsData(d.quiz_results);
    }).catch(() => {});
    const onScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      if (heroImgRef.current) {
        heroImgRef.current.style.transform = `translateY(${y * 0.35}px)`;
      }
      const idx = SECTION_IDS.map(id => {
        const el = document.getElementById(id);
        return el ? Math.abs(el.getBoundingClientRect().top) : Infinity;
      }).reduce((bestIdx, dist, i, arr) => dist < arr[bestIdx] ? i : bestIdx, 0);
      setActiveSection(idx);
    };
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
      <WaterCursor />
      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
          <div className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <Icon name="Search" size={20} className="text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground text-foreground"
                placeholder="Поиск по товарам и статьям…"
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="X" size={20} />
              </button>
            </div>
            {searchQuery.length >= 2 && (
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
                {searchResults.products.length === 0 && searchResults.articles.length === 0 && (
                  <p className="text-center text-muted-foreground py-10 text-sm">Ничего не найдено</p>
                )}
                {searchResults.products.length > 0 && (
                  <div className="p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Товары</p>
                    {searchResults.products.map(p => (
                      <button key={p.id} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                        onClick={() => { setSelectedProduct(p); setSearchOpen(false); setSearchQuery(''); }}>
                        <span className="w-9 h-9 rounded-lg gradient-deep grid place-items-center shrink-0">
                          <Icon name={p.icon} size={18} className="text-white" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.price.toLocaleString('ru')} ₽ · {p.tag}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.articles.length > 0 && (
                  <div className="p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Статьи</p>
                    {searchResults.articles.map(a => (
                      <button key={a.id} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                        onClick={() => { setSelectedArticle(a); setSearchOpen(false); setSearchQuery(''); scrollTo('articles'); }}>
                        <span className="w-9 h-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                          <Icon name="BookOpen" size={16} className="text-primary" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.excerpt}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {searchQuery.length < 2 && (
              <div className="px-5 py-6 text-sm text-muted-foreground flex flex-wrap gap-2">
                <span>Попробуйте:</span>
                {['рыба', 'черепаха', 'аквариум', 'корм', 'растение'].map(hint => (
                  <button key={hint} onClick={() => setSearchQuery(hint)} className="px-3 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors">{hint}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
            {/* Search */}
            <button onClick={() => setSearchOpen(true)} className="grid place-items-center w-11 h-11 rounded-xl border border-border hover:bg-muted transition-colors">
              <Icon name="Search" size={20} />
            </button>
            {/* Theme toggle */}
            <button onClick={toggleTheme} className="grid place-items-center w-11 h-11 rounded-xl border border-border hover:bg-muted transition-colors" title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
              <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={20} />
            </button>
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
          <div className="md:hidden fixed inset-0 top-20 z-40 bg-background flex flex-col border-t border-border">
            <nav className="flex flex-col px-6 pt-6 pb-8 gap-1 flex-1">
              {NAV.map((n, i) => (
                <button
                  key={n.id}
                  onClick={() => { scrollTo(n.id); setMenuOpen(false); }}
                  className="flex items-center justify-between py-4 border-b border-border/50 text-left group"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="font-display text-2xl font-semibold text-primary group-hover:text-secondary transition-colors">{n.label}</span>
                  <Icon name="ArrowRight" size={18} className="text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </nav>
            <div className="px-6 pb-8 space-y-3">
              <a href="tel:+79055337226" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                <Icon name="Phone" size={18} /> +7 905 533 7226
              </a>
              <a href="https://t.me/aquascale" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                <Icon name="Send" size={18} /> Telegram
              </a>
              <Button className="w-full mt-2" onClick={() => { scrollTo('contacts'); setMenuOpen(false); }}>Оставить заявку</Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative pt-20 min-h-[92vh] flex items-center overflow-hidden">
        <img
          ref={heroImgRef}
          src={HERO_IMG}
          alt="Аквариум"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ willChange: 'transform', transformOrigin: 'center top', height: '130%', top: '-15%', objectPosition: 'center 30%' }}
        />
        {/* Левый градиент — зона текста */}
        <div className="absolute inset-0" style={{background: 'linear-gradient(to right, hsl(150 50% 5% / 0.95) 0%, hsl(150 50% 5% / 0.75) 40%, hsl(150 50% 5% / 0.2) 70%, transparent 100%)'}} />
        {/* Нижний градиент — волна */}
        <div className="absolute inset-x-0 bottom-0 h-1/2" style={{background: 'linear-gradient(to top, hsl(150 50% 5% / 0.95) 0%, transparent 100%)'}} />
        <div className="container relative z-10 px-4 md:px-6 py-20">
          <div className="max-w-lg animate-fade-in">
            <div className="mb-6">
              <Logo size="lg" light className="mb-5" />
              <Badge className="bg-white/95 text-primary hover:bg-white border-0 text-sm font-semibold px-4 py-1.5 shadow-md">
                {siteSettings.hero_badge || 'Аквариумы · Террариумы · Экзотика'}
              </Badge>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-[1.05] text-balance">
              {siteSettings.hero_title || 'Живая природа в вашем доме'}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/85 max-w-xl">
              {siteSettings.hero_subtitle || 'Оформление, обслуживание и перевозка аквариумов и террариумов любой сложности. Магазин экзотических животных, кормов и материалов.'}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button size="lg" onClick={() => scrollTo('services')} className="bg-sand text-primary hover:bg-sand/90 text-base">
                Наши услуги
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/shop')} className="bg-white/10 border-white/40 text-white hover:bg-white/20 text-base">
                В магазин <Icon name="ArrowRight" size={18} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 inset-x-0 z-10 pointer-events-none">
          <WaveDivider fill="hsl(var(--background))" />
        </div>


        {/* Quiz promo button — десктоп: справа; мобиле: горизонтальная полоска снизу */}
        <button
          onClick={() => scrollTo('quiz')}
          aria-label="Пройти тест и получить скидку"
          className="group z-20 animate-wiggle
            md:absolute md:bottom-14 md:right-12
            absolute bottom-0 left-0 right-0 md:left-auto md:right-12 md:bottom-14"
        >
          {/* pulse rings — только десктоп */}
          <span className="absolute inset-0 rounded-2xl bg-secondary animate-pulse-ring opacity-30 hidden md:block" />
          <span className="absolute inset-0 rounded-2xl bg-secondary animate-pulse-ring opacity-20 hidden md:block" style={{ animationDelay: '0.5s' }} />

          {/* Десктоп-версия: карточка */}
          <div className="hidden md:flex relative rounded-2xl px-5 py-4 shadow-2xl flex-col items-center gap-1 min-w-[160px] group-hover:scale-105 transition-transform duration-200 border border-secondary/40 backdrop-blur-md" style={{ background: 'linear-gradient(135deg, hsl(162 48% 14%) 0%, hsl(195 58% 18%) 100%)' }}>
            <Icon name="Tag" size={22} className="text-secondary mb-0.5" />
            <span className="font-bold text-base leading-tight text-center text-white">Скидка 10%</span>
            <span className="text-xs font-medium text-white/70 text-center leading-tight">Пройди тест и получи<br />промокод + розыгрыш</span>
            <span className="mt-1 flex items-center gap-1 text-xs font-bold bg-secondary/20 text-secondary rounded-full px-3 py-0.5">
              Попробовать <Icon name="ArrowRight" size={12} />
            </span>
          </div>

          {/* Мобильная версия: горизонтальная полоска */}
          <div className="flex md:hidden items-center justify-between px-5 py-3 border-t border-secondary/30 backdrop-blur-md" style={{ background: 'linear-gradient(90deg, hsl(162 48% 10% / 0.95) 0%, hsl(195 58% 14% / 0.95) 100%)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-secondary/20 grid place-items-center shrink-0">
                <Icon name="Tag" size={16} className="text-secondary" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-sm leading-tight">Скидка 10% на первый заказ</p>
                <p className="text-white/60 text-xs">Пройди тест — получи промокод</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-secondary shrink-0 ml-3">
              Участвовать <Icon name="ArrowRight" size={12} />
            </span>
          </div>
        </button>
      </section>

      {/* Stats */}
      <section className="py-14 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 section-reveal">
            {[
              { value: Number(siteSettings.stat_years  || 15),  suffix: ' лет', label: 'Опыта в деле' },
              { value: Number(siteSettings.stat_projects|| 200), suffix: '+',    label: 'Проектов выполнено' },
              { value: Number(siteSettings.stat_clients || 500), suffix: '+',    label: 'Довольных клиентов' },
              { value: Number(siteSettings.stat_rating  || 4.9), suffix: '',     label: 'Средний рейтинг' },
            ].map((s, i) => (
              <StatCounter key={i} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-4 md:px-6 relative bg-scales overflow-hidden">
        <DecoIcons items={[
          { emoji: '🐠', top: '8%',    left: '2%',  size: 36, dur: 7,  delay: 0,   swim: true },
          { emoji: '🦎', top: '12%',   right: '3%', size: 34, dur: 9,  delay: 1.5 },
          { emoji: '🐢', bottom: '10%',left: '1%',  size: 32, dur: 8,  delay: 3 },
          { emoji: '🌿', bottom: '5%', right: '2%', size: 30, dur: 11, delay: 0.5 },
        ]} />
        <div className="container relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4 section-reveal">Услуги</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary section-reveal" style={{animationDelay:'0.1s'}}>Что мы делаем</h2>
            <p className="mt-4 text-muted-foreground section-reveal" style={{animationDelay:'0.2s'}}>От идеи до готовой экосистемы — берём на себя весь процесс.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(servicesLoaded ? services : SERVICES_FALLBACK).map((s) => (
              <MagneticCard key={s.title} strength={8}>
                <div className="glass-card rounded-2xl p-7 transition-all duration-300 hover:shadow-xl h-full">
                  <span className="grid place-items-center w-14 h-14 rounded-xl bg-secondary/15 text-secondary mb-5">
                    <Icon name={s.icon} size={28} />
                  </span>
                  <h3 className="font-display text-2xl font-semibold text-primary mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
                </div>
              </MagneticCard>
            ))}
          </div>
        </div>
      </section>

      {/* Prices */}
      <section id="prices" className="relative bg-muted/50 overflow-hidden">
        <DecoIcons items={[
          { emoji: '🦎', top: '10%',   right: '2%',  size: 32, dur: 9,  delay: 0.5 },
          { emoji: '🐠', top: '18%',   left: '1%',   size: 28, dur: 7,  delay: 2,  swim: true },
          { emoji: '🦋', bottom: '12%',left: '2%',   size: 26, dur: 11, delay: 1 },
          { emoji: '🐍', bottom: '8%', right: '3%',  size: 30, dur: 8,  delay: 3 },
        ]} />
        <WaveDivider fill="hsl(var(--muted) / 0.5)" flip className="mt-0" />
        <div className="container px-4 md:px-6 py-16 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4">Цены</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary">Стоимость услуг</h2>
            <p className="mt-4 text-muted-foreground">Итоговая цена зависит от объёма и сложности — уточним на консультации.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(servicesLoaded ? services : SERVICES_FALLBACK).map((s) => (
              <div key={s.id ?? s.title} className="glass-card rounded-2xl p-7 flex flex-col hover-scale transition-all duration-300 hover:shadow-xl">
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
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-10">
            Цены указаны ориентировочно. Точный расчёт — после обсуждения вашего проекта.
          </p>
        </div>
        <WaveDivider fill="hsl(var(--background))" />
      </section>

      {/* Shop */}
      <section id="shop" className="pb-24 bg-background relative overflow-hidden">
        <DecoIcons items={[
          { emoji: '🐠', top: '5%',    left: '1%',   size: 32, dur: 9,  delay: 1, swim: true },
          { emoji: '🦎', top: '8%',    right: '2%',  size: 30, dur: 7,  delay: 0 },
          { emoji: '🐢', bottom: '6%', right: '1%',  size: 28, dur: 11, delay: 2 },
          { emoji: '🕷️', bottom: '8%', left: '2%',  size: 26, dur: 8,  delay: 3 },
        ]} />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4 section-reveal">Магазин</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary section-reveal" style={{animationDelay:'0.1s'}}>Каталог</h2>
            <p className="mt-4 text-muted-foreground section-reveal" style={{animationDelay:'0.2s'}}>Животные, корма и расходные материалы — фильтруйте по категориям.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {/* Кнопка «Всё» */}
            <button onClick={() => setCat('all')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors border ${
                cat === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40'
              }`}>
              <Icon name="LayoutGrid" size={16} />Всё
            </button>
            {/* Категории из каталога */}
            {allCatalogCategories.map((c) => (
              <button key={c.slug} onClick={() => setCat(c.slug)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors border ${
                  cat === c.slug ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                }`}>
                <Icon name={c.icon} size={16} />
                {c.title}
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-10">Товары загружаются…</p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <div key={p.id} className="glass-card rounded-2xl overflow-hidden hover-scale group cursor-pointer" onClick={() => setSelectedProduct(p)}>
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
              </div>
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
          <div className="text-center mt-10">
            <Button size="lg" variant="outline" onClick={() => navigate('/shop')}>
              Полный каталог <Icon name="ArrowRight" size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-24 px-4 md:px-6 relative bg-leaves overflow-hidden">
        <DecoIcons items={[
          { emoji: '🦎', top: '5%',    right: '4%',  size: 36, dur: 10, delay: 0 },
          { emoji: '🐠', bottom: '8%', left: '3%',   size: 32, dur: 8,  delay: 2, swim: true },
          { emoji: '🐍', top: '10%',   left: '2%',   size: 30, dur: 12, delay: 1 },
          { emoji: '🪸', bottom: '5%', right: '3%',  size: 28, dur: 9,  delay: 3 },
          { emoji: '🦋', top: '18%',   right: '2%',  size: 24, dur: 7,  delay: 4 },
        ]} />
        <div className="container relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4 section-reveal">Портфолио</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary section-reveal" style={{animationDelay:'0.1s'}}>Наши работы</h2>
            <p className="mt-4 text-muted-foreground section-reveal" style={{animationDelay:'0.2s'}}>Реализованные проекты разной сложности и стилистики.</p>
          </div>
          {portfolioItems.length === 0 && (
            <p className="text-center text-muted-foreground py-10">Работы скоро появятся.</p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {portfolioItems.map((p, idx) => (
              <div
                key={p.id}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden gradient-deep cursor-pointer"
                onClick={() => { setLightboxItem(p); setLightboxIdx(idx); }}
              >
                {p.photo_url
                  ? <img src={p.photo_url} alt={p.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="absolute inset-0 grid place-items-center opacity-30 group-hover:opacity-50 transition-opacity">
                      <Icon name={p.icon} size={64} className="text-white" />
                    </div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm grid place-items-center">
                    <Icon name="ZoomIn" size={22} className="text-white" />
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <Badge className="bg-sand text-primary hover:bg-sand mb-2">{p.tag}</Badge>
                  <h3 className="font-display text-xl font-semibold text-white">{p.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Lightbox */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <button className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center text-white transition-colors z-10" onClick={() => setLightboxItem(null)}>
            <Icon name="X" size={22} />
          </button>
          {/* Prev */}
          {portfolioItems.length > 1 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center text-white transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); const prev = (lightboxIdx - 1 + portfolioItems.length) % portfolioItems.length; setLightboxIdx(prev); setLightboxItem(portfolioItems[prev]); }}>
              <Icon name="ChevronLeft" size={24} />
            </button>
          )}
          {/* Next */}
          {portfolioItems.length > 1 && (
            <button className="absolute right-16 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center text-white transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); const next = (lightboxIdx + 1) % portfolioItems.length; setLightboxIdx(next); setLightboxItem(portfolioItems[next]); }}>
              <Icon name="ChevronRight" size={24} />
            </button>
          )}
          <div className="flex flex-col md:flex-row gap-0 max-w-5xl w-full max-h-[90vh] rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="md:w-2/3 bg-black flex-shrink-0">
              {lightboxItem.photo_url
                ? <img src={lightboxItem.photo_url} alt={lightboxItem.title} className="w-full h-full object-contain max-h-[70vh] md:max-h-[90vh]" />
                : <div className="w-full h-64 md:h-full gradient-deep grid place-items-center"><Icon name={lightboxItem.icon} size={80} className="text-white/50" /></div>
              }
            </div>
            <div className="md:w-1/3 bg-card p-6 md:p-8 flex flex-col">
              <Badge className="bg-sand text-primary hover:bg-sand self-start mb-4">{lightboxItem.tag}</Badge>
              <h2 className="font-display text-3xl font-bold text-primary mb-4">{lightboxItem.title}</h2>
              {lightboxItem.description && (
                <div className="text-muted-foreground text-sm leading-relaxed flex-1 overflow-y-auto prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: lightboxItem.description }} />
              )}
              <Button className="mt-6 w-full" onClick={() => { setLightboxItem(null); scrollTo('contacts'); }}>
                Заказать похожий проект
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3">{lightboxIdx + 1} / {portfolioItems.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Articles */}
      <section id="articles" className="py-24 px-4 md:px-6 relative bg-scales overflow-hidden">
        <DecoIcons items={[
          { emoji: '🦎', top: '6%',    right: '3%',  size: 30, dur: 10, delay: 0 },
          { emoji: '🐠', bottom: '8%', left: '2%',   size: 28, dur: 8,  delay: 1.5, swim: true },
          { emoji: '🐢', top: '15%',   left: '1%',   size: 26, dur: 12, delay: 2.5 },
          { emoji: '🪸', bottom: '5%', right: '4%',  size: 24, dur: 9,  delay: 3 },
        ]} />
        <div className="container relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4 section-reveal">Статьи</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary section-reveal" style={{animationDelay:'0.1s'}}>Полезные материалы</h2>
            <p className="mt-4 text-muted-foreground section-reveal" style={{animationDelay:'0.2s'}}>Советы по уходу, обустройству и содержанию живых систем.</p>
          </div>
          {articles.length === 0 ? (
            <p className="text-center text-muted-foreground">Статьи скоро появятся.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((a) => (
                <div key={a.id} className="glass-card rounded-2xl overflow-hidden hover-scale group cursor-pointer" onClick={() => openArticle(a.slug)}>
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
                </div>
              ))}
            </div>
          )}
        </div>
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

      <section id="faq" className="relative bg-muted/50">
        <WaveDivider fill="hsl(var(--muted) / 0.5)" flip />
        <div className="container px-4 md:px-6 max-w-3xl py-16">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary">Частые вопросы</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqData.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-card border border-border rounded-xl px-5">
                <AccordionTrigger className="text-left font-medium text-primary hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <WaveDivider fill="hsl(var(--background))" />
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
                <a href={`tel:${(siteSettings.contacts_phone || '+79055337226').replace(/\s/g,'')}`} className="hover:text-white transition-colors">{siteSettings.contacts_phone || '+7 905 533 7226'}</a>
              </li>
              {siteSettings.contacts_email && (
              <li className="flex items-center gap-3">
                <Icon name="Mail" size={20} />
                <a href={`mailto:${siteSettings.contacts_email}`} className="hover:text-white transition-colors">{siteSettings.contacts_email}</a>
              </li>
              )}
              {siteSettings.contacts_address && (
              <li className="flex items-start gap-3">
                <Icon name="MapPin" size={20} className="mt-0.5 shrink-0" />
                <span>{siteSettings.contacts_address}</span>
              </li>
              )}
            </ul>
            <div className="flex gap-3 mt-8">
              {siteSettings.contacts_telegram && (
              <a href={`https://t.me/${siteSettings.contacts_telegram}`} target="_blank" rel="noopener noreferrer" className="grid place-items-center w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Icon name="Send" size={20} />
              </a>
              )}
              {siteSettings.contacts_whatsapp && (
              <a href={`https://wa.me/${siteSettings.contacts_whatsapp}`} target="_blank" rel="noopener noreferrer" className="grid place-items-center w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Icon name="MessageCircle" size={20} />
              </a>
              )}
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
            <p className="mt-4 text-muted-foreground">3 вопроса — и ты узнаешь свой тип + получишь подарок</p>
          </div>

          <Card className="p-8 md:p-10">
            {quizResult ? (
              /* Result screen */
              <div className="text-center">
                <div className="flex justify-center mb-5">
                  {quizResult && RESULT_SVG[quizResult] && React.createElement(RESULT_SVG[quizResult])}
                </div>
                <h3 className="font-display text-3xl font-bold text-primary mb-3">{(resultsData[quizResult] || RESULTS_FALLBACK[quizResult])?.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">{(resultsData[quizResult] || RESULTS_FALLBACK[quizResult])?.desc}</p>

                <div className="bg-muted/60 rounded-2xl p-6 mb-8 text-left">
                  <p className="text-sm font-semibold text-primary mb-1">Специально для тебя:</p>
                  <p className="text-muted-foreground text-sm">{(resultsData[quizResult] || RESULTS_FALLBACK[quizResult])?.tip}</p>
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
                  <span className="text-sm text-muted-foreground">Вопрос {quizStep + 1} из {quizData.length}</span>
                  <div className="flex gap-1.5">
                    {quizData.map((_, i) => (
                      <span key={i} className={`h-2 rounded-full transition-all duration-300 ${i <= quizStep ? 'bg-primary w-8' : 'bg-muted w-4'}`} />
                    ))}
                  </div>
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-7 text-center">
                  {quizData[quizStep]?.question}
                </h3>
                <div className="space-y-3">
                  {quizData[quizStep]?.answers.map((a) => (
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

              {/* Promo code */}
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Промокод</p>
                <div className="flex gap-2">
                  <input
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                    onKeyDown={e => e.key === 'Enter' && applyPromo()}
                    className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
                    placeholder="Введите код"
                  />
                  <Button size="sm" variant="outline" onClick={applyPromo} disabled={promoLoading || promoDiscount > 0}>
                    {promoLoading ? <Icon name="Loader" size={14} className="animate-spin" /> : 'Применить'}
                  </Button>
                </div>
                {promoError && <p className="text-xs text-destructive mt-1">{promoError}</p>}
                {promoDiscount > 0 && (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-secondary font-semibold">✓ Скидка {promoDiscount}% применена</p>
                    <button className="text-xs text-muted-foreground hover:text-destructive transition-colors" onClick={() => { setPromoDiscount(0); setPromoCode(''); }}>
                      Сбросить
                    </button>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-border pt-4 mt-auto">
                {promoDiscount > 0 && (
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="text-muted-foreground line-through">{cart.total.toLocaleString('ru')} ₽</span>
                    <Badge variant="secondary" className="text-xs">−{promoDiscount}%</Badge>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-muted-foreground">Итого:</span>
                  <span className="font-display text-2xl font-bold text-primary">{discountedTotal.toLocaleString('ru')} ₽</span>
                </div>

                {/* Contact for order */}
                <CartOrderForm onSubmit={submitOrder} sending={orderSending} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Scroll progress bar */}
      <div className="fixed top-0 inset-x-0 z-[60] h-0.5 bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-primary via-secondary to-aqua transition-none"
          style={{ width: `${Math.min(100, (scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1)) * 100)}%` }}
        />
      </div>

      {/* Side dot navigation */}
      <nav className="hidden lg:flex fixed right-5 top-1/2 -translate-y-1/2 z-40 flex-col gap-3">
        {NAV.map((n) => {
          const el = document.getElementById(n.id);
          const rect = el?.getBoundingClientRect();
          const isActive = rect ? rect.top <= 120 && rect.bottom > 120 : false;
          return (
            <button
              key={n.id}
              onClick={() => scrollTo(n.id)}
              title={n.label}
              className="group relative flex items-center justify-end gap-2"
            >
              <span className="absolute right-full mr-2 px-2 py-1 rounded-md bg-card border border-border text-xs font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
                {n.label}
              </span>
              <span className={`block rounded-full border-2 transition-all duration-300 ${isActive ? 'w-3 h-3 border-primary bg-primary' : 'w-2 h-2 border-muted-foreground bg-transparent group-hover:border-primary'}`} />
            </button>
          );
        })}
      </nav>

      {/* Section navigator up/down */}
      {scrollY > 100 && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-1.5">
          <button
            onClick={() => goSection(-1)}
            className="w-10 h-10 rounded-full gradient-deep text-white shadow-lg hover:scale-110 transition-all grid place-items-center disabled:opacity-30 disabled:scale-100"
            title="Предыдущий раздел"
          >
            <Icon name="ChevronUp" size={18} />
          </button>
          <button
            onClick={() => goSection(1)}
            disabled={activeSection === SECTION_IDS.length - 1}
            className="w-10 h-10 rounded-full gradient-deep text-white shadow-lg hover:scale-110 transition-all grid place-items-center disabled:opacity-30 disabled:scale-100"
            title="Следующий раздел"
          >
            <Icon name="ChevronDown" size={18} />
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