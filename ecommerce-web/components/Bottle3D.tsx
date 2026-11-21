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

/** Thin, clear crystal with a beveled inner edge. */
const glass = (n: FaceName): CSSProperties => {
  const bg =
    n === "front" || n === "back"
      ? "linear-gradient(112deg, rgba(255,255,255,.26) 0%, rgba(255,255,255,.04) 30%, rgba(255,255,255,.015) 62%, rgba(255,255,255,.14) 100%)"
      : n === "top" || n === "bottom"
        ? "rgba(255,255,255,.09)"
        : "linear-gradient(180deg, rgba(255,255,255,.13), rgba(255,255,255,.04))";
  return {
    background: bg,
    border: "1px solid rgba(255,255,255,.30)",
    boxShadow: "inset 0 0 26px rgba(255,255,255,.10)",
    outline: "1px solid rgba(255,255,255,.07)",
    outlineOffset: -7,
    borderRadius: 4,
  };
};

/** Heavy glass base, a touch brighter, like real flacon bottoms. */
const glassBase = (n: FaceName): CSSProperties => ({
  background:
    n === "top" || n === "bottom"
      ? "rgba(255,255,255,.18)"
      : "linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.08))",
  border: "1px solid rgba(255,255,255,.22)",
});

/** Perfume: champagne gold, lit differently on each side. */
const liquid = (n: FaceName): CSSProperties => {
  const tone: Record<FaceName, string> = {
    front: "linear-gradient(180deg,#f6e3a8,#d6b05a 55%,#b88f3e)",
    back: "linear-gradient(180deg,#b88f3e,#8a6a26)",
    left: "linear-gradient(180deg,#dcb966,#a67e30)",
    right: "linear-gradient(180deg,#ecd08a,#bf9440)",
    top: "radial-gradient(circle at 35% 35%,#fff3c9,#e7c673)",
    bottom: "#6f521a",
  };
  return { background: tone[n], opacity: 0.8 };
};

/** Brushed gold. `knurl` adds fine vertical grooves like a luxury cap. */
const metal =
  (knurl: boolean) =>
  (n: FaceName): CSSProperties => {
    const tone: Record<FaceName, string> = {
      front: "linear-gradient(90deg,#7a5c22,#f1d98f 42%,#b38d3c 70%,#8c6c2a)",
      back: "linear-gradient(90deg,#5f4517,#a98532)",
      left: "linear-gradient(90deg,#6e5320,#b38d3c)",
      right: "linear-gradient(90deg,#d0aa55,#f8e8b0 55%,#c29a42)",
      top: "radial-gradient(circle at 38% 38%,#fff1c2,#c9a24d 60%,#8f6c26)",
      bottom: "#4f3a12",
    };
    const grooves =
      knurl && n !== "top" && n !== "bottom"
        ? "repeating-linear-gradient(90deg, rgba(0,0,0,.22) 0 1px, transparent 1px 5px), "
        : "";
    return { background: `${grooves}${tone[n]}`, borderRadius: 2 };
  };

export default function Bottle3D() {
  const scene = useRef<HTMLDivElement>(null);
  const spin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sceneEl = scene.current;
    const el = spin.current;
    if (!sceneEl || !el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const base = reduce ? 0 : 0.18; // slow, unhurried turn
    const REST_TILT = -12;
    let angle = -30;
    let tilt = REST_TILT;
    let targetTilt = REST_TILT;
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
        speed += (base - speed) * 0.025;
      }
      tilt += (targetTilt - tilt) * 0.07;
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
      targetTilt = REST_TILT + ((e.clientY - r.top) / r.height - 0.5) * -12;
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      angle += dx * 0.55;
      speed = dx * 0.55;
    };
    const up = () => {
      dragging = false;
    };
    const leave = () => {
      targetTilt = REST_TILT;
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
    <div className="relative mx-auto w-full max-w-sm select-none">
      {/* warm spotlight */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(214,176,90,.30),rgba(214,176,90,.06)_45%,transparent_70%)]"
      />

      <div
        ref={scene}
        aria-hidden
        className="relative mx-auto h-[300px] w-full cursor-grab touch-pan-y active:cursor-grabbing"
        style={{ perspective: 1200 }}
      >
        {/* contact shadow */}
        <div className="absolute left-1/2 top-[232px] h-7 w-48 -translate-x-1/2 rounded-full bg-black/70 blur-xl" />

        <div
          className="absolute left-0 top-[8px] h-[340px] w-full origin-top scale-[0.76]"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            ref={spin}
            className="absolute inset-0 will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* pedestal rings on the floor */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 308,
                width: 320,
                height: 320,
                marginLeft: -160,
                marginTop: -160,
                borderRadius: "50%",
                transform: "rotateX(90deg)",
                border: "1px solid rgba(214,176,90,.55)",
                background:
                  "radial-gradient(circle, rgba(214,176,90,.22), rgba(214,176,90,.04) 60%, transparent 70%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 308,
                width: 230,
                height: 230,
                marginLeft: -115,
                marginTop: -115,
                borderRadius: "50%",
                transform: "rotateX(90deg)",
                border: "1px solid rgba(214,176,90,.30)",
              }}
            />

            {/* cap */}
            <Box w={56} d={56} h={54} top={0} face={metal(true)} />
            {/* neck */}
            <Box w={28} d={28} h={22} top={52} face={metal(false)} />
            {/* gold collar */}
            <Box w={50} d={50} h={12} top={70} face={metal(false)} />

            {/* crystal body */}
            <Box
              w={150}
              d={100}
              h={226}
              top={82}
              face={glass}
              front={
                <>
                  {/* specular streak */}
                  <div
                    className="absolute bottom-6 left-3 top-6 w-2 blur-[2px]"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent, rgba(255,255,255,.6) 20%, rgba(255,255,255,.15) 80%, transparent)",
                    }}
                  />
                  {/* gold foil label */}
                  <div
                    className="absolute inset-x-6 top-[78px] h-[76px] p-[3px]"
                    style={{
                      background:
                        "linear-gradient(135deg,#f8e8b0,#cfa94f 45%,#8f6c26)",
                      boxShadow: "0 6px 14px rgba(0,0,0,.35)",
                    }}
                  >
                    <div className="grid h-full place-items-center border border-[#171717]/70 bg-[#171717]/90">
                      <div className="text-center">
                        <p className="font-display text-[15px] uppercase tracking-[0.4em] text-[#f1d98f]">
                          Decant
                        </p>
                        <p className="mt-1 text-[7px] uppercase tracking-[0.35em] text-[#f1d98f]/70">
                          Fine fragrance
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              }
            />
            {/* heavy glass base */}
            <Box w={146} d={96} h={28} top={278} face={glassBase} />
            {/* perfume */}
            <Box w={134} d={84} h={146} top={132} face={liquid} />
          </div>
        </div>
      </div>

      <p className="relative -mt-1 text-center text-[10px] uppercase tracking-[0.35em] text-muted-dark">
        Drag to rotate
      </p>
    </div>
  );
}