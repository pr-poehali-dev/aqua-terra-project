
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Shop from "./pages/Shop";
import NotFound from "./pages/NotFound";
import WaterCursor from "@/components/WaterCursor";

const queryClient = new QueryClient();
const SETTINGS_URL = 'https://functions.poehali.dev/9257c1cb-d389-4e76-a3a9-69b452c12431';

function YandexMetrika() {
  useEffect(() => {
    fetch(SETTINGS_URL).then(r => r.json()).then(d => {
      const id = d?.settings?.metrika_id;
      if (!id) return;
      // Инициализируем счётчик
      const w = window as unknown as Record<string, unknown>;
      type YmFn = ((...args: unknown[]) => void) & { a?: unknown[]; l?: number };
      const ym: YmFn = (w['ym'] as YmFn) || function(...args: unknown[]) { (ym.a = ym.a || []).push(args); };
      ym.l = 1 * Date.now();
      w['ym'] = ym;
      // Подгружаем скрипт если ещё не загружен
      if (!document.querySelector('script[src="https://mc.yandex.ru/metrika/tag.js"]')) {
        const s = document.createElement('script');
        s.async = true;
        s.src = 'https://mc.yandex.ru/metrika/tag.js';
        document.head.appendChild(s);
      }
      // Инициализируем после загрузки
      const init = () => (w['ym'] as YmFn)(Number(id), 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
      const existing = document.querySelector('script[src="https://mc.yandex.ru/metrika/tag.js"]');
      if (existing) { existing.addEventListener('load', init); } else { init(); }
    }).catch(() => {});
  }, []);
  return null;
}

function RevealObserver() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    const attach = () => {
      document.querySelectorAll('.section-reveal').forEach(el => obs.observe(el));
    };
    attach();
    // re-attach on dynamic content
    const mo = new MutationObserver(attach);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { obs.disconnect(); mo.disconnect(); };
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WaterCursor />
      <RevealObserver />
      <YandexMetrika />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/shop" element={<Shop />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;