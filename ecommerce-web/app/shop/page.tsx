import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/categories";
import { getProducts } from "@/lib/product";
import ProductCard from "@/components/ProductCard";
export const metadata: Metadata = { title: "Shop" };

const sorts = [
  ["featured", "Featured"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
];

export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category = "all", sort = "featured" } = await searchParams;

  const [categories, apiProducts] = await Promise.all([
    getCategories(),
    getProducts(category),
  ]);

  // Variant prices are strings, so convert them. The card shows the lowest price.
  const list = apiProducts
    .filter((p) => p.productVariants.length > 0)
    .map((p) => ({
      ...p,
      price: Math.min(...p.productVariants.map((v) => Number(v.price))),
    }));


  if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list.sort((a, b) => b.price - a.price);

  const tabs = [
    { id: "all", label: "All" },
    ...categories
      .filter((c: any) => c.status === "Active")
      .map((c: any) => ({ id: String(c.id), label: c.name as string })),
  ];

  const href = (c: string, s: string) => `/shop?category=${c}&sort=${s}`;
  const pill = (on: boolean) =>
    `px-4 py-2 text-xs uppercase tracking-[0.2em] border transition ${
      on ? "border-ink bg-ink text-white" : "border-line bg-card hover:border-gold"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-center font-display text-5xl">The collection</h1>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((c) => (
            <Link key={c.id} href={href(c.id, sort)} className={pill(c.id === category)}>
              {c.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-4 text-xs uppercase tracking-[0.15em] text-muted">
          {sorts.map(([s, l]) => (
            <Link
              key={s}
              href={href(category, s)}
              className={s === sort ? "text-ink underline underline-offset-4" : "hover:text-ink"}
            >
              {l}
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted">{list.length} pieces</p>
      <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}