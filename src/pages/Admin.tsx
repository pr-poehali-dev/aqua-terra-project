import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import Logo from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';

const ARTICLES_ADMIN = 'https://functions.poehali.dev/e8098f3c-29db-4ad6-a1d7-eeb57eb5dea7';
const PRODUCTS_ADMIN = 'https://functions.poehali.dev/56ecfcae-0ead-4151-b546-411ce113bde1';
const SERVICES_ADMIN = 'https://functions.poehali.dev/830e0abf-4c6e-434b-b914-bacffaa6c73f';

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

const ARTICLE_CATS = ['Аквариумы', 'Террариумы', 'Флорариумы', 'Экзотика', 'Корма', 'Общее'];
const PRODUCT_CATS = [{ id: 'animals', label: 'Животные' }, { id: 'food', label: 'Корма' }, { id: 'supplies', label: 'Материалы' }];
const ICONS = ['Fish', 'Turtle', 'Bug', 'Wheat', 'Package', 'Lightbulb', 'Settings', 'Sprout', 'Waves', 'Wrench', 'Truck', 'Star', 'Waves'];
const EMPTY_PRODUCT: Omit<Product, 'id'> = { name: '', price: 0, category: 'animals', tag: '', icon: 'Package', photo_url: null, in_stock: true, description: '' };
const EMPTY_ARTICLE: Omit<Article, 'id' | 'slug' | 'created_at'> = { title: '', excerpt: '', content: '', category: 'Аквариумы', cover_url: null, published: false };
const EMPTY_SERVICE: Omit<Service, 'id'> = { icon: 'Wrench', title: '', description: '', price_from: 0, price_unit: 'за работу', tags: [], sort_order: 99, active: true };

export default function Admin() {
  const { toast } = useToast();
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'products' | 'services' | 'articles'>('products');

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

  const headers = { 'Content-Type': 'application/json', 'X-Admin-Token': token };

  const login = async () => {
    setLoading(true);
    const [ra, rp, rs] = await Promise.all([
      fetch(ARTICLES_ADMIN, { headers }),
      fetch(PRODUCTS_ADMIN, { headers }),
      fetch(`${SERVICES_ADMIN}?admin=1`, { headers }),
    ]);
    if (ra.status === 401) { toast({ title: 'Неверный пароль', variant: 'destructive' }); setLoading(false); return; }
    setArticles(await ra.json());
    setProducts(await rp.json());
    setSvcList(await rs.json());
    setAuthed(true);
    setLoading(false);
  };

  const loadArticles = () => fetch(ARTICLES_ADMIN, { headers }).then(r => r.json()).then(setArticles);
  const loadProducts = () => fetch(PRODUCTS_ADMIN, { headers }).then(r => r.json()).then(setProducts);
  const loadServices = () => fetch(`${SERVICES_ADMIN}?admin=1`, { headers }).then(r => r.json()).then(setSvcList);

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
            else if (tab === 'services') setEditingSvc({ ...EMPTY_SERVICE });
            else setEditingArticle({ ...EMPTY_ARTICLE });
          }} size="sm">
            <Icon name="Plus" size={16} className="mr-1" />
            {tab === 'products' ? 'Новый товар' : tab === 'services' ? 'Новая услуга' : 'Новая статья'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
            <Icon name="ArrowLeft" size={16} className="mr-1" /> На сайт
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-background">
        <div className="container px-4 md:px-6 flex gap-0">
          {([['products','🛍 Товары'], ['services','💰 Услуги и цены'], ['articles','📝 Статьи']] as const).map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); setEditingProduct(null); setEditingSvc(null); setEditingArticle(null); }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="container py-8 px-4 md:px-6">

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
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Текст статьи</label>
                <textarea rows={12} value={editingArticle.content || ''} onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono text-sm" placeholder="Текст статьи..." />
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
      </main>
    </div>
  );
}