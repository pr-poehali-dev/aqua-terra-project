import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import Logo from '@/components/Logo';
import WaterCursor from '@/components/WaterCursor';
import { useToast } from '@/hooks/use-toast';

const CATALOG_URL = 'https://functions.poehali.dev/5792c301-10d8-4ade-8987-58fa81f89be1';
const LEAD_URL = 'https://functions.poehali.dev/65042d39-89d6-40d3-9d30-42b0ccb9d003';

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
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [orderForm, setOrderForm] = useState({ name: '', contact: '', message: '' });
  const [sending, setSending] = useState(false);
  const cart = useCart();
  const { toast } = useToast();

  const activeSection = params.get('section') || '';
  const activeCategory = params.get('category') || '';

  useEffect(() => {
    fetch(CATALOG_URL).then(r => r.json()).then(setSections).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeSection) return;
    setLoading(true);
    const url = `${CATALOG_URL}?section=${activeSection}${activeCategory ? `&category=${activeCategory}` : ''}${search ? `&search=${search}` : ''}`;
    fetch(url).then(r => r.json()).then(d => { setProducts(d); setLoading(false); }).catch(() => setLoading(false));
  }, [activeSection, activeCategory, search]);

  const currentSection = sections.find(s => s.slug === activeSection);
  const setSection = (slug: string) => setParams({ section: slug });
  const setCategory = (slug: string) => setParams({ section: activeSection, category: slug });

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.name || !orderForm.contact) { toast({ title: 'Заполните имя и контакт', variant: 'destructive' }); return; }
    setSending(true);
    await fetch(`${CATALOG_URL}?action=order_form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderForm, section: currentSection?.title }),
    });
    setSending(false);
    setOrderForm({ name: '', contact: '', message: '' });
    toast({ title: 'Заявка отправлена!', description: 'Свяжемся с вами в ближайшее время.' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WaterCursor />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/"><Logo size="sm" /></Link>
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Поиск по магазину..." className="pl-9 h-9" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/"><Button variant="ghost" size="sm"><Icon name="ArrowLeft" size={16} className="mr-1" />На сайт</Button></Link>
            <Button variant="outline" size="sm" className="relative" onClick={() => setCartOpen(true)}>
              <Icon name="ShoppingCart" size={16} className="mr-1" />Корзина
              {cart.count > 0 && <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1 text-xs">{cart.count}</Badge>}
            </Button>
          </div>
        </div>
      </header>

      <div className="container px-4 md:px-6 py-8">
        {/* Разделы — горизонтальный таб */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {sections.filter(s => s.active).map(s => (
            <button key={s.slug} onClick={() => setSection(s.slug)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border whitespace-nowrap font-medium text-sm transition-all
                ${activeSection === s.slug
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}>
              <Icon name={s.icon } size={16} />
              {s.title}
            </button>
          ))}
        </div>

        {/* Пустой стейт */}
        {!activeSection && (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-muted mx-auto mb-6 grid place-items-center">
              <Icon name="ShoppingBag" size={36} className="text-muted-foreground" />
            </div>
            <h2 className="font-display text-3xl font-bold text-primary mb-3">Выберите раздел</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">Выберите категорию выше, чтобы увидеть товары</p>
          </div>
        )}

        {/* Контент раздела */}
        {currentSection && (
          <div className="grid md:grid-cols-[220px_1fr] gap-8">
            {/* Сайдбар: категории */}
            <aside className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Категории</p>
              <button onClick={() => setCategory('')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                  ${!activeCategory ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <Icon name="LayoutGrid" size={16} />Все товары
                <span className="ml-auto text-xs opacity-60">{products.length}</span>
              </button>
              {currentSection.categories.map(cat => {
                const cnt = products.filter(p => p.category?.slug === cat.slug).length;
                return (
                  <button key={cat.slug} onClick={() => setCategory(cat.slug)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                      ${activeCategory === cat.slug ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                    <Icon name={cat.icon} size={16} />
                    {cat.title}
                    {cnt > 0 && <span className="ml-auto text-xs opacity-60">{cnt}</span>}
                  </button>
                );
              })}
            </aside>

            {/* Основная часть */}
            <main>
              {/* Мобильный поиск */}
              <div className="relative mb-4 md:hidden">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Поиск..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              {/* Форма заказа (для кастомных разделов) */}
              {currentSection.has_order_form && (
                <Card className="p-6 mb-8 border-primary/20 bg-primary/5">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                      <Icon name="Sparkles" size={22} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-primary">{currentSection.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{currentSection.description}</p>
                    </div>
                  </div>
                  <form onSubmit={submitOrder} className="grid sm:grid-cols-2 gap-3">
                    <Input placeholder="Ваше имя" value={orderForm.name} onChange={e => setOrderForm(p => ({ ...p, name: e.target.value }))} />
                    <Input placeholder="Telegram или телефон" value={orderForm.contact} onChange={e => setOrderForm(p => ({ ...p, contact: e.target.value }))} />
                    <textarea placeholder="Опишите желаемый аквариум или террариум..." rows={3}
                      className="sm:col-span-2 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={orderForm.message} onChange={e => setOrderForm(p => ({ ...p, message: e.target.value }))} />
                    <Button type="submit" disabled={sending} className="sm:col-span-2">
                      {sending ? 'Отправляем...' : 'Оставить заявку'}
                    </Button>
                  </form>
                </Card>
              )}

              {/* Товары */}
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[4/5]" />
                  ))}
                </div>
              ) : products.length === 0 && !currentSection.has_order_form ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Icon name="PackageOpen" size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Товаров пока нет</p>
                  <p className="text-sm mt-1">Скоро здесь появятся товары</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(activeCategory ? products.filter(p => p.category?.slug === activeCategory) : products).map(p => (
                    <div key={p.id} className="glass-card rounded-2xl overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300"
                      onClick={() => setSelected(p)}>
                      <div className="aspect-[4/3] gradient-deep relative overflow-hidden grid place-items-center">
                        {p.photo_url
                          ? <img src={p.photo_url} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <Icon name={p.icon} size={52} className="text-white/40 group-hover:scale-110 transition-transform" />}
                        <Badge className="absolute top-3 left-3 bg-sand text-primary hover:bg-sand z-10">{p.tag}</Badge>
                        {!p.in_stock && <div className="absolute inset-0 bg-black/50 grid place-items-center"><span className="text-white text-sm font-semibold">Нет в наличии</span></div>}
                      </div>
                      <div className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground leading-tight">{p.name}</h3>
                          <p className="text-secondary font-bold mt-1">{p.price.toLocaleString('ru')} ₽</p>
                        </div>
                        {p.in_stock && (
                          <Button size="icon" variant="secondary" className="shrink-0"
                            onClick={e => { e.stopPropagation(); cart.add(p); toast({ title: `${p.name} добавлен в корзину` }); }}>
                            <Icon name="ShoppingCart" size={18} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
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
                <Button className="w-full" onClick={() => { toast({ title: 'Заявка отправлена!' }); }}>
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