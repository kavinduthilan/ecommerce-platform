"use client";
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

const KEY = "aurelia-cart";

type Cart = Record<string, number>;
type Ctx = {
  cart: Cart; count: number;
  add: (id: string, q?: number) => void; change: (id: string, d: number) => void;
  remove: (id: string) => void; clear: () => void; toast: (m: string) => void;
};
const CartCtx = createContext<Ctx | null>(null);
export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
};

function sanitize(v: unknown): Cart {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Cart = {};

  for (const [k, q] of Object.entries(v as Record<string, unknown>)) {
    if (typeof q === "number" && Number.isFinite(q) && q > 0) out[k] = Math.floor(q);
  }
  return out;
}

function readCookieRaw(): string | undefined {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(KEY + "="));
  return hit ? hit.slice(KEY.length + 1) : undefined;
}

function loadCart(): Cart {
  try {
    const raw = readCookieRaw();
    if (raw) return sanitize(JSON.parse(decodeURIComponent(raw)));
    // one-time migration from the old localStorage cart
    const old = localStorage.getItem(KEY);

    if (old) {
      localStorage.removeItem(KEY);
      return sanitize(JSON.parse(old));
    }
  } catch {}
  return {};
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>({});
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // load once on mount
  useEffect(() => {
    setCart(loadCart());
    setLoaded(true);
    return () => clearTimeout(timer.current);
  }, []);


  // persist to cookie, and refresh server components only if it actually changed
  useEffect(() => {
    if (!loaded) return;
    const next = encodeURIComponent(JSON.stringify(cart));
    if (readCookieRaw() === next) return;
    document.cookie = `${KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [cart, loaded, router]);

  const toast = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 2000);
  }, []);

  const add = useCallback((id: string, q = 1) => {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + q }));
    toast("Added to your cart");
  }, [toast]);

  const change = useCallback((id: string, d: number) => {
    setCart((c) => {
      const n = { ...c };
      const q = (c[id] || 0) + d;
      if (q <= 0) delete n[id];
      else n[id] = q;
      return n;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setCart((c) => {
      const n = { ...c };
      delete n[id];
      return n;
    });
  }, []);

  const clear = useCallback(() => setCart({}), []);

  const count = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

  const value = useMemo(
    () => ({ cart, count, add, change, remove, clear, toast }),
    [cart, count, add, change, remove, clear, toast]
  );

  return (
    <CartCtx.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-gold bg-ink px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition ${msg ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        {msg}
      </div>
    </CartCtx.Provider>
  );
}