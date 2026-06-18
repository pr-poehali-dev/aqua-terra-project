import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import Logo from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';

const CATALOG_URL = 'https://functions.poehali.dev/5792c301-10d8-4ade-8987-58fa81f89be1';

interface Category { id: number; slug: string; title: string; icon: string; sort_order: number; active: boolean; }
interface Section { id: number; slug: string; title: string; description: string; icon: string; active: boolean; has_order_form: boolean; categories: Category[]; }
interface Product { id: number; name: string; price: number; tag: string; icon: string; photo_url: string | null; description: string; in_stock: boolean; category: { id: number; slug: string; title: string } | null; }

function useCart() {
  const [items, setItems] = useState<{ name: string; price: string; icon: string; tag: string; qty: number }[]>([]);
  const add = (p: Product) => setItems(prev => {
    const ex = prev.find(i => i.name === p.name);
    if (ex) return prev.map(i => i.name === p.name ? { ...i, qty: i.qty + 1 } : i);
    return [...prev, { name: p.name, price: String(p.price), icon: p.icon, tag: p.tag, qty: 1 }];
  });
  const remove = (name: string) => setItems(prev => prev.filter(i => i.name !== name));
  const total = items.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);
  return { items, add, remove, total, count };
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [sections, setSections] = useState<Section[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [orderForm, setOrderForm] = useState({ name: '', contact: '', message: '' });
  const [sending, setSending] = useState(false);

  // Тулбар
  const [shopSearch, setShopSearch] = useState('');
  const [shopSort, setShopSort] = useState<'default' | 'price_asc' | 'price_desc' | 'name_asc'>('default');
  const [shopView, setShopView] = useState<'grid3' | 'grid2' | 'list'>('grid3');

  const cart = useCart();
  const { toast } = useToast();

  const activeSection = params.get('section') || '';
  const activeCategory = params.get('category') || '';

  useEffect(() => {
    fetch(CATALOG_URL).then(r => r.json()).then((data: Section[]) => {
      setSections(data);
      const first = data.find(s => s.active);
      if (!activeSection && first) {
        setParams({ section: first.slug }, { replace: true });
        setOpenSections(new Set([first.slug]));
      } else if (activeSection) {
        setOpenSections(new Set([activeSection]));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeSection) return;
    setLoading(true);
    fetch(`${CATALOG_URL}?section=${activeSection}`)
      .then(r => r.json())
      .then(d => { setProducts(d); setLoading(false); })
      .catch(() => setLoading(false));
    setShopSearch('');
  }, [activeSection]);

  const currentSection = sections.find(s => s.slug === activeSection);

  const setSection = (slug: string) => {
    setParams({ section: slug });
    setOpenSections(new Set([slug]));
  };
  const setCategory = (slug: string) => setParams({ section: activeSection, ...(slug ? { category: slug } : {}) });

  const toggleSection = (slug: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(slug)) { next.delete(slug); } else { next.add(slug); }
      return next;
    });
  };

  // Фильтр + поиск + сортировка
  const filtered = useMemo(() => {
    const q = shopSearch.trim().toLowerCase();
    let list = activeCategory
      ? products.filter(p => p.category?.slug === activeCategory)
      : products;
    if (q) list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.tag.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
    if (shopSort === 'price_asc')  list = [...list].sort((a, b) => a.price - b.price);
    if (shopSort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    if (shopSort === 'name_asc')   list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    return list;
  }, [products, activeCategory, shopSearch, shopSort]);

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.name || !orderForm.contact) { toast({ title: 'Заполните имя и контакт', variant: 'destructive' }); return; }
    setSending(true);
    await fetch(`${CATALOG_URL}?action=order_form`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderForm, section: currentSection?.title }),
    });
    setSending(false);
    setOrderForm({ name: '', contact: '', message: '' });
    toast({ title: 'Заявка отправлена!', description: 'Свяжемся с вами в ближайшее время.' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/"><Logo size="sm" /></Link>
          <div className="flex items-center gap-2">
            <Link to="/"><Button variant="ghost" size="sm"><Icon name="ArrowLeft" size={16} className="mr-1" />На сайт</Button></Link>
            <Button variant="outline" size="sm" className="relative" onClick={() => setCartOpen(true)}>
              <Icon name="ShoppingCart" size={16} className="mr-1" />Корзина
              {cart.count > 0 && <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1 text-xs">{cart.count}</Badge>}
            </Button>
          </div>
        </div>
      </header>

      <div className="container px-4 md:px-6 py-6">

        {/* Разделы — горизонтальный таб */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {sections.filter(s => s.active).map(s => (
            <button key={s.slug} onClick={() => setSection(s.slug)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border whitespace-nowrap font-medium text-sm transition-all
                ${activeSection === s.slug
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
              <Icon name={s.icon} size={16} />
              {s.title}
            </button>
          ))}
        </div>

        {/* Скелетон */}
        {!activeSection && sections.length === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl bg-muted" />)}
          </div>
        )}

        {currentSection && (
          <div className="flex gap-6 items-start">

            {/* Сайдбар-дерево */}
            <aside className="w-52 shrink-0 hidden md:block">
              {/* Всё */}
              <button onClick={() => setCategory('')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 ${
                  !activeCategory ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                }`}>
                <Icon name="LayoutGrid" size={15} />
                Все товары
                <span className="ml-auto text-xs opacity-70">{products.length}</span>
              </button>

              <div className="space-y-0.5">
                {sections.filter(s => s.active).map(section => {
                  const isOpen = openSections.has(section.slug);
                  const isActive = section.slug === activeSection;
                  return (
                    <div key={section.slug}>
                      <button
                        onClick={() => { setSection(section.slug); toggleSection(section.slug); }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                          isActive ? 'text-primary' : 'text-foreground hover:bg-muted'
                        }`}>
                        <Icon name={section.icon} size={15} className="text-primary shrink-0" />
                        <span className="flex-1 text-left">{section.title}</span>
                        <Icon name={isOpen ? 'Minus' : 'Plus'} size={13} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                      {isOpen && isActive && (
                        <div className="ml-4 pl-3 border-l border-border space-y-0.5 mb-1">
                          {section.categories.filter(c => c.active).map(cat => (
                            <button key={cat.slug} onClick={() => setCategory(cat.slug)}
                              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all text-left ${
                                activeCategory === cat.slug ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}>
                              <Icon name={cat.icon} size={13} className="shrink-0" />
                              {cat.title}
                              <span className="ml-auto text-xs opacity-50">
                                {products.filter(p => p.category?.slug === cat.slug).length || ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* Правая часть */}
            <div className="flex-1 min-w-0">

              {/* Мобиль: горизонтальные категории */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 md:hidden scrollbar-hide">
                <button onClick={() => setCategory('')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                    !activeCategory ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
                  }`}>
                  <Icon name="LayoutGrid" size={13} />Все
                </button>
                {currentSection.categories.filter(c => c.active).map(cat => (
                  <button key={cat.slug} onClick={() => setCategory(cat.slug)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                      activeCategory === cat.slug ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
                    }`}>
                    <Icon name={cat.icon} size={13} />{cat.title}
                  </button>
                ))}
              </div>

              {/* Форма заказа (кастомные разделы) */}
              {currentSection.has_order_form && (
                <Card className="p-6 mb-6 border-primary/20 bg-primary/5">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl gradient-deep grid place-items-center shrink-0">
                      <Icon name={currentSection.icon} size={24} className="text-white/80" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-primary">{currentSection.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{currentSection.description}</p>
                    </div>
                  </div>
                  <form onSubmit={submitOrder} className="grid sm:grid-cols-2 gap-3">
                    <input required placeholder="Ваше имя" value={orderForm.name} onChange={e => setOrderForm(p => ({...p, name: e.target.value}))}
                      className="h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <input required placeholder="Телефон или Telegram" value={orderForm.contact} onChange={e => setOrderForm(p => ({...p, contact: e.target.value}))}
                      className="h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <textarea placeholder="Что интересует?" rows={2} value={orderForm.message} onChange={e => setOrderForm(p => ({...p, message: e.target.value}))}
                      className="sm:col-span-2 resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <Button type="submit" disabled={sending} className="sm:col-span-2">
                      {sending ? 'Отправляем…' : 'Отправить заявку'}
                    </Button>
                  </form>
                </Card>
              )}

              {/* Тулбар */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {/* Поиск */}
                <div className="relative flex-1 min-w-[160px]">
                  <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input value={shopSearch} onChange={e => setShopSearch(e.target.value)}
                    placeholder="Поиск по товарам…"
                    className="w-full h-9 pl-9 pr-8 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  {shopSearch && (
                    <button onClick={() => setShopSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <Icon name="X" size={13} />
                    </button>
                  )}
                </div>

                {/* Сортировка */}
                <select value={shopSort} onChange={e => setShopSort(e.target.value as typeof shopSort)}
                  className="h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="default">По умолчанию</option>
                  <option value="price_asc">Дешевле сначала</option>
                  <option value="price_desc">Дороже сначала</option>
                  <option value="name_asc">От А до Я</option>
                </select>

                {/* Вид */}
                <div className="flex items-center rounded-lg border border-input overflow-hidden">
                  {([['grid3','LayoutGrid'],['grid2','Grid2x2'],['list','List']] as const).map(([v, icon]) => (
                    <button key={v} onClick={() => setShopView(v)}
                      className={`h-9 w-9 grid place-items-center transition-colors ${shopView === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                      <Icon name={icon} size={15} />
                    </button>
                  ))}
                </div>

                <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} товаров</span>
              </div>

              {/* Загрузка */}
              {loading && (
                <div className={shopView === 'list' ? 'space-y-3' : `grid gap-4 ${shopView === 'grid2' ? 'grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {[1,2,3,4,5,6].map(i => <div key={i} className={`bg-muted animate-pulse rounded-2xl ${shopView === 'list' ? 'h-24' : 'aspect-[4/3]'}`} />)}
                </div>
              )}

              {/* Пусто */}
              {!loading && filtered.length === 0 && !currentSection.has_order_form && (
                <div className="text-center py-20 text-muted-foreground">
                  <Icon name="PackageOpen" size={48} className="mx-auto mb-4 opacity-30" />
                  {shopSearch ? <><p className="font-medium">Ничего не найдено</p><p className="text-sm mt-1">Попробуйте другой запрос</p></> : <><p className="font-medium">Товаров пока нет</p><p className="text-sm mt-1">Скоро здесь появятся товары</p></>}
                </div>
              )}

              {/* Товары */}
              {!loading && filtered.length > 0 && (
                <div className={
                  shopView === 'list' ? 'flex flex-col gap-3' :
                  shopView === 'grid2' ? 'grid grid-cols-2 gap-4' :
                  'grid sm:grid-cols-2 lg:grid-cols-3 gap-5'
                }>
                  {filtered.map(p => (
                    shopView === 'list' ? (
                      <div key={p.id} className="glass-card rounded-2xl overflow-hidden flex gap-4 items-center cursor-pointer hover:border-primary/30 transition-colors border border-transparent p-3"
                        onClick={() => setSelected(p)}>
                        <div className="w-20 h-20 rounded-xl shrink-0 gradient-deep grid place-items-center overflow-hidden">
                          {p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" /> : <Icon name={p.icon} size={28} className="text-white/50" />}
                          {!p.in_stock && <div className="absolute inset-0 bg-black/50 rounded-xl" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Badge className="bg-sand text-primary hover:bg-sand text-xs mb-1">{p.tag}</Badge>
                          <h3 className="font-semibold text-foreground text-sm leading-tight">{p.name}</h3>
                          {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-secondary font-bold text-sm">{p.price.toLocaleString('ru')} ₽</p>
                          {p.in_stock ? (
                            <Button size="icon" variant="secondary" className="h-8 w-8"
                              onClick={e => { e.stopPropagation(); cart.add(p); toast({ title: `${p.name} добавлен` }); }}>
                              <Icon name="ShoppingCart" size={15} />
                            </Button>
                          ) : <Badge variant="outline" className="text-xs">Нет</Badge>}
                        </div>
                      </div>
                    ) : (
                      <div key={p.id} className="glass-card rounded-2xl overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300"
                        onClick={() => setSelected(p)}>
                        <div className={`${shopView === 'grid2' ? 'aspect-square' : 'aspect-[4/3]'} gradient-deep relative overflow-hidden grid place-items-center`}>
                          {p.photo_url
                            ? <img src={p.photo_url} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            : <Icon name={p.icon} size={shopView === 'grid2' ? 44 : 52} className="text-white/40 group-hover:scale-110 transition-transform" />}
                          <Badge className="absolute top-3 left-3 bg-sand text-primary hover:bg-sand z-10 text-xs">{p.tag}</Badge>
                          {!p.in_stock && <div className="absolute inset-0 bg-black/50 grid place-items-center"><span className="text-white text-sm font-semibold">Нет в наличии</span></div>}
                        </div>
                        <div className="p-4 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground leading-tight text-sm">{p.name}</h3>
                            <p className="text-secondary font-bold mt-0.5 text-sm">{p.price.toLocaleString('ru')} ₽</p>
                          </div>
                          {p.in_stock && (
                            <Button size="icon" variant="secondary" className="shrink-0 h-9 w-9"
                              onClick={e => { e.stopPropagation(); cart.add(p); toast({ title: `${p.name} добавлен в корзину` }); }}>
                              <Icon name="ShoppingCart" size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Модал товара */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="aspect-video gradient-deep relative overflow-hidden">
              {selected.photo_url
                ? <img src={selected.photo_url} alt={selected.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full grid place-items-center"><Icon name={selected.icon} size={72} className="text-white/40" /></div>}
              <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 grid place-items-center text-white" onClick={() => setSelected(null)}>
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="p-6">
              <Badge className="mb-3 bg-sand text-primary hover:bg-sand">{selected.tag}</Badge>
              <h3 className="font-display text-2xl font-bold text-primary mb-2">{selected.name}</h3>
              {selected.description && <p className="text-muted-foreground text-sm mb-4">{selected.description}</p>}
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-bold text-secondary">{selected.price.toLocaleString('ru')} ₽</span>
                {selected.in_stock
                  ? <Button onClick={() => { cart.add(selected); setSelected(null); toast({ title: `${selected.name} добавлен в корзину` }); }}>
                      <Icon name="ShoppingCart" size={16} className="mr-2" />В корзину
                    </Button>
                  : <Badge variant="outline">Нет в наличии</Badge>}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Корзина */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="relative bg-background w-full max-w-sm flex flex-col h-full shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display text-xl font-bold text-primary">Корзина</h2>
              <button onClick={() => setCartOpen(false)}><Icon name="X" size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.items.length === 0
                ? <div className="text-center py-16 text-muted-foreground"><Icon name="ShoppingCart" size={40} className="mx-auto mb-3 opacity-30" /><p>Корзина пуста</p></div>
                : cart.items.map(item => (
                  <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-lg gradient-deep grid place-items-center shrink-0">
                      <Icon name={item.icon} size={18} className="text-white/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-secondary text-sm font-bold">{(Number(item.price) * item.qty).toLocaleString('ru')} ₽</p>
                    </div>
                    <span className="text-xs text-muted-foreground">×{item.qty}</span>
                    <button onClick={() => cart.remove(item.name)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                ))}
            </div>
            {cart.items.length > 0 && (
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex justify-between font-bold">
                  <span>Итого:</span>
                  <span className="text-primary font-display text-xl">{cart.total.toLocaleString('ru')} ₽</span>
                </div>
                <Button className="w-full" onClick={() => toast({ title: 'Заявка отправлена!' })}>
                  Оформить заказ
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
