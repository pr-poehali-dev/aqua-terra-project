import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import Logo from '@/components/Logo';
import RichEditor from '@/components/RichEditor';
import ZoneEditor from '@/components/ZoneEditor';
import { useToast } from '@/hooks/use-toast';

const CATALOG_URL = 'https://functions.poehali.dev/5792c301-10d8-4ade-8987-58fa81f89be1';
const SETTINGS_URL = 'https://functions.poehali.dev/9257c1cb-d389-4e76-a3a9-69b452c12431';
const LEAD_URL = 'https://functions.poehali.dev/65042d39-89d6-40d3-9d30-42b0ccb9d003';
const ZONES_URL = 'https://functions.poehali.dev/0092227c-949a-4bfa-afca-6c591a34e572';
const PRICE_ZONES_URL = 'https://functions.poehali.dev/03fb0c39-d302-40a1-82c6-b87dcc1b4071';
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
  section_id?: number | null; category_id?: number | null;
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
const EMPTY_PRODUCT: Omit<Product, 'id'> = { name: '', price: 0, category: '', tag: '', icon: 'Package', photo_url: null, in_stock: true, description: '', section_id: null, category_id: null };
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
  source: string; read: boolean; created_at: string; archived: boolean;
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
  const [tab, setTab] = useState<'analytics' | 'products' | 'portfolio' | 'services' | 'articles' | 'promos' | 'catalog' | 'settings'>('analytics');
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [archivedLeads, setArchivedLeads] = useState<Lead[]>([]);
  const [leadsView, setLeadsView] = useState<'active' | 'archived'>('active');
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
  const [editingCategory, setEditingCategory] = useState<{ id: number; slug: string; title: string; icon: string; sort_order: number } | null>(null);
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [editingCatProduct, setEditingCatProduct] = useState<Partial<Product> | null>(null);
  const [savingCatProduct, setSavingCatProduct] = useState(false);
  const [uploadingCatPhoto, setUploadingCatPhoto] = useState(false);
  const [activeCatalogSection, setActiveCatalogSection] = useState('');
  const catProductFileRef = useRef<HTMLInputElement>(null);

  const loadCatalogProducts = (sectionSlug: string) =>
    fetch(`${CATALOG_URL}?section=${sectionSlug}`)
      .then(r => r.json())
      .then(setCatalogProducts);

  const uploadCatalogPhoto = async (file: File, productId: number) => {
    setUploadingCatPhoto(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      const res = await fetch(`${PRODUCTS_ADMIN}/upload?id=${productId}`, {
        method: 'POST', headers, body: JSON.stringify({ photo_base64: base64, ext }),
      });
      if (res.ok) {
        const { photo_url } = await res.json();
        setEditingCatProduct(prev => prev ? { ...prev, photo_url } : prev);
        setCatalogProducts(prev => prev.map(p => p.id === productId ? { ...p, photo_url } : p));
        toast({ title: 'Фото загружено!' });
      } else {
        toast({ title: 'Ошибка загрузки', variant: 'destructive' });
      }
      setUploadingCatPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  // Settings state
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [faqItems, setFaqItems] = useState<{id: number; q: string; a: string; sort_order: number}[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<{id: number; question: string; sort_order: number; answers: {id: number; text: string; type: string}[]}[]>([]);
  const [quizResults, setQuizResults] = useState<Record<string, {title: string; desc: string; tip: string}>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [tgStatus, setTgStatus] = useState<{connected: boolean; bot_name: string | null; has_token: boolean; has_chat_id: boolean} | null>(null);
  const [tgTesting, setTgTesting] = useState(false);
  const [editingFaq, setEditingFaq] = useState<{id?: number; q: string; a: string; sort_order: number} | null>(null);
  // Зоны обслуживания
  interface ServiceZone { id: number; name: string; color: string; opacity: number; zone_type: 'circle' | 'polygon'; coordinates: [number,number][]; center_lat: number|null; center_lon: number|null; radius_km: number|null; sort_order: number; active: boolean; }
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [editingZone, setEditingZone] = useState<Partial<ServiceZone> | null>(null);
  const [savingZone, setSavingZone] = useState(false);
  const loadZones = () => fetch(`${ZONES_URL}?admin=1`, { headers }).then(r => r.json()).then(setZones).catch(() => {});
  // Ценовые зоны
  interface PriceZoneItem { radius: number; factor: number; label: string; }
  interface PriceZoneConfig { center_lat: number; center_lon: number; zones: PriceZoneItem[]; active: boolean; }
  const DEFAULT_PRICE_ZONES: PriceZoneConfig = {
    center_lat: 55.7328, center_lon: 36.8517, active: true,
    zones: [
      { radius: 20, factor: 1.0, label: 'Основная зона' },
      { radius: 35, factor: 1.3, label: 'Ближняя зона' },
      { radius: 55, factor: 1.6, label: 'Средняя зона' },
      { radius: 80, factor: 2.0, label: 'Дальняя зона' },
    ],
  };
  const [priceZones, setPriceZones] = useState<PriceZoneConfig>(DEFAULT_PRICE_ZONES);
  const [savingPriceZones, setSavingPriceZones] = useState(false);
  const loadPriceZones = () => fetch(PRICE_ZONES_URL).then(r => r.json()).then(d => { if (d) setPriceZones(d); }).catch(() => {});

  const headers = { 'Content-Type': 'application/json', 'X-Admin-Token': token };

  const loadSettings = () => fetch(SETTINGS_URL).then(r => r.json()).then(d => {
    setSiteSettings(d.settings || {});
    setFaqItems(d.faq || []);
    setQuizQuestions(d.quiz || []);
    setQuizResults(d.quiz_results || {});
  });

  const login = async () => {
    setLoading(true);
    const [ra, rp, rs, rport, rstat, rleads, rpromo, rcat, rset] = await Promise.all([
      fetch(ARTICLES_ADMIN, { headers }),
      fetch(PRODUCTS_ADMIN, { headers }),
      fetch(`${SERVICES_ADMIN}?admin=1`, { headers }),
      fetch(`${PORTFOLIO_ADMIN}?admin=1`, { headers }),
      fetch(`${ANALYTICS_URL}?type=stats`, { headers }),
      fetch(`${ANALYTICS_URL}?type=leads`, { headers }),
      fetch(PROMO_URL, { headers }),
      fetch(CATALOG_URL),
      fetch(SETTINGS_URL),
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
    const sd = await rset.json();
    setSiteSettings(sd.settings || {});
    setFaqItems(sd.faq || []);
    setQuizQuestions(sd.quiz || []);
    setQuizResults(sd.quiz_results || {});
    fetch(`${LEAD_URL}?action=status`, { headers }).then(r => r.json()).then(setTgStatus).catch(() => {});
    fetch(`${ZONES_URL}?admin=1`, { headers }).then(r => r.json()).then(setZones).catch(() => {});
    fetch(PRICE_ZONES_URL).then(r => r.json()).then(d => { if (d) setPriceZones(d); }).catch(() => {});
    setAuthed(true);
    setLoading(false);
  };

  const loadAnalytics = async () => {
    const [rs, rl, ra] = await Promise.all([
      fetch(`${ANALYTICS_URL}?type=stats`, { headers }),
      fetch(`${ANALYTICS_URL}?type=leads`, { headers }),
      fetch(`${ANALYTICS_URL}?type=archived`, { headers }),
    ]);
    setStats(await rs.json());
    setLeads(await rl.json());
    setArchivedLeads(await ra.json());
  };

  const markRead = async (id: number) => {
    await fetch(`${ANALYTICS_URL}?id=${id}`, { method: 'PUT', headers });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, read: true } : l));
    setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : prev);
  };

  const archiveLead = async (id: number) => {
    await fetch(`${ANALYTICS_URL}?id=${id}&action=archive`, { method: 'PUT', headers });
    const lead = leads.find(l => l.id === id);
    setLeads(prev => prev.filter(l => l.id !== id));
    if (lead) setArchivedLeads(prev => [{ ...lead, archived: true, read: true }, ...prev]);
    setStats(prev => prev ? { ...prev, total_leads: Math.max(0, prev.total_leads - 1), unread: lead?.read ? prev.unread : Math.max(0, prev.unread - 1) } : prev);
    toast({ title: 'Заявка перенесена в архив' });
  };

  const unarchiveLead = async (id: number) => {
    await fetch(`${ANALYTICS_URL}?id=${id}&action=unarchive`, { method: 'PUT', headers });
    const lead = archivedLeads.find(l => l.id === id);
    setArchivedLeads(prev => prev.filter(l => l.id !== id));
    if (lead) setLeads(prev => [{ ...lead, archived: false }, ...prev]);
    toast({ title: 'Заявка восстановлена' });
  };

  const deleteLead = async (id: number, fromArchive = false) => {
    if (!confirm('Удалить заявку? Это действие нельзя отменить.')) return;
    await fetch(`${ANALYTICS_URL}?id=${id}`, { method: 'DELETE', headers });
    if (fromArchive) setArchivedLeads(prev => prev.filter(l => l.id !== id));
    else setLeads(prev => prev.filter(l => l.id !== id));
    toast({ title: 'Заявка удалена' });
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
          {([['analytics','📊 Аналитика'], ['products','🛍 Товары'], ['portfolio','🖼 Портфолио'], ['services','💰 Услуги'], ['articles','📝 Статьи'], ['promos','🏷 Промокоды'], ['catalog','🗂 Каталог'], ['settings','⚙️ Настройки']] as const).map(([t, label]) => (
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
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                {/* Переключатель Активные / Архив */}
                <div className="flex items-center rounded-xl border border-border overflow-hidden">
                  <button onClick={() => setLeadsView('active')}
                    className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${leadsView === 'active' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                    <Icon name="Mail" size={14} />Активные
                    {(leads.filter(l => !l.read).length > 0) && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                        {leads.filter(l => !l.read).length}
                      </span>
                    )}
                  </button>
                  <button onClick={() => setLeadsView('archived')}
                    className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${leadsView === 'archived' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                    <Icon name="Archive" size={14} />Архив
                    {archivedLeads.length > 0 && <span className="text-xs opacity-60">({archivedLeads.length})</span>}
                  </button>
                </div>
                <Button variant="outline" size="sm" onClick={loadAnalytics}>
                  <Icon name="RefreshCw" size={14} className="mr-1" />Обновить
                </Button>
              </div>

              {/* Список заявок */}
              {(() => {
                const list = leadsView === 'archived' ? archivedLeads : leads;
                if (list.length === 0) return (
                  <p className="text-center text-muted-foreground py-10">
                    {leadsView === 'archived' ? 'Архив пуст' : 'Заявок пока нет'}
                  </p>
                );
                return (
                  <div className="space-y-3">
                    {list.map((l) => (
                      <Card key={l.id} className={`p-4 flex items-start gap-4 transition-colors ${!l.read && leadsView === 'active' ? 'border-primary/40 bg-primary/5' : ''}`}>
                        <div className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: l.source === 'cart' ? 'hsl(152 38% 38% / 0.15)' : 'hsl(200 70% 24% / 0.1)' }}>
                          <Icon name={l.source === 'cart' ? 'ShoppingCart' : l.source === 'shop_order' ? 'Store' : 'Mail'} size={18} className={l.source === 'cart' ? 'text-secondary' : 'text-primary'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-primary text-sm">{l.name}</p>
                            {!l.read && leadsView === 'active' && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                            <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {l.source === 'cart' ? '🛒 Корзина' : l.source === 'shop_order' ? '🛍 Магазин' : '🐠 Форма'}
                            </span>
                          </div>
                          <p className="text-sm text-secondary font-medium">{l.contact}</p>
                          {l.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{l.message}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {!l.read && leadsView === 'active' && (
                            <Button size="sm" variant="outline" onClick={() => markRead(l.id)}>
                              <Icon name="Check" size={13} className="mr-1" />Прочитано
                            </Button>
                          )}
                          {leadsView === 'active' ? (
                            <Button size="sm" variant="outline" className="text-muted-foreground" onClick={() => archiveLead(l.id)}>
                              <Icon name="Archive" size={13} className="mr-1" />В архив
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => unarchiveLead(l.id)}>
                              <Icon name="ArchiveRestore" size={13} className="mr-1" />Восстановить
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteLead(l.id, leadsView === 'archived')}>
                            <Icon name="Trash2" size={13} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })()}
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
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Раздел каталога</label>
                    <select
                      value={editingProduct.section_id ?? ''}
                      onChange={(e) => {
                        const sid = e.target.value ? Number(e.target.value) : null;
                        setEditingProduct({ ...editingProduct, section_id: sid, category_id: null, category: '' });
                      }}
                      className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">— выберите раздел —</option>
                      {catalogSections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Категория</label>
                    <select
                      value={editingProduct.category_id ?? ''}
                      onChange={(e) => {
                        const cid = e.target.value ? Number(e.target.value) : null;
                        const section = catalogSections.find(s => s.id === editingProduct.section_id);
                        const cat = section?.categories.find(c => c.id === cid);
                        setEditingProduct({ ...editingProduct, category_id: cid, category: cat?.slug || '' });
                      }}
                      disabled={!editingProduct.section_id}
                      className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                      <option value="">— выберите категорию —</option>
                      {(catalogSections.find(s => s.id === editingProduct.section_id)?.categories || []).map(c =>
                        <option key={c.id} value={c.id}>{c.title}</option>
                      )}
                    </select>
                  </div>
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
                      <Badge variant="outline" className="text-xs shrink-0">
                        {catalogSections.flatMap(s => s.categories).find(c => c.id === p.category_id)?.title || p.category || '—'}
                      </Badge>
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
                <h2 className="font-display text-2xl font-bold text-primary">Каталог</h2>
                <p className="text-muted-foreground text-sm mt-1">Разделы, категории и товары магазина</p>
              </div>
              <a href="/shop" target="_blank"><Button variant="outline" size="sm"><Icon name="ExternalLink" size={14} className="mr-1" />Открыть магазин</Button></a>
            </div>

            {/* Товары раздела */}
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-semibold text-foreground flex-1">Товары</h3>
                <select className="h-8 px-2 rounded border border-input bg-background text-sm"
                  value={activeCatalogSection}
                  onChange={e => { setActiveCatalogSection(e.target.value); if (e.target.value) loadCatalogProducts(e.target.value); }}>
                  <option value="">— выберите раздел —</option>
                  {catalogSections.map(s => <option key={s.slug} value={s.slug}>{s.title}</option>)}
                </select>
                {activeCatalogSection && (
                  <Button size="sm" onClick={() => setEditingCatProduct({ section_id: catalogSections.find(s => s.slug === activeCatalogSection)?.id, in_stock: true, icon: 'Package', photo_url: null })}>
                    + Товар
                  </Button>
                )}
              </div>

              {/* Список товаров */}
              {activeCatalogSection && (
                <div className="space-y-2">
                  {catalogProducts.length === 0
                    ? <p className="text-sm text-muted-foreground text-center py-6">Товаров в этом разделе нет</p>
                    : catalogProducts.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                          {p.photo_url
                            ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full grid place-items-center"><Icon name={p.icon} size={20} className="text-muted-foreground" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.price.toLocaleString('ru')} ₽ · {p.tag}</p>
                        </div>
                        <Badge variant={p.in_stock ? 'secondary' : 'outline'} className="text-xs shrink-0">
                          {p.in_stock ? 'В наличии' : 'Нет'}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => setEditingCatProduct(p)}>
                          <Icon name="Pencil" size={14} />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            {/* Редактирование/создание товара */}
            {editingCatProduct && (
              <Card className="p-5 border-primary/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{editingCatProduct.id ? 'Редактировать товар' : 'Новый товар'}</h3>
                  <button onClick={() => setEditingCatProduct(null)}><Icon name="X" size={18} className="text-muted-foreground" /></button>
                </div>

                {/* Фото */}
                <div className="flex gap-4 mb-4">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                    {editingCatProduct.photo_url
                      ? <img src={editingCatProduct.photo_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full grid place-items-center text-muted-foreground"><Icon name="ImagePlus" size={28} /></div>}
                  </div>
                  <div className="flex flex-col gap-2 justify-center">
                    <input ref={catProductFileRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f && editingCatProduct.id) uploadCatalogPhoto(f, editingCatProduct.id); }} />
                    <Button variant="outline" size="sm" disabled={uploadingCatPhoto || !editingCatProduct.id}
                      onClick={() => catProductFileRef.current?.click()}>
                      <Icon name="Upload" size={14} className="mr-1" />
                      {uploadingCatPhoto ? 'Загружаем...' : 'Загрузить фото'}
                    </Button>
                    {!editingCatProduct.id && <p className="text-xs text-muted-foreground">Сохраните товар, затем загрузите фото</p>}
                    {editingCatProduct.photo_url && (
                      <Button variant="ghost" size="sm" className="text-destructive text-xs"
                        onClick={() => setEditingCatProduct(p => p ? { ...p, photo_url: null } : p)}>
                        Удалить фото
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <input placeholder="Название товара" className="h-9 px-3 rounded-lg border border-input bg-background text-sm sm:col-span-2"
                    value={editingCatProduct.name || ''} onChange={e => setEditingCatProduct(p => p ? { ...p, name: e.target.value } : p)} />
                  <input placeholder="Цена, ₽" type="number" className="h-9 px-3 rounded-lg border border-input bg-background text-sm"
                    value={editingCatProduct.price || ''} onChange={e => setEditingCatProduct(p => p ? { ...p, price: Number(e.target.value) } : p)} />
                  <input placeholder="Тег (напр: Аквариум)" className="h-9 px-3 rounded-lg border border-input bg-background text-sm"
                    value={editingCatProduct.tag || ''} onChange={e => setEditingCatProduct(p => p ? { ...p, tag: e.target.value } : p)} />
                  <select className="h-9 px-3 rounded-lg border border-input bg-background text-sm"
                    value={editingCatProduct.category_id || ''}
                    onChange={e => setEditingCatProduct(p => p ? { ...p, category_id: Number(e.target.value) } : p)}>
                    <option value="">— категория —</option>
                    {catalogSections.find(s => s.slug === activeCatalogSection)?.categories.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm h-9 px-3">
                    <input type="checkbox" checked={!!editingCatProduct.in_stock}
                      onChange={e => setEditingCatProduct(p => p ? { ...p, in_stock: e.target.checked } : p)} />
                    В наличии
                  </label>
                  <textarea placeholder="Описание товара" rows={2}
                    className="sm:col-span-2 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={editingCatProduct.description || ''} onChange={e => setEditingCatProduct(p => p ? { ...p, description: e.target.value } : p)} />
                  <Button disabled={savingCatProduct} className="sm:col-span-2"
                    onClick={async () => {
                      if (!editingCatProduct.name || !editingCatProduct.price) { toast({ title: 'Заполните название и цену', variant: 'destructive' }); return; }
                      setSavingCatProduct(true);
                      const isNew = !editingCatProduct.id;
                      const action = isNew ? 'add_product' : 'update_product';
                      const body = { ...editingCatProduct, section_id: catalogSections.find(s => s.slug === activeCatalogSection)?.id };
                      await fetch(`${CATALOG_URL}?action=${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                      await loadCatalogProducts(activeCatalogSection);
                      toast({ title: isNew ? 'Товар добавлен!' : 'Сохранено!' });
                      if (isNew) setEditingCatProduct(null);
                      setSavingCatProduct(false);
                    }}>
                    {savingCatProduct ? 'Сохраняем...' : editingCatProduct.id ? 'Сохранить' : 'Создать товар'}
                  </Button>
                </div>
              </Card>
            )}

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
                      <div key={cat.id} className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm ${cat.active ? 'border-border bg-muted/50' : 'border-dashed opacity-40'}`}>
                        <Icon name={cat.icon} size={13} className="text-muted-foreground" />
                        <span>{cat.title}</span>
                        <span className="text-muted-foreground/50 text-xs">/{cat.slug}</span>
                        {/* Показать/скрыть */}
                        <button className="ml-0.5 text-muted-foreground hover:text-primary transition-colors" title="Показать/скрыть"
                          onClick={async () => {
                            const r = await fetch(`${CATALOG_URL}?action=toggle_category`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cat.id }) });
                            const d = await r.json();
                            setCatalogSections(prev => prev.map(s => s.id === section.id ? {
                              ...s, categories: s.categories.map(c => c.id === cat.id ? { ...c, active: d.active } : c)
                            } : s));
                          }}>
                          <Icon name={cat.active ? 'EyeOff' : 'Eye'} size={12} />
                        </button>
                        {/* Редактировать */}
                        <button className="text-muted-foreground hover:text-primary transition-colors" title="Редактировать"
                          onClick={() => setEditingCategory({ id: cat.id, slug: cat.slug, title: cat.title, icon: cat.icon, sort_order: cat.sort_order })}>
                          <Icon name="Pencil" size={12} />
                        </button>
                        {/* Удалить */}
                        <button className="text-muted-foreground hover:text-destructive transition-colors" title="Удалить"
                          onClick={async () => {
                            if (!confirm(`Удалить категорию «${cat.title}»?`)) return;
                            await fetch(`${CATALOG_URL}?action=delete_category`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cat.id }) });
                            setCatalogSections(prev => prev.map(s => s.id === section.id ? {
                              ...s, categories: s.categories.filter(c => c.id !== cat.id)
                            } : s));
                            toast({ title: 'Категория удалена' });
                          }}>
                          <Icon name="Trash2" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Форма редактирования категории */}
                  {editingCategory && section.categories.some(c => c.id === editingCategory.id) && (
                    <div className="mt-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
                      <p className="text-xs font-semibold text-primary mb-2">Редактировать категорию</p>
                      <div className="flex gap-2 flex-wrap">
                        <input placeholder="slug" className="h-8 px-2 rounded border border-input bg-background text-sm w-28"
                          value={editingCategory.slug}
                          onChange={e => setEditingCategory(p => p ? { ...p, slug: e.target.value } : p)} />
                        <input placeholder="Название" className="h-8 px-2 rounded border border-input bg-background text-sm flex-1 min-w-[120px]"
                          value={editingCategory.title}
                          onChange={e => setEditingCategory(p => p ? { ...p, title: e.target.value } : p)} />
                        <input placeholder="Иконка (напр. Fish)" className="h-8 px-2 rounded border border-input bg-background text-sm w-32"
                          value={editingCategory.icon}
                          onChange={e => setEditingCategory(p => p ? { ...p, icon: e.target.value } : p)} />
                        <Button size="sm" disabled={savingCatalog} onClick={async () => {
                          if (!editingCategory.slug || !editingCategory.title) return;
                          setSavingCatalog(true);
                          await fetch(`${CATALOG_URL}?action=update_category`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingCategory) });
                          setCatalogSections(prev => prev.map(s => s.id === section.id ? {
                            ...s, categories: s.categories.map(c => c.id === editingCategory.id ? { ...c, ...editingCategory } : c)
                          } : s));
                          setEditingCategory(null);
                          setSavingCatalog(false);
                          toast({ title: 'Категория обновлена' });
                        }}>{savingCatalog ? '...' : 'Сохранить'}</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>Отмена</Button>
                      </div>
                    </div>
                  )}

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

        {/* === SETTINGS TAB === */}
        {tab === 'settings' && (
          <div className="space-y-8">

            {/* Hero */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-primary mb-4 flex items-center gap-2"><Icon name="Sparkles" size={18} />Главный экран (Hero)</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Бейдж под логотипом</label>
                  <input className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                    value={siteSettings.hero_badge || ''} onChange={e => setSiteSettings(p => ({...p, hero_badge: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Заголовок</label>
                  <input className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                    value={siteSettings.hero_title || ''} onChange={e => setSiteSettings(p => ({...p, hero_title: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Подзаголовок</label>
                  <textarea rows={3} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={siteSettings.hero_subtitle || ''} onChange={e => setSiteSettings(p => ({...p, hero_subtitle: e.target.value}))} />
                </div>
                <Button disabled={savingSettings} onClick={async () => {
                  setSavingSettings(true);
                  await fetch(`${SETTINGS_URL}?section=settings`, { method: 'POST', headers, body: JSON.stringify({ hero_badge: siteSettings.hero_badge, hero_title: siteSettings.hero_title, hero_subtitle: siteSettings.hero_subtitle }) });
                  setSavingSettings(false); toast({ title: 'Сохранено!' });
                }}>{savingSettings ? 'Сохраняем...' : 'Сохранить'}</Button>
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-primary mb-4 flex items-center gap-2"><Icon name="BarChart2" size={18} />Статистика</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'stat_years', label: 'Лет опыта' },
                  { key: 'stat_projects', label: 'Проектов' },
                  { key: 'stat_clients', label: 'Клиентов' },
                  { key: 'stat_rating', label: 'Рейтинг' },
                ].map(({key, label}) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                    <input className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                      value={siteSettings[key] || ''} onChange={e => setSiteSettings(p => ({...p, [key]: e.target.value}))} />
                  </div>
                ))}
              </div>
              <Button className="mt-3" disabled={savingSettings} onClick={async () => {
                setSavingSettings(true);
                await fetch(`${SETTINGS_URL}?section=settings`, { method: 'POST', headers, body: JSON.stringify({ stat_years: siteSettings.stat_years, stat_projects: siteSettings.stat_projects, stat_clients: siteSettings.stat_clients, stat_rating: siteSettings.stat_rating }) });
                setSavingSettings(false); toast({ title: 'Сохранено!' });
              }}>{savingSettings ? 'Сохраняем...' : 'Сохранить'}</Button>
            </Card>

            {/* Contacts */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-primary mb-4 flex items-center gap-2"><Icon name="Phone" size={18} />Контакты</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'contacts_phone', label: 'Телефон', placeholder: '+7 900 000 0000' },
                  { key: 'contacts_telegram', label: 'Telegram (без @)', placeholder: 'username' },
                  { key: 'contacts_max', label: 'MAX (username без @)', placeholder: 'username' },
                  { key: 'contacts_email', label: 'Email', placeholder: 'info@example.com' },
                  { key: 'contacts_address', label: 'Адрес', placeholder: 'Город, улица' },
                ].map(({key, label, placeholder}) => (
                  <div key={key} className={key === 'contacts_address' ? 'sm:col-span-2' : ''}>
                    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                    <input className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                      placeholder={placeholder} value={siteSettings[key] || ''}
                      onChange={e => setSiteSettings(p => ({...p, [key]: e.target.value}))} />
                  </div>
                ))}
              </div>
              <Button className="mt-3" disabled={savingSettings} onClick={async () => {
                setSavingSettings(true);
                const contactKeys = { contacts_phone: siteSettings.contacts_phone, contacts_telegram: siteSettings.contacts_telegram, contacts_max: siteSettings.contacts_max, contacts_email: siteSettings.contacts_email, contacts_address: siteSettings.contacts_address };
                await fetch(`${SETTINGS_URL}?section=settings`, { method: 'POST', headers, body: JSON.stringify(contactKeys) });
                setSavingSettings(false); toast({ title: 'Сохранено!' });
              }}>{savingSettings ? 'Сохраняем...' : 'Сохранить'}</Button>
            </Card>

            {/* FAQ */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-primary flex items-center gap-2"><Icon name="HelpCircle" size={18} />FAQ</h3>
                <Button size="sm" onClick={() => setEditingFaq({ q: '', a: '', sort_order: faqItems.length + 1 })}>+ Вопрос</Button>
              </div>
              <div className="space-y-2">
                {faqItems.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.q}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.a}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setEditingFaq({ id: item.id, q: item.q, a: item.a, sort_order: item.sort_order })}><Icon name="Pencil" size={14} /></Button>
                    <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={async () => {
                      await fetch(`${SETTINGS_URL}?section=faq`, { method: 'POST', headers, body: JSON.stringify({ action: 'toggle', id: item.id }) });
                      await loadSettings();
                    }}><Icon name="EyeOff" size={14} /></Button>
                  </div>
                ))}
              </div>
              {editingFaq && (
                <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Вопрос</label>
                    <input className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                      value={editingFaq.q} onChange={e => setEditingFaq(p => p ? {...p, q: e.target.value} : p)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Ответ</label>
                    <textarea rows={3} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={editingFaq.a} onChange={e => setEditingFaq(p => p ? {...p, a: e.target.value} : p)} />
                  </div>
                  <div className="flex gap-2">
                    <Button disabled={savingSettings} onClick={async () => {
                      if (!editingFaq.q || !editingFaq.a) return;
                      setSavingSettings(true);
                      const action = editingFaq.id ? 'update' : 'create';
                      await fetch(`${SETTINGS_URL}?section=faq`, { method: 'POST', headers, body: JSON.stringify({ action, ...editingFaq, question: editingFaq.q, answer: editingFaq.a }) });
                      await loadSettings();
                      setEditingFaq(null);
                      setSavingSettings(false);
                      toast({ title: 'Сохранено!' });
                    }}>{savingSettings ? 'Сохраняем...' : editingFaq.id ? 'Сохранить' : 'Добавить'}</Button>
                    <Button variant="outline" onClick={() => setEditingFaq(null)}>Отмена</Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Quiz */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-primary mb-4 flex items-center gap-2"><Icon name="ListChecks" size={18} />Квиз — вопросы и ответы</h3>
              <div className="space-y-4">
                {quizQuestions.map((q, qi) => (
                  <div key={q.id} className="p-4 rounded-xl border border-border space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">{qi + 1}.</span>
                      <input className="flex-1 h-8 px-2 rounded-lg border border-input bg-background text-sm"
                        value={q.question}
                        onChange={e => setQuizQuestions(prev => prev.map(item => item.id === q.id ? {...item, question: e.target.value} : item))} />
                      <Button size="sm" variant="ghost" disabled={savingSettings} onClick={async () => {
                        setSavingSettings(true);
                        await fetch(`${SETTINGS_URL}?section=quiz`, { method: 'POST', headers, body: JSON.stringify({ action: 'update_question', id: q.id, question: q.question }) });
                        setSavingSettings(false); toast({ title: 'Вопрос сохранён' });
                      }}><Icon name="Check" size={14} /></Button>
                    </div>
                    {q.answers.map(ans => (
                      <div key={ans.id} className="flex items-center gap-2 ml-7">
                        <input className="flex-1 h-7 px-2 rounded border border-input bg-background text-xs"
                          value={ans.text}
                          onChange={e => setQuizQuestions(prev => prev.map(item => item.id === q.id ? {...item, answers: item.answers.map(a => a.id === ans.id ? {...a, text: e.target.value} : a)} : item))} />
                        <select className="h-7 px-1 rounded border border-input bg-background text-xs w-20"
                          value={ans.type}
                          onChange={e => setQuizQuestions(prev => prev.map(item => item.id === q.id ? {...item, answers: item.answers.map(a => a.id === ans.id ? {...a, type: e.target.value} : a)} : item))}>
                          <option value="aqua">aqua</option>
                          <option value="terra">terra</option>
                          <option value="flora">flora</option>
                        </select>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={savingSettings} onClick={async () => {
                          setSavingSettings(true);
                          await fetch(`${SETTINGS_URL}?section=quiz`, { method: 'POST', headers, body: JSON.stringify({ action: 'update_answer', id: ans.id, text: ans.text, type: ans.type }) });
                          setSavingSettings(false); toast({ title: 'Ответ сохранён' });
                        }}><Icon name="Check" size={12} /></Button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Card>

            {/* Quiz Results */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-primary mb-4 flex items-center gap-2"><Icon name="Trophy" size={18} />Квиз — результаты</h3>
              <div className="space-y-4">
                {(['aqua', 'terra', 'flora'] as const).map(type => {
                  const r = quizResults[type] || { title: '', desc: '', tip: '' };
                  const labels: Record<string, string> = { aqua: '🌊 Аквариум', terra: '🦎 Террариум', flora: '🌿 Флорариум' };
                  return (
                    <div key={type} className="p-4 rounded-xl border border-border space-y-2">
                      <p className="font-semibold text-sm mb-2">{labels[type]}</p>
                      <input placeholder="Заголовок результата" className="w-full h-8 px-2 rounded-lg border border-input bg-background text-sm"
                        value={r.title} onChange={e => setQuizResults(p => ({...p, [type]: {...r, title: e.target.value}}))} />
                      <textarea placeholder="Описание" rows={2} className="w-full resize-none rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={r.desc} onChange={e => setQuizResults(p => ({...p, [type]: {...r, desc: e.target.value}}))} />
                      <input placeholder="Совет / призыв к действию" className="w-full h-8 px-2 rounded-lg border border-input bg-background text-sm"
                        value={r.tip} onChange={e => setQuizResults(p => ({...p, [type]: {...r, tip: e.target.value}}))} />
                      <Button size="sm" disabled={savingSettings} onClick={async () => {
                        setSavingSettings(true);
                        await fetch(`${SETTINGS_URL}?section=results`, { method: 'POST', headers, body: JSON.stringify({ type, title: r.title, description: r.desc, tip: r.tip }) });
                        setSavingSettings(false); toast({ title: 'Результат сохранён!' });
                      }}>{savingSettings ? '...' : 'Сохранить'}</Button>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Telegram */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-primary mb-1 flex items-center gap-2">
                <Icon name="Send" size={18} />Уведомления в Telegram
              </h3>
              <p className="text-sm text-muted-foreground mb-5">Заявки с сайта, корзины и магазина будут приходить в ваш Telegram-бот.</p>

              {/* Статус */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-5 text-sm font-medium ${
                tgStatus?.connected ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${tgStatus?.connected ? 'bg-green-500' : 'bg-orange-400'}`} />
                {tgStatus === null && 'Проверяем статус…'}
                {tgStatus?.connected && `✓ Подключён${tgStatus.bot_name ? ` — @${tgStatus.bot_name}` : ''}`}
                {tgStatus && !tgStatus.connected && (
                  !tgStatus.has_token ? 'Не задан TELEGRAM_BOT_TOKEN' :
                  !tgStatus.has_chat_id ? 'Не задан TELEGRAM_CHAT_ID' :
                  'Бот не подключён'
                )}
              </div>

              {/* Инструкция */}
              <div className="space-y-3 mb-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Как подключить бота</p>
                <div className="space-y-2.5">
                  {[
                    { n: 1, title: 'Создайте бота', desc: 'Напишите @BotFather в Telegram → /newbot → придумайте имя. Скопируйте токен вида 123456789:AAF...' },
                    { n: 2, title: 'Узнайте свой Chat ID', desc: 'Напишите @userinfobot — он ответит числом, например 337216695. Это ваш Chat ID.' },
                    { n: 3, title: 'Добавьте секреты', desc: 'В панели платформы (раздел Ядро → Секреты) добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.' },
                    { n: 4, title: 'Напишите боту /start', desc: 'Откройте своего нового бота в Telegram и нажмите Start — иначе бот не сможет писать вам первым.' },
                  ].map(s => (
                    <div key={s.n} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold grid place-items-center shrink-0 mt-0.5">{s.n}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={tgTesting} onClick={async () => {
                  setTgTesting(true);
                  const res = await fetch(`${LEAD_URL}?action=test`, { method: 'POST', headers });
                  const d = await res.json();
                  if (d.success) {
                    toast({ title: '✓ Тест отправлен!', description: 'Проверьте Telegram — должно прийти сообщение.' });
                  } else {
                    toast({ title: 'Ошибка', description: d.error || 'Что-то пошло не так', variant: 'destructive' });
                  }
                  fetch(`${LEAD_URL}?action=status`, { headers }).then(r => r.json()).then(setTgStatus).catch(() => {});
                  setTgTesting(false);
                }}>
                  <Icon name="Send" size={14} className="mr-1.5" />
                  {tgTesting ? 'Отправляем…' : 'Отправить тест'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  fetch(`${LEAD_URL}?action=status`, { headers }).then(r => r.json()).then(setTgStatus).catch(() => {});
                  toast({ title: 'Статус обновлён' });
                }}>
                  <Icon name="RefreshCw" size={14} className="mr-1.5" />Обновить статус
                </Button>
              </div>

              {/* Что приходит */}
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Что приходит в Telegram</p>
                <div className="grid sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { emoji: '🐠', label: 'Форма контактов', desc: 'Имя, контакт, сообщение' },
                    { emoji: '🛒', label: 'Заказ из корзины', desc: 'Список товаров и сумма' },
                    { emoji: '🛍', label: 'Заявка из магазина', desc: 'Раздел, имя, контакт' },
                  ].map(s => (
                    <div key={s.label} className="flex items-start gap-2 p-3 rounded-xl bg-muted/50">
                      <span className="text-lg">{s.emoji}</span>
                      <div>
                        <p className="font-medium text-foreground">{s.label}</p>
                        <p className="text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Зоны обслуживания */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-primary flex items-center gap-2 mb-1">
                <Icon name="MapPin" size={18} />Зона выезда на карте
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Нарисуйте одну зону — она отобразится зелёным на сайте в разделе «Контакты».</p>

              {/* Ключ Яндекс Карт */}
              <div className="mb-5">
                <label className="text-xs text-muted-foreground mb-1 block">Ключ Яндекс Карт (JavaScript API)</label>
                <div className="flex gap-2">
                  <input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    value={siteSettings.yandex_maps_key || ''}
                    onChange={e => setSiteSettings(p => ({...p, yandex_maps_key: e.target.value}))} />
                  <Button size="sm" disabled={savingSettings} onClick={async () => {
                    setSavingSettings(true);
                    await fetch(`${SETTINGS_URL}?section=settings`, { method: 'POST', headers, body: JSON.stringify({ yandex_maps_key: siteSettings.yandex_maps_key || '' }) });
                    setSavingSettings(false); toast({ title: 'Ключ сохранён!' });
                  }}>{savingSettings ? '...' : 'Сохранить'}</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Получить бесплатно на <span className="text-primary">developer.tech.yandex.ru</span> → JavaScript API и HTTP Геокодер</p>
              </div>

              {/* Одна активная зона */}
              {(() => {
                const activeZone = zones.find(z => z.active);
                if (!editingZone) {
                  return (
                    <div className="space-y-3">
                      {activeZone ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                          <span className="w-4 h-4 rounded shrink-0 bg-green-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activeZone.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {activeZone.zone_type === 'circle'
                                ? `Круг · ${activeZone.radius_km} км`
                                : `Полигон · ${activeZone.coordinates?.length || 0} точек`}
                            </p>
                          </div>
                          <Button size="sm" onClick={() => setEditingZone({...activeZone})}>
                            <Icon name="Pencil" size={13} className="mr-1.5" />Редактировать
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-3">Зона ещё не нарисована</p>
                      )}
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setEditingZone({
                        id: activeZone?.id,
                        name: 'Зона выезда',
                        color: '#22c55e', opacity: 0.22,
                        zone_type: 'polygon', coordinates: [],
                        center_lat: null, center_lon: null, radius_km: null,
                        sort_order: 1, active: true,
                      })}>
                        <Icon name="Pencil" size={14} className="mr-1.5" />
                        {activeZone ? 'Нарисовать заново' : 'Нарисовать зону'}
                      </Button>
                    </div>
                  );
                }
                return (
                  <ZoneEditor
                    zone={editingZone}
                    apiKey={siteSettings.yandex_maps_key || ''}
                    saving={savingZone}
                    onChange={setEditingZone}
                    onSave={async () => {
                      setSavingZone(true);
                      // Скрываем все остальные зоны, сохраняем текущую
                      for (const z of zones.filter(z => z.active && z.id !== editingZone.id)) {
                        await fetch(`${ZONES_URL}?id=${z.id}`, { method: 'PUT', headers, body: JSON.stringify({...z, active: false}) });
                      }
                      if (editingZone.id) {
                        await fetch(`${ZONES_URL}?id=${editingZone.id}`, { method: 'PUT', headers, body: JSON.stringify(editingZone) });
                      } else {
                        await fetch(ZONES_URL, { method: 'POST', headers, body: JSON.stringify(editingZone) });
                      }
                      await loadZones();
                      setEditingZone(null); setSavingZone(false);
                      toast({ title: 'Зона сохранена!' });
                    }}
                    onCancel={() => setEditingZone(null)}
                  />
                );
              })()}
            </Card>

            {/* Ценовые зоны по радиусу */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-primary flex items-center gap-2 mb-1">
                <Icon name="CircleDollarSign" size={18} />Ценовые зоны выезда
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Укажите центр и 4 зоны с коэффициентами. На карте они отобразятся концентрическими кругами: зелёный → жёлтый → оранжевый → красный.
              </p>

              {/* Центр */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Центр (базовая точка)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Широта</label>
                    <input type="number" step="0.0001" className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                      value={priceZones.center_lat}
                      onChange={e => setPriceZones(p => ({...p, center_lat: parseFloat(e.target.value)}))} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Долгота</label>
                    <input type="number" step="0.0001" className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                      value={priceZones.center_lon}
                      onChange={e => setPriceZones(p => ({...p, center_lon: parseFloat(e.target.value)}))} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">По умолчанию: Звенигород (55.7328, 36.8517)</p>
              </div>

              {/* 4 зоны */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Зоны (от ближней к дальней)</p>
                {([
                  { color: '#22c55e', bg: 'bg-green-500/10 border-green-500/30' },
                  { color: '#eab308', bg: 'bg-yellow-500/10 border-yellow-500/30' },
                  { color: '#f97316', bg: 'bg-orange-500/10 border-orange-500/30' },
                  { color: '#ef4444', bg: 'bg-red-500/10 border-red-500/30' },
                ] as const).map((meta, i) => (
                  <div key={i} className={`rounded-xl border p-3 ${meta.bg}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                      <span className="text-xs font-medium">Зона {i + 1}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Название</label>
                        <input className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs"
                          value={priceZones.zones[i]?.label || ''}
                          onChange={e => setPriceZones(p => {
                            const zones = [...p.zones];
                            zones[i] = { ...zones[i], label: e.target.value };
                            return { ...p, zones };
                          })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Радиус (км)</label>
                        <input type="number" step="5" min="1" className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs"
                          value={priceZones.zones[i]?.radius || ''}
                          onChange={e => setPriceZones(p => {
                            const zones = [...p.zones];
                            zones[i] = { ...zones[i], radius: parseFloat(e.target.value) };
                            return { ...p, zones };
                          })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Коэффициент</label>
                        <input type="number" step="0.1" min="1" className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs"
                          value={priceZones.zones[i]?.factor || ''}
                          onChange={e => setPriceZones(p => {
                            const zones = [...p.zones];
                            zones[i] = { ...zones[i], factor: parseFloat(e.target.value) };
                            return { ...p, zones };
                          })} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button disabled={savingPriceZones} onClick={async () => {
                setSavingPriceZones(true);
                await fetch(PRICE_ZONES_URL, { method: 'POST', headers, body: JSON.stringify(priceZones) });
                await loadPriceZones();
                setSavingPriceZones(false);
                toast({ title: 'Ценовые зоны сохранены!' });
              }}>
                <Icon name="Check" size={14} className="mr-1.5" />
                {savingPriceZones ? 'Сохраняем...' : 'Сохранить зоны'}
              </Button>
            </Card>

            {/* Яндекс Метрика */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-primary mb-1 flex items-center gap-2">
                <Icon name="BarChart2" size={18} />Яндекс Метрика
              </h3>
              <p className="text-sm text-muted-foreground mb-5">Счётчик автоматически подключится на всех страницах сайта.</p>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Номер счётчика</label>
                  <div className="flex gap-2">
                    <input
                      placeholder="Например: 98765432"
                      className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={siteSettings.metrika_id || ''}
                      onChange={e => setSiteSettings(p => ({...p, metrika_id: e.target.value.replace(/\D/g, '')}))}
                    />
                    <Button disabled={savingSettings} onClick={async () => {
                      setSavingSettings(true);
                      await fetch(`${SETTINGS_URL}?section=settings`, { method: 'POST', headers, body: JSON.stringify({ metrika_id: siteSettings.metrika_id || '' }) });
                      setSavingSettings(false);
                      toast({ title: siteSettings.metrika_id ? 'Метрика подключена!' : 'Метрика отключена', description: siteSettings.metrika_id ? `Счётчик ${siteSettings.metrika_id} активен` : '' });
                    }}>{savingSettings ? '...' : 'Сохранить'}</Button>
                  </div>
                  {siteSettings.metrika_id && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
                      <Icon name="CheckCircle" size={12} />Счётчик {siteSettings.metrika_id} подключён
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 space-y-2 text-sm">
                <p className="font-medium text-foreground">Как получить номер счётчика:</p>
                <ol className="space-y-1 text-muted-foreground text-xs list-decimal list-inside">
                  <li>Зайдите на <span className="text-primary font-medium">metrika.yandex.ru</span></li>
                  <li>Нажмите «Добавить счётчик» → укажите домен сайта</li>
                  <li>Скопируйте номер счётчика (8 цифр) и вставьте выше</li>
                  <li>Нажмите «Сохранить» — счётчик заработает автоматически</li>
                </ol>
              </div>
            </Card>

          </div>
        )}
      </main>
    </div>
  );
}