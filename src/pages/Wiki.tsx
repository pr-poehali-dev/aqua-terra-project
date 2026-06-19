import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import Logo from '@/components/Logo';

const ARTICLES_URL = 'https://functions.poehali.dev/c111c540-337c-4680-8bd9-f05e940f8dbf';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  cover_url: string | null;
  created_at: string;
  content?: string;
}

export default function Wiki() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Article | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    fetch(ARTICLES_URL).then(r => r.json()).then(setArticles).catch(() => {});
  }, []);

  const openArticle = async (slug: string) => {
    const res = await fetch(`${ARTICLES_URL}?slug=${slug}`);
    const data = await res.json();
    setSelected(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(articles.map(a => a.category).filter(Boolean)));
    return cats;
  }, [articles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter(a => {
      const matchCat = activeCategory === 'all' || a.category === activeCategory;
      const matchSearch = !q || a.title.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [articles, search, activeCategory]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container flex items-center justify-between h-14 md:h-16 px-4 md:px-6">
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
              <Icon name="ArrowLeft" size={15} /> На главную
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-20 px-4 md:px-6 text-center bg-scales relative overflow-hidden">
        <div className="container relative z-10 max-w-2xl mx-auto">
          <Badge variant="secondary" className="mb-4">База знаний</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary mb-4">
            Полезные материалы
          </h1>
          <p className="text-muted-foreground text-lg">
            Советы по уходу, обустройству и содержанию живых систем.
          </p>
          {/* Поиск */}
          <div className="relative mt-8 max-w-md mx-auto">
            <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по статьям…"
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <Icon name="X" size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 md:py-14 px-4 md:px-6">
        <div className="container max-w-6xl mx-auto">
          {/* Категории */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${activeCategory === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
              >
                Все
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${activeCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Статьи */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {articles.length === 0
                ? <><Icon name="BookOpen" size={48} className="mx-auto mb-4 opacity-20" /><p>Статьи скоро появятся</p></>
                : <><Icon name="Search" size={48} className="mx-auto mb-4 opacity-20" /><p>Ничего не найдено</p></>
              }
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(a => (
                <div
                  key={a.id}
                  className="glass-card rounded-2xl overflow-hidden hover-scale group cursor-pointer"
                  onClick={() => openArticle(a.slug)}
                >
                  <div className="aspect-[16/9] gradient-deep grid place-items-center text-white/40 overflow-hidden">
                    {a.cover_url
                      ? <img src={a.cover_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4 md:p-10"
          onClick={() => setSelected(null)}
        >
          <Card className="w-full max-w-3xl my-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 md:p-10">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <Badge variant="outline" className="mb-3">{selected.category}</Badge>
                  <h2 className="font-display text-3xl font-bold text-primary">{selected.title}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors">
                  <Icon name="X" size={22} />
                </button>
              </div>
              <div
                className="prose prose-sm max-w-none text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: selected.content || '' }}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-10">
        <div className="container px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <Logo size="sm" />
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1.5">
            <Icon name="ArrowLeft" size={14} /> Вернуться на главную
          </Link>
        </div>
      </footer>
    </div>
  );
}
