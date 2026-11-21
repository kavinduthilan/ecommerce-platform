import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/categories";
import { getTopSellers } from "@/lib/top-sellers";
import ProductCard from "@/components/ProductCard";
import Bottle3D from "@/components/Bottle3D";
import Tilt from "@/components/Tilt";

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

// Stacked text-shadow = extruded 3D numerals
const extrude =
  "[text-shadow:1px_1px_0_rgba(0,0,0,.14),2px_2px_0_rgba(0,0,0,.12),3px_3px_0_rgba(0,0,0,.10),4px_4px_0_rgba(0,0,0,.08),6px_10px_14px_rgba(0,0,0,.22)]";

// Chunky "physical" gold button: darker underside that presses down on click
const button3d =
  "bg-gold px-8 py-4 text-xs uppercase tracking-[0.25em] text-ink shadow-[0_5px_0_#7d6428,0_14px_22px_-6px_rgba(0,0,0,.55)] transition hover:bg-gold-light active:translate-y-[3px] active:shadow-[0_2px_0_#7d6428,0_6px_10px_-4px_rgba(0,0,0,.55)]";

export default async function Home() {
  const [categories, topSellers] = await Promise.all([
    getCategories(),
    getTopSellers(),
  ]);

  const whatsapp = "https://wa.me/94XXXXXXXXX"; // replace with your number

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden bg-ink text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gold-light">
              Authentic fragrance decants
            </p>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] sm:text-7xl">
              Try the world&apos;s finest scents,{" "}
              <em className="text-gold-light">by the drop.</em>
            </h1>
            <p className="mt-6 max-w-md font-light text-muted-dark">
              Skip the blind buy. Get 2ml, 5ml and 10ml decants of designer and
              niche perfumes, filled from genuine bottles.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/shop" className={button3d}>
                Shop decants
              </Link>
              <Link
                href="#how-it-works"
                className="border border-white/30 px-8 py-4 text-xs uppercase tracking-[0.25em] transition hover:border-gold-light"
              >
                How it works
              </Link>
            </div>
          </div>

          <Bottle3D />
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-line bg-card shadow-[0_18px_30px_-24px_rgba(0,0,0,.35)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-center md:grid-cols-3">
          {trust.map(([t, d]) => (
            <div key={t}>
              <h3 className="font-display text-xl">{t}</h3>
              <p className="mt-1 text-sm font-light text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-gold-deep">
          Find your scent
        </p>
        <h2 className="mt-3 text-center font-display text-4xl">
          Shop by category
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {categories.map((c: any) => (
            <Tilt key={c.id} className="h-full">
              <Link
                href={`/shop?category=${c.id}`}
                className="group block h-full border border-line bg-card p-4 text-center shadow-[inset_0_1px_0_#fff,0_10px_20px_-14px_rgba(0,0,0,.35)] transition hover:border-gold"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-line/40 shadow-[inset_0_2px_8px_rgba(0,0,0,.18)]">
                  {c.imageUrl ? (
                    <Image
                      src={`${process.env.API_URL}${c.imageUrl}`}
                      alt={c.name}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs uppercase tracking-[0.15em] text-muted">
                      No image
                    </div>
                  )}
                </div>
                <h3 className="mt-4 font-display text-2xl">{c.name}</h3>
              </Link>
            </Tilt>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-4xl">Top Sellers</h2>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.2em] text-gold-deep hover:underline"
          >
            View all
          </Link>
        </div>
        {topSellers.length === 0 ? (
          <p className="text-muted">New fragrances arriving soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {topSellers.map((p: any) => (
              <Tilt key={p.id} className="h-full">
                <ProductCard p={p} />
              </Tilt>
            ))}
          </div>
        )}
      </section>

      {/* Sizes */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-center font-display text-4xl">
            Choose your size
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm font-light text-muted">
            Every fragrance is available in three sizes, so you can wear it
            before you commit to a full bottle.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {sizes.map(([ml, name, desc]) => (
              <Tilt key={ml} max={9}>
                <div className="border border-line bg-white p-8 text-center shadow-[inset_0_1px_0_#fff,0_14px_24px_-16px_rgba(0,0,0,.35)] transition hover:border-gold">
                  <p className={`font-display text-5xl text-gold-deep ${extrude}`}>
                    {ml}
                  </p>
                  <h3 className="mt-3 text-xs uppercase tracking-[0.25em]">
                    {name}
                  </h3>
                  <p className="mt-3 text-sm font-light text-muted">{desc}</p>
                </div>
              </Tilt>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-center font-display text-4xl">How it works</h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([n, t, d]) => (
            <div key={n} className="text-center">
              <p className={`font-display text-4xl text-gold ${extrude}`}>{n}</p>
              <h3 className="mt-3 font-display text-xl">{t}</h3>
              <p className="mt-2 text-sm font-light text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="font-display text-4xl">Not sure what to pick?</h2>
          <p className="mt-4 font-light text-muted-dark">
            Tell us the scents you love and we&apos;ll recommend a few to try.
          </p>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-8 inline-block ${button3d}`}
          >
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}