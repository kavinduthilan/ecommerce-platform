"use client";

import { useEffect, useRef, type CSSProperties } from "react";
// import "./luxury.css";

// Deterministic "random" so server and client render the same dust.
const dust = Array.from({ length: 26 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 97.13 + n * 41.7) * 10000;
    return x - Math.floor(x);
  };
  return {
    left: Math.round(r(1) * 100),
    top: 45 + Math.round(r(2) * 55),
    size: 2 + Math.round(r(3) * 4),
    t: 11 + Math.round(r(4) * 10),
    dl: -Math.round(r(5) * 16),
    x: Math.round((r(6) - 0.5) * 80),
    z: Math.round((r(7) - 0.5) * 160),
    o: (0.35 + Math.round(r(8) * 5) / 10).toFixed(1),
  };
});

/** Drop inside a relatively-positioned section: adds a cursor spotlight and floating gold dust. */
export default function HeroFX() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 70, ty = 40, x = 70, y = 40, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.07;
      y += (ty - y) * 0.07;
      el.style.setProperty("--mx", `${x.toFixed(2)}%`);
      el.style.setProperty("--my", `${y.toFixed(2)}%`);
      raf = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
    };
    const leave = () => { tx = 70; ty = 40; };

    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ perspective: 600 }}
    >
      <div className="spot" />
      {dust.map((d, i) => (
        <span
          key={i}
          className="dust"
          style={
            {
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: d.size,
              height: d.size,
              "--t": `${d.t}s`,
              "--dl": `${d.dl}s`,
              "--x": `${d.x}px`,
              "--z": `${d.z}px`,
              "--o": d.o,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}