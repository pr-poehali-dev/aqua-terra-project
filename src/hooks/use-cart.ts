import { useState, useCallback } from 'react';

export interface CartItem {
  name: string;
  price: string;
  priceNum: number;
  icon: string;
  tag: string;
  qty: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  const add = useCallback((product: Omit<CartItem, 'qty' | 'priceNum'>) => {
    const priceNum = parseInt(product.price.replace(/\D/g, ''), 10) || 0;
    setItems((prev) => {
      const existing = prev.find((i) => i.name === product.name);
      if (existing) {
        return prev.map((i) => i.name === product.name ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, priceNum, qty: 1 }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((name: string) => {
    setItems((prev) => prev.filter((i) => i.name !== name));
  }, []);

  const change = useCallback((name: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) => prev.map((i) => i.name === name ? { ...i, qty } : i));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.priceNum * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return { items, open, setOpen, add, remove, change, clear, total, count };
}
