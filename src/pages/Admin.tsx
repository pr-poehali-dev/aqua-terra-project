import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import Logo from '@/components/Logo';
import RichEditor from '@/components/RichEditor';
import { useToast } from '@/hooks/use-toast';

const CATALOG_URL = 'https://functions.poehali.dev/5792c301-10d8-4ade-8987-58fa81f89be1';
const ARTICLES_ADMIN = 'https://functions.poehali.dev/e8098f3c-29db-4ad6-a1d7-eeb57eb5dea7';
const PRODUCTS_ADMIN = 'https://functions.poehali.dev/56ecfcae-0ead-4151-b546-411ce113bde1';
const SERVICES_ADMIN = 'https://functions.poehali.dev/830e0abf-4c6e-434b-b914-bacffaa6c73f';
const PORTFOLIO_ADMIN = 'https://functions.poehali.dev/86ea5a33-361e-443c-8816-3050029776df';
const ANALYTICS_URL = 'https://functions.poehali.dev/30d12584-4095-41be-a486-9b95e926ce56';
const PROMO_URL = 'https://functions.poehali.dev/34b026bd-3d35-40ea-bc8d-90855ba968d3';

interface Article {
  id: number; title: string; slug: string; excerpt: string;
  content: string; category: string; cover_url: string | null;
  published: boolean; created_at: string;
}
interface Product {
  id: number; name: string; price: number; category: string;
  tag: string; icon: string; photo_url: string | null; in_stock: boolean; description: string;
}
interface Service {
  id: number; icon: string; title: string; description: string;
  price_from: number; price_unit: string; tags: string[]; sort_order: number; active: boolean;
}
interface PortfolioItem {
  id: number; title: string; tag: string; description: string;
  icon: string; photo_url: string | null; sort_order: number; active: boolean;
}

const ARTICLE_CATS = ['Аквариумы', 'Террариумы', 'Флорариумы', 'Экзотика', 'Корма', 'Общее'];
const PRODUCT_CATS = [{ id: 'animals', label: 'Животные' }, { id: 'food', label: 'Корма' }, { id: 'supplies', label: 'Материалы' }];
const ICONS = ['Fish', 'Turtle', 'Bug', 'Wheat', 'Package', 'Lightbulb', 'Settings', 'Sprout', 'Waves', 'Wrench', 'Truck', 'Star'];
const EMPTY_PRODUCT: Omit<Product, 'id'> = { name: '', price: 0, category: 'animals', tag: '', icon: 'Package', photo_url: null, in_stock: true, description: '' };
const EMPTY_ARTICLE: Omit<Article, 'id' | 'slug' | 'created_at'> = { title: '', excerpt: '', content: '', category: 'Аквариумы', cover_url: null, published: false };
const EMPTY_SERVICE: Omit<Service, 'id'> = { icon: 'Wrench', title: '', description: '', price_from: 0, price_unit: 'за работу', tags: [], sort_order: 99, active: true };
const EMPTY_PORTFOLIO: Omit<PortfolioItem, 'id'> = { title: '', tag: '', description: '', icon: 'Fish', photo_url: null, sort_order: 99, active: true };

interface PromoCode {
  id: number; code: string; discount: number; description: string;
  active: boolean; uses_count: number; max_uses: number | null;
}
const EMPTY_PROMO: Omit<PromoCode, 'id' | 'uses_count'> = { code: '', discount: 10, description: '', active: true, max_uses: null };

interface CatalogSection {
  id: number; slug: string; title: string; description: string;
  icon: string; sort_order: number; active: boolean; has_order_form: boolean;
  categories: { id: number; slug: string; title: string; icon: string; sort_order: number; active: boolean }[];
}
interface Lead {
  id: number; name: string; contact: string; message: string;
  source: string; read: boolean; created_at: string;
}
interface Stats {
  total_leads: number; unread: number; leads_30d: number; leads_7d: number;
  chart: { day: string; count: number }[];
  products_count: number; articles_count: number; portfolio_count: number;
}

export default function Admin() {
  const { toast } = useToast();
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'analytics' | 'products' | 'portfolio' | 'services' | 'articles' | 'promos' | 'catalog'>('analytics');
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [editingPromo, setEditingPromo] = useState<Partial<PromoCode> | null>(null);
  const [savingPromo, setSavingPromo] = useState(false);

  // Articles
  const [articles, setArticles] = useState<Article[]>([]);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [savingArticle, setSavingArticle] = useState(false);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Services
  const [svcList, setSvcList] = useState<Service[]>([]);
  const [editingSvc, setEditingSvc] = useState<Partial<Service> | null>(null);
  const [savingSvc, setSavingSvc] = useState(false);

  // Portfolio
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [editingPort, setEditingPort] = useState<Partial<PortfolioItem> | null>(null);
  const [savingPort, setSavingPort] = useState(false);
  const [uploadingPortPhoto, setUploadingPortPhoto] = useState(false);
  const portFileRef = useRef<HTMLInputElement>(null);

  // Catalog
  const [catalogSections, setCatalogSections] = useState<CatalogSection[]>([]);
  const [newSection, setNewSection] = useState({ slug: '', title: '', description: '', icon: 'Package', has_order_form: false });
  const [newCategory, setNewCategory] = useState({ section_id: 0, slug: '', title: '', icon: 'Tag' });
  const [savingCatalog, setSavingCatalog] = useState(false);

  const headers = { 'Content-Type': 'application/json', 'X-Admin-Token': token };

  const login = async () => {
    setLoading(true);
    const [ra, rp, rs, rport, rstat, rleads, rpromo, rcat] = await Promise.all([
      fetch(ARTICLES_ADMIN, { headers }),
      fetch(PRODUCTS_ADMIN, { headers }),
      fetch(`${SERVICES_ADMIN}?admin=1`, { headers }),
      fetch(`${PORTFOLIO_ADMIN}?admin=1`, { headers }),
      fetch(`${ANALYTICS_URL}?type=stats`, { headers }),
      fetch(`${ANALYTICS_URL}?type=leads`, { headers }),
      fetch(PROMO_URL, { headers }),
      fetch(CATALOG_URL),
    ]);
    if (ra.status === 401) { toast({ title: 'Неверный пароль', variant: 'destructive' }); setLoading(false); return; }
    setArticles(await ra.json());
    setProducts(await rp.json());
    setSvcList(await rs.json());
    setPortfolio(await rport.json());
    setStats(await rstat.json());
    setLeads(await rleads.json());
    setPromos(await rpromo.json());
    setCatalogSections(await rcat.json());
    setAuthed(true);
    setLoading(false);
  };

  const loadAnalytics = async () => {
    const [rs, rl] = await Promise.all([
      fetch(`${ANALYTICS_URL}?type=stats`, { headers }),
      fetch(`${ANALYTICS_URL}?type=leads`, { headers }),
    ]);
    setStats(await rs.json());
    setLeads(await rl.json());
  };

  const markRead = async (id: number) => {
    await fetch(`${ANALYTICS_URL}?id=${id}`, { method: 'PUT', headers });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, read: true } : l));
    setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : prev);
  };

  const loadArticles = () => fetch(ARTICLES_ADMIN, { headers }).then(r => r.json()).then(setArticles);
  const loadProducts = () => fetch(PRODUCTS_ADMIN, { headers }).then(r => r.json()).then(setProducts);
  const loadServices = () => fetch(`${SERVICES_ADMIN}?admin=1`, { headers }).then(r => r.json()).then(setSvcList);
  const loadPortfolio = () => fetch(`${PORTFOLIO_ADMIN}?admin=1`, { headers }).then(r => r.json()).then(setPortfolio);
  const loadPromos = () => fetch(PROMO_URL, { headers }).then(r => r.json()).then(setPromos);

  const savePromo = async () => {
    if (!editingPromo) return;
    setSavingPromo(true);
    const isNew = !editingPromo.id;
    const url = isNew ? PROMO_URL : `${PROMO_URL}?id=${editingPromo.id}`;
    const body = { ...editingPromo, code: (editingPromo.code || '').toUpperCase().trim() };
    const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers, body: JSON.stringify(body) });
    if (res.ok) { toast({ title: isNew ? 'Промокод создан!' : 'Сохранено!' }); setEditingPromo(null); loadPromos(); }
    else { const e = await res.json(); toast({ title: e.error || 'Ошибка', variant: 'destructive' }); }
    setSavingPromo(false);
  };

  const deletePromo = async (id: number) => {
    if (!confirm('Удалить промокод?')) return;
    await fetch(`${PROMO_URL}?id=${id}`, { method: 'DELETE', headers });
    loadPromos();
  };

  const togglePromo = async (p: PromoCode) => {
    await fetch(`${PROMO_URL}?id=${p.id}`, { method: 'PUT', headers, body: JSON.stringify({ ...p, active: !p.active }) });
    loadPromos();
  };

  // --- Portfolio ---
  const savePort = async () => {
    if (!editingPort) return;
    setSavingPort(true);
    const isNew = !editingPort.id;
    const url = isNew ? PORTFOLIO_ADMIN : `${PORTFOLIO_ADMIN}?id=${editingPort.id}`;
    const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers, body: JSON.stringify(editingPort) });
    if (res.ok) { toast({ title: isNew ? 'Работа добавлена!' : 'Сохранено!' }); setEditingPort(null); loadPortfolio(); }
    else toast({ title: 'Ошибка', variant: 'destructive' });
    setSavingPort(false);
  };
  const removePort = async (id: number) => {
    if (!confirm('Удалить работу из портфолио?')) return;
    await fetch(`${PORTFOLIO_ADMIN}?id=${id}`, { method: 'DELETE', headers });
    loadPortfolio();
  };
  const togglePortActive = async (p: PortfolioItem) => {
    await fetch(`${PORTFOLIO_ADMIN}?id=${p.id}`, { method: 'PUT', headers, body: JSON.stringify({ ...p, active: !p.active }) });
    loadPortfolio();
  };
  const uploadPortPhoto = async (file: File, id: number) => {
    setUploadingPortPhoto(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      const res = await fetch(`${PORTFOLIO_ADMIN}/upload?id=${id}`, {
        method: 'POST', headers, body: JSON.stringify({ photo_base64: base64, ext }),
      });
      if (res.ok) {
        const { photo_url } = await res.json();
        setEditingPort((prev) => prev ? { ...prev, photo_url } : prev);
        toast({ title: 'Фото загружено!' });
        loadPortfolio();
      } else toast({ title: 'Ошибка загрузки', variant: 'destructive' });
      setUploadingPortPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  // --- Services ---
  const saveSvc = async () => {
    if (!editingSvc) return;
    setSavingSvc(true);
    const isNew = !editingSvc.id;
    const url = isNew ? SERVICES_ADMIN : `${SERVICES_ADMIN}?id=${editingSvc.id}`;
    const payload = { ...editingSvc, tags: typeof editingSvc.tags === 'string' ? (editingSvc.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean) : editingSvc.tags };
    const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers, body: JSON.stringify(payload) });
    if (res.ok) { toast({ title: isNew ? 'Услуга добавлена!' : 'Сохранено!' }); setEditingSvc(null); loadServices(); }
    else toast({ title: 'Ошибка', variant: 'destructive' });
    setSavingSvc(false);
  };
  const removeSvc = async (id: number) => {
    if (!confirm('Удалить услугу?')) return;
    await fetch(`${SERVICES_ADMIN}?id=${id}`, { method: 'DELETE', headers });
    loadServices();
  };
  const toggleSvcActive = async (s: Service) => {
    await fetch(`${SERVICES_ADMIN}?id=${s.id}`, { method: 'PUT', headers, body: JSON.stringify({ ...s, active: !s.active }) });
    loadServices();
  };

  // --- Articles ---
  const saveArticle = async () => {
    if (!editingArticle) return;
    setSavingArticle(true);
    const isNew = !editingArticle.id;
    const url = isNew ? ARTICLES_ADMIN : `${ARTICLES_ADMIN}?id=${editingArticle.id}`;
    const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers, body: JSON.stringify(editingArticle) });
    if (res.ok) { toast({ title: isNew ? 'Статья создана!' : 'Сохранено!' }); setEditingArticle(null); loadArticles(); }
    else toast({ title: 'Ошибка', variant: 'destructive' });
    setSavingArticle(false);
  };
  const removeArticle = async (id: number) => {
    if (!confirm('Удалить статью?')) return;
    await fetch(`${ARTICLES_ADMIN}?id=${id}`, { method: 'DELETE', headers });
    loadArticles();
  };
  const togglePublish = async (a: Article) => {
    await fetch(`${ARTICLES_ADMIN}?id=${a.id}`, { method: 'PUT', headers, body: JSON.stringify({ ...a, published: !a.published }) });
    loadArticles();
  };

  // --- Products ---
  const saveProduct = async () => {
    if (!editingProduct) return;
    setSavingProduct(true);
    const isNew = !editingProduct.id;
    const url = isNew ? PRODUCTS_ADMIN : `${PRODUCTS_ADMIN}?id=${editingProduct.id}`;
    const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers, body: JSON.stringify(editingProduct) });
    if (res.ok) { toast({ title: isNew ? 'Товар добавлен!' : 'Сохранено!' }); setEditingProduct(null); loadProducts(); }
    else toast({ title: 'Ошибка', variant: 'destructive' });
    setSavingProduct(false);
  };
  const removeProduct = async (id: number) => {
    if (!confirm('Удалить товар?')) return;
    await fetch(`${PRODUCTS_ADMIN}?id=${id}`, { method: 'DELETE', headers });
    loadProducts();
  };
  const toggleStock = async (p: Product) => {
    await fetch(`${PRODUCTS_ADMIN}?id=${p.id}`, { method: 'PUT', headers, body: JSON.stringify({ ...p, in_stock: !p.in_stock }) });
    loadProducts();
  };
  const uploadPhoto = async (file: File, productId: number) => {
    setUploadingPhoto(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      const res = await fetch(`${PRODUCTS_ADMIN}/upload?id=${productId}`, {
        method: 'POST', headers, body: JSON.stringify({ photo_base64: base64, ext }),
      });
      if (res.ok) {
        const { photo_url } = await res.json();
        setEditingProduct((prev) => prev ? { ...prev, photo_url } : prev);
        toast({ title: 'Фото загружено!' });
        loadProducts();
      } else {
        toast({ title: 'Ошибка загрузки фото', variant: 'destructive' });
      }
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  if (!authed) {
    return (
      <div className="min-h-screen gradient-deep flex items-center justify-center p-4">
        <Card className="p-8 w-full max-w-sm">
          <div className="mb-6"><Logo size="md" /></div>
          <p className="text-muted-foreground text-sm mb-4">Введите пароль для входа</p>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="Пароль" className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring mb-4" />
          <Button className="w-full" onClick={login} disabled={loading}>{loading ? 'Входим…' : 'Войти'}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex gap-2">
          <Button onClick={() => {
            if (tab === 'products') setEditingProduct({ ...EMPTY_PRODUCT });
            else if (tab === 'portfolio') setEditingPort({ ...EMPTY_PORTFOLIO });
            else if (tab === 'services') setEditingSvc({ ...EMPTY_SERVICE });
            else if (tab === 'promos') setEditingPromo({ ...EMPTY_PROMO });
            else setEditingArticle({ ...EMPTY_ARTICLE });
          }} size="sm" className={tab === 'analytics' ? 'invisible' : ''}>
            <Icon name="Plus" size={16} className="mr-1" />
            {tab === 'products' ? 'Новый товар' : tab === 'portfolio' ? 'Новая работа' : tab === 'services' ? 'Новая услуга' : tab === 'promos' ? 'Новый промокод' : 'Новая статья'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
            <Icon name="ArrowLeft" size={16} className="mr-1" /> На сайт
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-background">
        <div className="container px-4 md:px-6 flex gap-0">
          {([['analytics','📊 Аналитика'], ['products','🛍 Товары'], ['portfolio','🖼 Портфолио'], ['services','💰 Услуги'], ['articles','📝 Статьи'], ['promos','🏷 Промокоды'], ['catalog','🗂 Каталог']] as const).map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); setEditingProduct(null); setEditingPort(null); setEditingSvc(null); setEditingArticle(null); setEditingPromo(null); }}
              className={`relative px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary'}`}>
              {label}
              {t === 'analytics' && stats && stats.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full grid place-items-center">{stats.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="container py-8 px-4 md:px-6">

        {/* ===== ANALYTICS ===== */}
        {tab === 'analytics' && (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Stats grid */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Всего заявок', value: stats.total_leads, icon: 'Mail', color: 'text-primary' },
                  { label: 'Непрочитанных', value: stats.unread, icon: 'BellRing', color: stats.unread > 0 ? 'text-red-500' : 'text-primary' },
                  { label: 'За 7 дней', value: stats.leads_7d, icon: 'TrendingUp', color: 'text-secondary' },
                  { label: 'За 30 дней', value: stats.leads_30d, icon: 'Calendar', color: 'text-secondary' },
                ].map((s) => (
                  <Card key={s.label} className="p-5 text-center">
                    <Icon name={s.icon} size={22} className={`mx-auto mb-2 ${s.color}`} />
                    <p className={`font-display text-4xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </Card>
                ))}
              </div>
            )}

            {/* Site stats */}
            {stats && (
              <Card className="p-5">
                <h3 className="font-semibold text-primary mb-4">Контент сайта</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="font-display text-3xl font-bold text-primary">{stats.products_count}</p><p className="text-xs text-muted-foreground mt-1">Товаров в наличии</p></div>
                  <div><p className="font-display text-3xl font-bold text-primary">{stats.articles_count}</p><p className="text-xs text-muted-foreground mt-1">Статей опубликовано</p></div>
                  <div><p className="font-display text-3xl font-bold text-primary">{stats.portfolio_count}</p><p className="text-xs text-muted-foreground mt-1">Работ в портфолио</p></div>
                </div>
              </Card>
            )}

            {/* Chart */}
            {stats && stats.chart.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold text-primary mb-4">Заявки за 30 дней</h3>
                <div className="flex items-end gap-1 h-24">
                  {(() => {
                    const max = Math.max(...stats.chart.map(d => d.count), 1);
                    return stats.chart.map((d) => (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.day}: ${d.count}`}>
                        <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100">{d.count}</span>
                        <div className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors" style={{ height: `${(d.count / max) * 80}px`, minHeight: 2 }} />
                      </div>
                    ));
                  })()}
                </div>
              </Card>
            )}

            {/* Leads list */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary">Заявки</h3>
                <Button variant="outline" size="sm" onClick={loadAnalytics}><Icon name="RefreshCw" size={14} className="mr-1" />Обновить</Button>
              </div>
              <div className="space-y-3">
                {leads.length === 0 && <p className="text-center text-muted-foreground py-10">Заявок пока нет</p>}
                {leads.map((l) => (
                  <Card key={l.id} className={`p-4 flex items-start gap-4 transition-colors ${!l.read ? 'border-primary/40 bg-primary/5' : ''}`}>
                    <div className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: l.source === 'cart' ? 'hsl(152 38% 38% / 0.15)' : 'hsl(200 70% 24% / 0.1)' }}>
                      <Icon name={l.source === 'cart' ? 'ShoppingCart' : 'Mail'} size={18} className={l.source === 'cart' ? 'text-secondary' : 'text-primary'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-primary text-sm">{l.name}</p>
                        {!l.read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                        <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-secondary font-medium">{l.contact}</p>
                      {l.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{l.message}</p>}
                    </div>
                    {!l.read && (
                      <Button size="sm" variant="outline" className="shrink-0" onClick={() => markRead(l.id)}>
                        <Icon name="Check" size={14} className="mr-1" /> Прочитано
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== PRODUCTS ===== */}
        {tab === 'products' && (
          editingProduct ? (
            <Card className="p-6 max-w-2xl mx-auto space-y-4">
              <h2 className="font-display text-2xl font-bold text-primary">{editingProduct.id ? 'Редактировать товар' : 'Новый товар'}</h2>

              {/* Photo upload — only for existing products */}
              {editingProduct.id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Фото товара</label>
                  <div className="flex items-center gap-4">
                    {editingProduct.photo_url
                      ? <img src={editingProduct.photo_url} alt="фото" className="w-24 h-24 object-cover rounded-xl border border-border" />
                      : <div className="w-24 h-24 rounded-xl gradient-deep grid place-items-center text-white/60"><Icon name={editingProduct.icon || 'Package'} size={32} /></div>
                    }
                    <div>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f && editingProduct.id) uploadPhoto(f, editingProduct.id); }} />
                      <Button variant="outline" size="sm" disabled={uploadingPhoto} onClick={() => fileRef.current?.click()}>
                        <Icon name="Upload" size={16} className="mr-1" /> {uploadingPhoto ? 'Загружаем…' : 'Загрузить фото'}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP до 5 МБ</p>
                    </div>
                  </div>
                </div>
              )}
              {!editingProduct.id && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">💡 После сохранения товара вы сможете загрузить фото</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Название *</label>
                  <input value={editingProduct.name || ''} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Название товара" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Цена (₽)</label>
                  <input type="number" value={editingProduct.price || 0} onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) || 0 })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Метка</label>
                  <input value={editingProduct.tag || ''} onChange={(e) => setEditingProduct({ ...editingProduct, tag: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Рептилия, Аквариум…" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Категория</label>
                  <select value={editingProduct.category || 'animals'} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    {PRODUCT_CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Иконка</label>
                  <select value={editingProduct.icon || 'Package'} onChange={(e) => setEditingProduct({ ...editingProduct, icon: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    {ICONS.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Описание товара</label>
                <textarea rows={4} value={editingProduct.description || ''} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
                  placeholder="Подробное описание: возраст, размер, особенности ухода…" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="stock" checked={!!editingProduct.in_stock} onChange={(e) => setEditingProduct({ ...editingProduct, in_stock: e.target.checked })} className="w-4 h-4 accent-primary" />
                <label htmlFor="stock" className="text-sm font-medium">В наличии</label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={saveProduct} disabled={savingProduct}>{savingProduct ? 'Сохраняем…' : 'Сохранить'}</Button>
                <Button variant="outline" onClick={() => setEditingProduct(null)}>Отмена</Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {products.length === 0 && <p className="text-center text-muted-foreground py-16">Товаров пока нет.</p>}
              {products.map((p) => (
                <Card key={p.id} className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                    {p.photo_url
                      ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full gradient-deep grid place-items-center text-white/80"><Icon name={p.icon} size={22} /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-primary truncate">{p.name}</h3>
                      <Badge variant={p.in_stock ? 'default' : 'secondary'} className="text-xs shrink-0">{p.in_stock ? 'В наличии' : 'Нет'}</Badge>
                      <Badge variant="outline" className="text-xs shrink-0">{PRODUCT_CATS.find(c => c.id === p.category)?.label}</Badge>
                    </div>
                    <p className="text-secondary font-bold text-sm">{p.price.toLocaleString('ru')} ₽</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="icon" variant="ghost" title={p.in_stock ? 'Снять с продажи' : 'Вернуть в продажу'} onClick={() => toggleStock(p)}>
                      <Icon name={p.in_stock ? 'EyeOff' : 'Eye'} size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingProduct(p)}>
                      <Icon name="Pencil" size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeProduct(p.id)}>
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {/* ===== PORTFOLIO ===== */}
        {tab === 'portfolio' && (
          editingPort ? (
            <Card className="p-6 max-w-2xl mx-auto space-y-4">
              <h2 className="font-display text-2xl font-bold text-primary">{editingPort.id ? 'Редактировать работу' : 'Новая работа'}</h2>

              {/* Photo upload */}
              {editingPort.id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Фото работы</label>
                  <div className="flex items-center gap-4">
                    {editingPort.photo_url
                      ? <img src={editingPort.photo_url} alt="фото" className="w-28 h-20 object-cover rounded-xl border border-border" />
                      : <div className="w-28 h-20 rounded-xl gradient-deep grid place-items-center text-white/60"><Icon name={editingPort.icon || 'Fish'} size={32} /></div>
                    }
                    <div>
                      <input ref={portFileRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f && editingPort.id) uploadPortPhoto(f, editingPort.id); }} />
                      <Button variant="outline" size="sm" disabled={uploadingPortPhoto} onClick={() => portFileRef.current?.click()}>
                        <Icon name="Upload" size={16} className="mr-1" /> {uploadingPortPhoto ? 'Загружаем…' : 'Загрузить фото'}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — рекомендуем 3:4</p>
                    </div>
                  </div>
                </div>
              )}
              {!editingPort.id && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">💡 После сохранения можно загрузить фото</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Название *</label>
                  <input value={editingPort.title || ''} onChange={(e) => setEditingPort({ ...editingPort, title: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Морской риф 300л" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Тег</label>
                  <input value={editingPort.tag || ''} onChange={(e) => setEditingPort({ ...editingPort, tag: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Аквариум, Террариум…" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Иконка (если нет фото)</label>
                  <select value={editingPort.icon || 'Fish'} onChange={(e) => setEditingPort({ ...editingPort, icon: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    {ICONS.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Порядок</label>
                  <input type="number" value={editingPort.sort_order ?? 99} onChange={(e) => setEditingPort({ ...editingPort, sort_order: parseInt(e.target.value) || 99 })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Описание работы</label>
                  <RichEditor value={editingPort.description || ''} onChange={(html) => setEditingPort({ ...editingPort, description: html })} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="portActive" checked={!!editingPort.active} onChange={(e) => setEditingPort({ ...editingPort, active: e.target.checked })} className="w-4 h-4 accent-primary" />
                <label htmlFor="portActive" className="text-sm font-medium">Показывать на сайте</label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={savePort} disabled={savingPort}>{savingPort ? 'Сохраняем…' : 'Сохранить'}</Button>
                <Button variant="outline" onClick={() => setEditingPort(null)}>Отмена</Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {portfolio.length === 0 && <p className="text-center text-muted-foreground py-16">Работ пока нет. Нажмите «Новая работа».</p>}
              {portfolio.map((p) => (
                <Card key={p.id} className="p-4 flex items-center gap-4">
                  <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0">
                    {p.photo_url
                      ? <img src={p.photo_url} alt={p.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full gradient-deep grid place-items-center text-white/80"><Icon name={p.icon} size={22} /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-primary truncate">{p.title}</h3>
                      <Badge variant={p.active ? 'default' : 'secondary'} className="text-xs shrink-0">{p.active ? 'Показывается' : 'Скрыта'}</Badge>
                      {p.tag && <Badge variant="outline" className="text-xs shrink-0">{p.tag}</Badge>}
                    </div>
                    {p.description && <p className="text-muted-foreground text-xs line-clamp-1" dangerouslySetInnerHTML={{ __html: p.description }} />}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => togglePortActive(p)}>
                      <Icon name={p.active ? 'EyeOff' : 'Eye'} size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingPort(p)}>
                      <Icon name="Pencil" size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removePort(p.id)}>
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {/* ===== SERVICES ===== */}
        {tab === 'services' && (
          editingSvc ? (
            <Card className="p-6 max-w-2xl mx-auto space-y-4">
              <h2 className="font-display text-2xl font-bold text-primary">{editingSvc.id ? 'Редактировать услугу' : 'Новая услуга'}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Название *</label>
                  <input value={editingSvc.title || ''} onChange={(e) => setEditingSvc({ ...editingSvc, title: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Например: Оформление аквариума" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Описание</label>
                  <textarea rows={3} value={editingSvc.description || ''} onChange={(e) => setEditingSvc({ ...editingSvc, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm" placeholder="Краткое описание услуги" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Цена от (₽)</label>
                  <input type="number" value={editingSvc.price_from || 0} onChange={(e) => setEditingSvc({ ...editingSvc, price_from: parseInt(e.target.value) || 0 })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Единица</label>
                  <input value={editingSvc.price_unit || ''} onChange={(e) => setEditingSvc({ ...editingSvc, price_unit: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="за работу, за визит…" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Иконка</label>
                  <select value={editingSvc.icon || 'Wrench'} onChange={(e) => setEditingSvc({ ...editingSvc, icon: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                    {ICONS.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Порядок (число)</label>
                  <input type="number" value={editingSvc.sort_order ?? 99} onChange={(e) => setEditingSvc({ ...editingSvc, sort_order: parseInt(e.target.value) || 99 })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Метки (через запятую)</label>
                  <input value={Array.isArray(editingSvc.tags) ? editingSvc.tags.join(', ') : editingSvc.tags || ''} onChange={(e) => setEditingSvc({ ...editingSvc, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Пресный, Морской" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="svcActive" checked={!!editingSvc.active} onChange={(e) => setEditingSvc({ ...editingSvc, active: e.target.checked })} className="w-4 h-4 accent-primary" />
                <label htmlFor="svcActive" className="text-sm font-medium">Показывать на сайте</label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={saveSvc} disabled={savingSvc}>{savingSvc ? 'Сохраняем…' : 'Сохранить'}</Button>
                <Button variant="outline" onClick={() => setEditingSvc(null)}>Отмена</Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {svcList.length === 0 && <p className="text-center text-muted-foreground py-16">Услуг пока нет.</p>}
              {svcList.map((s) => (
                <Card key={s.id} className="p-5 flex items-center gap-4">
                  <span className="grid place-items-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Icon name={s.icon} size={22} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-primary truncate">{s.title}</h3>
                      <Badge variant={s.active ? 'default' : 'secondary'} className="text-xs shrink-0">{s.active ? 'Активна' : 'Скрыта'}</Badge>
                    </div>
                    <p className="text-secondary font-bold text-sm">от {s.price_from.toLocaleString('ru')} ₽ <span className="text-muted-foreground font-normal">{s.price_unit}</span></p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="icon" variant="ghost" title={s.active ? 'Скрыть' : 'Показать'} onClick={() => toggleSvcActive(s)}>
                      <Icon name={s.active ? 'EyeOff' : 'Eye'} size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingSvc(s)}>
                      <Icon name="Pencil" size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeSvc(s.id)}>
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {/* ===== ARTICLES ===== */}
        {tab === 'articles' && (
          editingArticle ? (
            <Card className="p-6 max-w-3xl mx-auto space-y-4">
              <h2 className="font-display text-2xl font-bold text-primary">{editingArticle.id ? 'Редактировать статью' : 'Новая статья'}</h2>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Заголовок *</label>
                <input value={editingArticle.title || ''} onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Заголовок статьи" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Категория</label>
                <select value={editingArticle.category || 'Общее'} onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  {ARTICLE_CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Краткое описание</label>
                <textarea rows={2} value={editingArticle.excerpt || ''} onChange={(e) => setEditingArticle({ ...editingArticle, excerpt: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Пара предложений для превью" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Текст статьи</label>
                <RichEditor
                  value={editingArticle.content || ''}
                  onChange={(html) => setEditingArticle({ ...editingArticle, content: html })}
                />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="pub" checked={!!editingArticle.published} onChange={(e) => setEditingArticle({ ...editingArticle, published: e.target.checked })} className="w-4 h-4 accent-primary" />
                <label htmlFor="pub" className="text-sm font-medium">Опубликовать сразу</label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={saveArticle} disabled={savingArticle}>{savingArticle ? 'Сохраняем…' : 'Сохранить'}</Button>
                <Button variant="outline" onClick={() => setEditingArticle(null)}>Отмена</Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {articles.length === 0 && <p className="text-center text-muted-foreground py-16">Статей пока нет.</p>}
              {articles.map((a) => (
                <Card key={a.id} className="p-5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-primary truncate">{a.title}</h3>
                      <Badge variant={a.published ? 'default' : 'secondary'} className="shrink-0 text-xs">{a.published ? 'Опубликовано' : 'Черновик'}</Badge>
                      <Badge variant="outline" className="shrink-0 text-xs">{a.category}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm truncate">{a.excerpt}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => togglePublish(a)}><Icon name={a.published ? 'EyeOff' : 'Eye'} size={16} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingArticle(a)}><Icon name="Pencil" size={16} /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeArticle(a.id)}><Icon name="Trash2" size={16} /></Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {/* ===== PROMOS ===== */}
        {tab === 'promos' && (
          editingPromo ? (
            <Card className="p-6 max-w-xl mx-auto space-y-4">
              <h2 className="font-display text-2xl font-bold text-primary">
                {editingPromo.id ? 'Редактировать промокод' : 'Новый промокод'}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Код *</label>
                  <input
                    value={editingPromo.code || ''}
                    onChange={e => setEditingPromo({ ...editingPromo, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono tracking-widest uppercase"
                    placeholder="SUMMER20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Скидка, % *</label>
                  <input
                    type="number" min={1} max={100}
                    value={editingPromo.discount ?? 10}
                    onChange={e => setEditingPromo({ ...editingPromo, discount: parseInt(e.target.value) || 0 })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Макс. использований</label>
                  <input
                    type="number" min={1}
                    value={editingPromo.max_uses ?? ''}
                    onChange={e => setEditingPromo({ ...editingPromo, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="∞ без ограничений"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Описание (для себя)</label>
                  <input
                    value={editingPromo.description || ''}
                    onChange={e => setEditingPromo({ ...editingPromo, description: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Новогодняя акция"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="promoActive" checked={!!editingPromo.active}
                  onChange={e => setEditingPromo({ ...editingPromo, active: e.target.checked })}
                  className="w-4 h-4 accent-primary" />
                <label htmlFor="promoActive" className="text-sm font-medium">Активен</label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={savePromo} disabled={savingPromo}>{savingPromo ? 'Сохраняем…' : 'Сохранить'}</Button>
                <Button variant="outline" onClick={() => setEditingPromo(null)}>Отмена</Button>
              </div>
            </Card>
          ) : (
            <div className="max-w-3xl mx-auto space-y-3">
              {promos.length === 0 && (
                <p className="text-center text-muted-foreground py-16">Промокодов пока нет. Нажмите «Новый промокод».</p>
              )}
              {promos.map(p => (
                <Card key={p.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-mono font-bold text-lg text-primary tracking-widest">{p.code}</span>
                      <Badge className="bg-secondary/15 text-secondary border-0 text-sm font-bold">−{p.discount}%</Badge>
                      <Badge variant={p.active ? 'default' : 'secondary'} className="text-xs">
                        {p.active ? 'Активен' : 'Отключён'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {p.description && <span>{p.description}</span>}
                      <span className="flex items-center gap-1">
                        <Icon name="MousePointerClick" size={12} />
                        Использований: <strong className="text-foreground">{p.uses_count}</strong>
                        {p.max_uses ? <> / {p.max_uses}</> : null}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="icon" variant="ghost" title={p.active ? 'Отключить' : 'Включить'} onClick={() => togglePromo(p)}>
                      <Icon name={p.active ? 'EyeOff' : 'Eye'} size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingPromo(p)}>
                      <Icon name="Pencil" size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deletePromo(p.id)}>
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Quick-copy hint */}
              {promos.length > 0 && (
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Активные промокоды покупатели вводят в корзине сайта
                </p>
              )}
            </div>
          )
        )}
        {/* === CATALOG TAB === */}
        {tab === 'catalog' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-primary">Разделы каталога</h2>
                <p className="text-muted-foreground text-sm mt-1">Управляйте разделами и категориями магазина</p>
              </div>
              <a href="/shop" target="_blank"><Button variant="outline" size="sm"><Icon name="ExternalLink" size={14} className="mr-1" />Открыть магазин</Button></a>
            </div>

            {/* Список разделов */}
            <div className="space-y-4">
              {catalogSections.map(section => (
                <Card key={section.id} className={`p-5 ${!section.active ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center">
                      <Icon name={section.icon} size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{section.title}</h3>
                      <p className="text-xs text-muted-foreground">/{section.slug}{section.has_order_form && ' · форма заказа'}</p>
                    </div>
                    <Button size="sm" variant={section.active ? 'outline' : 'secondary'}
                      onClick={async () => {
                        const r = await fetch(`${CATALOG_URL}?action=toggle_section`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: section.id }) });
                        const d = await r.json();
                        setCatalogSections(prev => prev.map(s => s.id === section.id ? { ...s, active: d.active } : s));
                      }}>
                      {section.active ? 'Скрыть' : 'Показать'}
                    </Button>
                  </div>
                  {/* Категории */}
                  <div className="flex flex-wrap gap-2">
                    {section.categories.map(cat => (
                      <div key={cat.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm ${cat.active ? 'border-border bg-muted/50' : 'border-dashed opacity-40'}`}>
                        <Icon name={cat.icon} size={13} className="text-muted-foreground" />
                        <span>{cat.title}</span>
                        <button className="ml-1 text-muted-foreground hover:text-primary"
                          onClick={async () => {
                            const r = await fetch(`${CATALOG_URL}?action=toggle_category`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cat.id }) });
                            const d = await r.json();
                            setCatalogSections(prev => prev.map(s => s.id === section.id ? {
                              ...s, categories: s.categories.map(c => c.id === cat.id ? { ...c, active: d.active } : c)
                            } : s));
                          }}>
                          <Icon name={cat.active ? 'EyeOff' : 'Eye'} size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Добавить категорию */}
                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <input placeholder="slug" className="h-8 px-2 rounded border border-input bg-background text-sm w-24"
                      value={newCategory.section_id === section.id ? newCategory.slug : ''}
                      onChange={e => setNewCategory({ section_id: section.id, slug: e.target.value, title: newCategory.section_id === section.id ? newCategory.title : '', icon: 'Tag' })} />
                    <input placeholder="Название" className="h-8 px-2 rounded border border-input bg-background text-sm flex-1"
                      value={newCategory.section_id === section.id ? newCategory.title : ''}
                      onChange={e => setNewCategory(p => ({ ...p, section_id: section.id, title: e.target.value }))} />
                    <Button size="sm" disabled={savingCatalog}
                      onClick={async () => {
                        if (!newCategory.slug || !newCategory.title || newCategory.section_id !== section.id) return;
                        setSavingCatalog(true);
                        await fetch(`${CATALOG_URL}?action=add_category`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCategory) });
                        const r = await fetch(CATALOG_URL);
                        setCatalogSections(await r.json());
                        setNewCategory({ section_id: 0, slug: '', title: '', icon: 'Tag' });
                        setSavingCatalog(false);
                        toast({ title: 'Категория добавлена' });
                      }}>
                      + Категория
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Добавить раздел */}
            <Card className="p-5 border-dashed border-2 border-primary/20">
              <h3 className="font-semibold text-foreground mb-4">Добавить новый раздел</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input placeholder="slug (напр: pond)" className="h-9 px-3 rounded-lg border border-input bg-background text-sm"
                  value={newSection.slug} onChange={e => setNewSection(p => ({ ...p, slug: e.target.value }))} />
                <input placeholder="Название раздела" className="h-9 px-3 rounded-lg border border-input bg-background text-sm"
                  value={newSection.title} onChange={e => setNewSection(p => ({ ...p, title: e.target.value }))} />
                <input placeholder="Описание" className="h-9 px-3 rounded-lg border border-input bg-background text-sm sm:col-span-2"
                  value={newSection.description} onChange={e => setNewSection(p => ({ ...p, description: e.target.value }))} />
                <div className="flex items-center gap-3">
                  <input placeholder="Иконка (Package)" className="h-9 px-3 rounded-lg border border-input bg-background text-sm flex-1"
                    value={newSection.icon} onChange={e => setNewSection(p => ({ ...p, icon: e.target.value }))} />
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={newSection.has_order_form}
                      onChange={e => setNewSection(p => ({ ...p, has_order_form: e.target.checked }))} />
                    Форма заказа
                  </label>
                </div>
                <Button disabled={savingCatalog || !newSection.slug || !newSection.title}
                  onClick={async () => {
                    setSavingCatalog(true);
                    await fetch(`${CATALOG_URL}?action=add_section`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSection) });
                    const r = await fetch(CATALOG_URL);
                    setCatalogSections(await r.json());
                    setNewSection({ slug: '', title: '', description: '', icon: 'Package', has_order_form: false });
                    setSavingCatalog(false);
                    toast({ title: 'Раздел добавлен' });
                  }}>
                  {savingCatalog ? 'Сохраняем...' : 'Добавить раздел'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}