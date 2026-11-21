"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type FaceName = "front" | "back" | "left" | "right" | "top" | "bottom";

/** A true 3D cuboid built from six CSS faces. */
function Box({
  w,
  d,
  h,
  top,
  face,
  front,
}: {
  w: number;
  d: number;
  h: number;
  top: number;
  face: (name: FaceName) => CSSProperties;
  front?: ReactNode;
}) {
  const geometry: Record<FaceName, CSSProperties> = {
    front: { width: w, height: h, transform: `translateZ(${d / 2}px)` },
    back: { width: w, height: h, transform: `rotateY(180deg) translateZ(${d / 2}px)` },
    right: { width: d, height: h, left: (w - d) / 2, transform: `rotateY(90deg) translateZ(${w / 2}px)` },
    left: { width: d, height: h, left: (w - d) / 2, transform: `rotateY(-90deg) translateZ(${w / 2}px)` },
    top: { width: w, height: d, top: (h - d) / 2, transform: `rotateX(90deg) translateZ(${h / 2}px)` },
    bottom: { width: w, height: d, top: (h - d) / 2, transform: `rotateX(-90deg) translateZ(${h / 2}px)` },
  };
  const names: FaceName[] = ["front", "back", "left", "right", "top", "bottom"];

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top,
        width: w,
        height: h,
        marginLeft: -w / 2,
        transformStyle: "preserve-3d",
      }}
    >
      {names.map((n) => (
        <div
          key={n}
          style={{ position: "absolute", top: 0, left: 0, ...geometry[n], ...face(n) }}
        >
          {n === "front" ? front : null}
        </div>
      ))}
    </div>
  );
}

const glass = (n: FaceName): CSSProperties => {
  const sheen =
    n === "front" || n === "back"
      ? "linear-gradient(115deg, rgba(255,255,255,.30) 0%, rgba(255,255,255,.05) 35%, rgba(255,255,255,.02) 60%, rgba(255,255,255,.16) 100%)"
      : n === "top" || n === "bottom"
        ? "rgba(255,255,255,.10)"
        : "linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.05))";
  return {
    background: sheen,
    border: "1px solid rgba(255,255,255,.28)",
    boxShadow: "inset 0 0 22px rgba(255,255,255,.10)",
    borderRadius: 6,
  };
};

const liquid = (n: FaceName): CSSProperties => {
  const tone: Record<FaceName, string> = {
    front: "linear-gradient(180deg,#f0d28a,#c9a24d)",
    back: "linear-gradient(180deg,#b88f3e,#8f6c26)",
    left: "linear-gradient(180deg,#d9b563,#a67e30)",
    right: "linear-gradient(180deg,#e6c673,#b58a38)",
    top: "#f7e1a6",
    bottom: "#7a5b1e",
  };
  return { background: tone[n], opacity: 0.78 };
};

const metal = (n: FaceName): CSSProperties => {
  const tone: Record<FaceName, string> = {
    front: "linear-gradient(90deg,#8c6c2a,#e8cb83 45%,#a8843a)",
    back: "linear-gradient(90deg,#6f531c,#b8944a)",
    left: "linear-gradient(90deg,#7b5d22,#a8843a)",
    right: "linear-gradient(90deg,#c9a24d,#f2dc9a)",
    top: "radial-gradient(circle at 40% 40%,#f6e3a8,#b8944a)",
    bottom: "#5c4416",
  };
  return { background: tone[n], borderRadius: 3 };
};

export default function Bottle3D() {
  const scene = useRef<HTMLDivElement>(null);
  const spin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sceneEl = scene.current;
    const el = spin.current;
    if (!sceneEl || !el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const base = reduce ? 0 : 0.3;
    let angle = -28;
    let tilt = -8;
    let targetTilt = -8;
    let speed = base;
    let dragging = false;
    let lastX = 0;
    let raf = 0;

    const draw = () => {
      el.style.transform = `rotateX(${tilt}deg) rotateY(${angle}deg)`;
    };

    const tick = () => {
      if (!dragging) {
        angle += speed;
        speed += (base - speed) * 0.03;
      }
      tilt += (targetTilt - tilt) * 0.08;
      draw();
      raf = requestAnimationFrame(tick);
    };

    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      sceneEl.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const r = sceneEl.getBoundingClientRect();
      targetTilt = -8 + ((e.clientY - r.top) / r.height - 0.5) * -14;
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      angle += dx * 0.6;
      speed = dx * 0.6;
    };
    const up = () => {
      dragging = false;
    };
    const leave = () => {
      targetTilt = -8;
    };

    sceneEl.addEventListener("pointerdown", down);
    sceneEl.addEventListener("pointermove", move);
    sceneEl.addEventListener("pointerup", up);
    sceneEl.addEventListener("pointercancel", up);
    sceneEl.addEventListener("pointerleave", leave);

    draw();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      sceneEl.removeEventListener("pointerdown", down);
      sceneEl.removeEventListener("pointermove", move);
      sceneEl.removeEventListener("pointerup", up);
      sceneEl.removeEventListener("pointercancel", up);
      sceneEl.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-md select-none">
      {/* spotlight */}
      <div
        aria-hidden
        className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_50%_42%,rgba(201,162,77,.28),transparent_62%)]"
      />

      <div
        ref={scene}
        aria-hidden
        className="relative mx-auto h-[400px] w-full cursor-grab touch-pan-y active:cursor-grabbing"
        style={{ perspective: 1100 }}
      >
        {/* floor shadow (stays flat while the bottle turns) */}
        <div
          className="absolute bottom-[34px] left-1/2 h-8 w-56 -translate-x-1/2 rounded-full bg-black/60 blur-xl"
        />

        <div
          className="absolute left-0 top-[26px] h-[340px] w-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            ref={spin}
            className="absolute inset-0 will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* cap */}
            <Box w={50} d={50} h={50} top={4} face={metal} />
            {/* neck */}
            <Box w={30} d={30} h={22} top={54} face={metal} />
            {/* glass body */}
            <Box
              w={150}
              d={100}
              h={232}
              top={76}
              face={glass}
              front={
                <div className="absolute inset-x-6 top-[88px] grid h-[64px] place-items-center border border-[#e8cb83]/70 bg-[#171717]/85 text-center">
                  <span className="font-display text-[15px] uppercase tracking-[0.35em] text-[#f0d28a]">
                    Decant
                  </span>
                </div>
              }
            />
            {/* perfume inside the glass */}
            <Box w={136} d={86} h={158} top={142} face={liquid} />
          </div>
        </div>
      </div>

      <p className="relative -mt-2 text-center text-[10px] uppercase tracking-[0.3em] text-muted-dark">
        Drag to rotate
      </p>
    </div>
  );
}