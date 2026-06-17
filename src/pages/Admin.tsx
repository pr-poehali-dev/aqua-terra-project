import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const ADMIN_URL = 'https://functions.poehali.dev/e8098f3c-29db-4ad6-a1d7-eeb57eb5dea7';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  cover_url: string | null;
  published: boolean;
  created_at: string;
}

const EMPTY: Omit<Article, 'id' | 'slug' | 'created_at'> = {
  title: '', excerpt: '', content: '', category: 'Аквариумы', cover_url: null, published: false,
};

const CATEGORIES = ['Аквариумы', 'Террариумы', 'Флорариумы', 'Экзотика', 'Корма', 'Общее'];

export default function Admin() {
  const { toast } = useToast();
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [saving, setSaving] = useState(false);

  const headers = { 'Content-Type': 'application/json', 'X-Admin-Token': token };

  const load = async () => {
    setLoading(true);
    const res = await fetch(ADMIN_URL, { headers });
    if (res.status === 401) { toast({ title: 'Неверный пароль', variant: 'destructive' }); setLoading(false); return; }
    const data = await res.json();
    setArticles(data);
    setAuthed(true);
    setLoading(false);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const isNew = !editing.id;
    const url = isNew ? ADMIN_URL : `${ADMIN_URL}?id=${editing.id}`;
    const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers, body: JSON.stringify(editing) });
    if (res.ok) {
      toast({ title: isNew ? 'Статья создана!' : 'Статья сохранена!' });
      setEditing(null);
      load();
    } else {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
    }
    setSaving(false);
  };

  const remove = async (id: number) => {
    if (!confirm('Удалить статью?')) return;
    await fetch(`${ADMIN_URL}?id=${id}`, { method: 'DELETE', headers });
    load();
  };

  const togglePublish = async (article: Article) => {
    await fetch(`${ADMIN_URL}?id=${article.id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ ...article, published: !article.published }),
    });
    load();
  };

  if (!authed) {
    return (
      <div className="min-h-screen gradient-deep flex items-center justify-center p-4">
        <Card className="p-8 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Icon name="Fish" size={22} className="text-primary" />
            <span className="font-display text-xl font-bold text-primary">Панель управления</span>
          </div>
          <p className="text-muted-foreground text-sm mb-4">Введите пароль для входа</p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Пароль"
            className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring mb-4"
          />
          <Button className="w-full" onClick={load} disabled={loading}>
            {loading ? 'Входим…' : 'Войти'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-8 h-8 rounded-lg gradient-deep text-white">
            <Icon name="Fish" size={18} />
          </span>
          <span className="font-display text-xl font-bold text-primary">Статьи</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEditing({ ...EMPTY })} size="sm">
            <Icon name="Plus" size={16} className="mr-1" /> Новая статья
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
            <Icon name="ArrowLeft" size={16} className="mr-1" /> На сайт
          </Button>
        </div>
      </header>

      <main className="container py-8 px-4 md:px-6">
        {editing ? (
          <Card className="p-6 max-w-3xl mx-auto space-y-4">
            <h2 className="font-display text-2xl font-bold text-primary">{editing.id ? 'Редактировать статью' : 'Новая статья'}</h2>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Заголовок *</label>
              <input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Заголовок статьи" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Категория</label>
              <select value={editing.category || 'Общее'} onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="w-full h-11 px-4 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Краткое описание</label>
              <textarea rows={2} value={editing.excerpt || ''} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Пара предложений для превью" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Текст статьи</label>
              <textarea rows={12} value={editing.content || ''} onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono text-sm" placeholder="Текст статьи..." />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="pub" checked={!!editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="w-4 h-4 accent-primary" />
              <label htmlFor="pub" className="text-sm font-medium">Опубликовать сразу</label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={save} disabled={saving}>{saving ? 'Сохраняем…' : 'Сохранить'}</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {articles.length === 0 && (
              <p className="text-center text-muted-foreground py-16">Статей пока нет. Нажмите «Новая статья».</p>
            )}
            {articles.map((a) => (
              <Card key={a.id} className="p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-primary truncate">{a.title}</h3>
                    <Badge variant={a.published ? 'default' : 'secondary'} className="shrink-0 text-xs">
                      {a.published ? 'Опубликовано' : 'Черновик'}
                    </Badge>
                    <Badge variant="outline" className="shrink-0 text-xs">{a.category}</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm truncate">{a.excerpt}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="icon" variant="ghost" title={a.published ? 'Снять с публикации' : 'Опубликовать'} onClick={() => togglePublish(a)}>
                    <Icon name={a.published ? 'EyeOff' : 'Eye'} size={16} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(a)}>
                    <Icon name="Pencil" size={16} />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(a.id)}>
                    <Icon name="Trash2" size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
