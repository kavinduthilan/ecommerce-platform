import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Our story" };

const values = [
  ["Authentic", "Every decant comes from a genuine, sealed bottle. No dupes, no refills, no shortcuts."],
  ["Carefully Decanted", "Filled by hand into clean glass atomizers, labelled with the fragrance name and batch."],
  ["Try Before You Commit", "Sample 2ml, 5ml or 10ml first, and find your signature scent without paying for a full bottle."],
];

export default function About() {
  return (
    <>
      <section className="bg-ink px-5 py-24 text-center text-white">
        <p className="text-xs uppercase tracking-[0.35em] text-gold-light">Our story</p>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-5xl sm:text-6xl">Find your scent before you buy the bottle.</h1>
      </section>
      <section className="mx-auto max-w-2xl space-y-5 px-5 py-20 text-lg font-light leading-relaxed text-muted">
        <p>Aurelia began with a simple frustration: buying a full bottle of perfume on a hunch, only to find it wasn't quite right on your skin. We wanted a way to explore great fragrances without the risk or the price.</p>
        <p>So we decant authentic perfumes into small, travel-friendly sizes. You can wear a scent for a few weeks, see how it lasts and how it changes through the day, and only then decide if it deserves a place on your shelf.</p>
      </section>
      <section className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 text-center md:grid-cols-3">
          {values.map(([t, d]) => (
            <div key={t}>
              <h2 className="font-display text-3xl">{t}</h2>
              <p className="mt-3 text-sm font-light text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="px-5 py-20 text-center">
        <Link href="/shop" className="inline-block bg-ink px-8 py-4 text-xs uppercase tracking-[0.25em] text-white transition hover:bg-gold-deep">
          Explore the collection
        </Link>
      </div>
    </>
  );
}