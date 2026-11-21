import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/categories";
import { getTopSellers } from "@/lib/top-sellers";
import ProductCard from "@/components/ProductCard";
import Bottle3D from "@/components/Bottle3D";
import Tilt from "@/components/Tilt";
import Reveal from "@/components/Reveal";
import HeroFX from "@/components/HeroFX";
import Parallax from "@/components/Parallax";
import NotesRing from "@/components/NotesRing";

const trust = [
  ["100% authentic", "Decanted from sealed, genuine bottles only."],
  ["Hygienic decanting", "Sterile tools and clean, airtight atomizers."],
  ["Island-wide delivery", "Secure packaging, cash on delivery available."],
];

const sizes = [
  ["2ml", "Trial", "Test a scent on skin for a day or two."],
  ["5ml", "Explorer", "Enough to wear it for a couple of weeks."],
  ["10ml", "Travel", "Your signature scent, ready for your bag."],
];

const steps = [
  ["01", "Choose a fragrance", "Browse designer, niche and Arabian scents."],
  ["02", "Pick your size", "2ml, 5ml or 10ml, whatever suits your budget."],
  ["03", "We decant it fresh", "Filled to order from the original bottle."],
  ["04", "Delivered to you", "Carefully packed and sent to your door."],
];

/* ---------- luxury building blocks ---------- */

// Metallic gold lettering with a soft lift underneath
const goldText =
  "bg-linear-to-b from-[#f8e8b0] via-[#d6b05a] to-[#9a7730] bg-clip-text text-transparent drop-shadow-[0_3px_4px_rgba(0,0,0,.35)]";

// Polished gold button: light on top, deep gold below, soft golden glow
const goldBtn =
  "relative inline-block overflow-hidden shine bg-linear-to-b from-[#f4de96] via-[#cfa94f] to-[#a47f33] px-10 py-4 text-xs font-medium uppercase tracking-[0.3em] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,.6),inset_0_-1px_0_rgba(0,0,0,.2),0_12px_28px_-10px_rgba(201,162,77,.65)] transition hover:brightness-110 active:translate-y-px";

const ghostBtn =
  "inline-block border border-gold/50 px-10 py-4 text-xs uppercase tracking-[0.3em] text-gold-light transition hover:border-gold-light hover:bg-gold/10";

// Film grain so the dark sections feel like matte black stock, not flat screen
const grain =
  "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
      style={{ backgroundImage: grain }}
    />
  );
}

function Ornament({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center gap-3 ${className}`}
    >
      <span className="h-px w-16 bg-linear-to-r from-transparent to-gold" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
      <span className="h-px w-16 bg-linear-to-l from-transparent to-gold" />
    </div>
  );
}

export default async function Home() {
  const [categories, topSellers] = await Promise.all([
    getCategories(),
    getTopSellers(),
  ]);

  const whatsapp = "https://wa.me/94XXXXXXXXX"; // replace with your number

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_70%_40%,#2a251d_0%,#141312_60%,#0c0c0b_100%)] text-white">
        <Grain />
        <HeroFX />
        {/* inner gold frame */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 border border-gold/25 sm:inset-6"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-10 py-20 md:grid-cols-2 md:gap-10 md:py-28">
          <Reveal>
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-gold" />
              <p className="text-xs uppercase tracking-[0.4em] text-gold-light">
                Authentic fragrance decants
              </p>
            </div>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
              Try the world&apos;s finest scents,{" "}
              <em className={`${goldText} shimmer-text`}>by the drop.</em>
            </h1>
            <p className="mt-5 max-w-md font-light leading-relaxed text-muted-dark">
              Skip the blind buy. Get 2ml, 5ml and 10ml decants of designer and
              niche perfumes, filled from genuine bottles.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/shop" className={goldBtn}>
                Shop decants
              </Link>
              <Link href="#how-it-works" className={ghostBtn}>
                How it works
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <Parallax>
              <Bottle3D />
            </Parallax>
          </Reveal>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-line bg-card">
        <div className="mx-auto grid max-w-6xl px-5 py-12 text-center md:grid-cols-3 md:divide-x md:divide-line">
          {trust.map(([t, d]) => (
            <div key={t} className="px-8 py-4 md:py-0">
              <h3 className="font-display text-xl">{t}</h3>
              <p className="mx-auto mt-2 max-w-[16rem] text-sm font-light leading-relaxed text-muted">
                {d}
              </p>
            </div>
          ))}
        </div>
      </section>

      <NotesRing />

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <p className="text-center text-xs uppercase tracking-[0.4em] text-gold-deep">
          Find your scent
        </p>
        <h2 className="mt-4 text-center font-display text-4xl sm:text-5xl">
          Shop by category
        </h2>
        <Ornament className="mt-6" />
        <div className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-3">
          {categories.map((c: any, i: number) => (
            <Reveal key={c.id} delay={(i % 3) * 0.12} className="h-full">
            <Tilt className="h-full">
              <Link
                href={`/shop?category=${c.id}`}
                className="group relative block h-full border border-line bg-card p-4 text-center shadow-[inset_0_1px_0_#fff,0_14px_28px_-18px_rgba(0,0,0,.4)] transition hover:border-gold"
              >
                {/* gold hairline along the top edge */}
                <span
                  aria-hidden
                  className="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-gold to-transparent opacity-0 transition group-hover:opacity-100"
                />
                <div className="relative aspect-square w-full overflow-hidden bg-line/40 shadow-[inset_0_2px_10px_rgba(0,0,0,.2)]">
                  {c.imageUrl ? (
                    <Image
                      src={`${process.env.API_URL}${c.imageUrl}`}
                      alt={c.name}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs uppercase tracking-[0.15em] text-muted">
                      No image
                    </div>
                  )}
                </div>
                <h3 className="mt-5 font-display text-2xl">{c.name}</h3>
              </Link>
            </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="mb-12 flex items-end justify-between border-b border-line pb-5">
          <h2 className="font-display text-4xl sm:text-5xl">Top Sellers</h2>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.25em] text-gold-deep hover:underline"
          >
            View all
          </Link>
        </div>
        {topSellers.length === 0 ? (
          <p className="text-muted">New fragrances arriving soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {topSellers.map((p: any, i: number) => (
              <Reveal key={p.id} delay={(i % 4) * 0.1} className="h-full">
                <Tilt className="h-full">
                  <ProductCard p={p} />
                </Tilt>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Sizes (dark, jewellery-box feel) */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,#26221b_0%,#141312_70%)] text-white">
        <Grain />
        <div className="relative mx-auto max-w-6xl px-5 py-24">
          <h2 className="text-center font-display text-4xl sm:text-5xl">
            Choose your size
          </h2>
          <Ornament className="mt-6" />
          <p className="mx-auto mt-6 max-w-md text-center text-sm font-light leading-relaxed text-muted-dark">
            Every fragrance is available in three sizes, so you can wear it
            before you commit to a full bottle.
          </p>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {sizes.map(([ml, name, desc], i) => (
              <Reveal key={ml} delay={i * 0.14}>
              <Tilt max={9}>
                <div className="border border-gold/30 bg-linear-to-b from-white/[0.07] to-white/[0.01] p-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.10),0_30px_50px_-28px_rgba(0,0,0,.9)] transition hover:border-gold">
                  <p className={`font-display text-6xl ${goldText}`}>{ml}</p>
                  <h3 className="mt-4 text-xs uppercase tracking-[0.3em] text-gold-light">
                    {name}
                  </h3>
                  <p className="mx-auto mt-4 max-w-[15rem] text-sm font-light leading-relaxed text-muted-dark">
                    {desc}
                  </p>
                </div>
              </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="text-center font-display text-4xl sm:text-5xl">
          How it works
        </h2>
        <Ornament className="mt-6" />
        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 0.12} className="text-center">
              <p className={`font-display text-5xl ${goldText}`}>{n}</p>
              <h3 className="mt-4 font-display text-xl">{t}</h3>
              <p className="mx-auto mt-2 max-w-[14rem] text-sm font-light leading-relaxed text-muted">
                {d}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_50%_100%,#2a251d_0%,#141312_70%)] text-white">
        <Grain />
        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center">
          <Ornament />
          <h2 className="mt-8 font-display text-4xl sm:text-5xl">
            Not sure what to pick?
          </h2>
          <p className="mt-5 font-light leading-relaxed text-muted-dark">
            Tell us the scents you love and we&apos;ll recommend a few to try.
          </p>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-10 ${goldBtn}`}
          >
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}