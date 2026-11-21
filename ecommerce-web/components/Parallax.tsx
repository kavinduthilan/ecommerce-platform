"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** The hero bottle drifts down and leans back as the page scrolls. */
export default function Parallax({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 900);
        el.style.transform = `translate3d(0,${(y * 0.14).toFixed(1)}px,0) rotateX(${(y * 0.012).toFixed(2)}deg) scale(${(1 - y * 0.00008).toFixed(3)})`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className="will-change-transform [transform-style:preserve-3d]">
      {children}
    </div>
  );
}