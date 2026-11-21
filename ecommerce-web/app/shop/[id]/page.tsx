import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/product";
import ProductCard from "@/components/ProductCard";
import AddButton from "@/components/AddButton";
import Image from "next/image";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ variant?: string }>;
};

// Always render fresh stock (don't serve a cached page)
export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 5;

const money = (n: number) => "Rs. " + n.toLocaleString("en-LK");

// Available units for one inventory row.
// Uses availableQuantity when present, otherwise quantity - reservedQuantity.
// Never negative, never NaN.
const availableOf = (i: any): number => {
  const avail = i?.availableQuantity;
  const n =
    avail != null && avail !== ""
      ? Number(avail)
      : Number(i?.quantity ?? 0) - Number(i?.reversedQuantity ?? 0);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};

// Total available across all inventory rows (empty array => 0)
const stockOf = (v: any): number =>
  (v?.inventory ?? []).reduce(
    (sum: number, i: any) => sum + availableOf(i),
    0
  );

// Card rule: lowest price among IN-STOCK variants.
// If everything is sold out, fall back to the lowest price and flag soldOut.
const withPrice = (p: any) => {
  const variants = p.productVariants ?? [];
  const inStock = variants.filter((v: any) => stockOf(v) > 0);
  const pool = inStock.length ? inStock : variants;
  return {
    ...p,
    price: Math.min(...pool.map((v: any) => Number(v.price))),
    soldOut: inStock.length === 0,
  };
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await getProduct((await params).id);
  return { title: p?.name ?? "Product" };
}

export default async function ProductPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { variant } = await searchParams;

  console.log('id', id);

  const raw = await getProduct(id);

  console.log('raw', raw);

  if (!raw || !raw.productVariants?.length) notFound();
  const p = withPrice(raw);

  const categoryId = String(raw.categoryId ?? raw.category?.id ?? "all");
  const categoryName = raw.category?.name ?? "Collection";

  // All sizes this product has, cheapest first (with stock)
  const options = raw.productVariants
    .map((v: any) => ({
      id: String(v.id),
      size: v.size?.name ?? v.name ?? `Option ${v.id}`,
      price: Number(v.price),
      stock: stockOf(v),
    }))
    .sort((a: any, b: any) => a.price - b.price);

  console.log("options", options);

  // Selected size from the URL, then first in-stock size, then cheapest
  const selected =
    options.find((o: any) => o.id === variant) ??
    options.find((o: any) => o.stock > 0) ??
    options[0];

  const inStock = selected.stock > 0;

  // Related: same category first, then fill from everything else
  const [sameCat, all] = await Promise.all([
    getProducts(categoryId),
    getProducts("all"),
  ]);
  const related = [...sameCat, ...all]
    .filter((x) => x.id !== p.id && x.productVariants?.length > 0)
    .filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i)
    .slice(0, 4)
    .map(withPrice);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <nav
        aria-label="Breadcrumb"
        className="mb-8 text-xs uppercase tracking-[0.2em] text-muted"
      >
        <Link href="/shop" className="hover:text-ink">
          Shop
        </Link>{" "}
        /{" "}
        <Link href={`/shop?category=${categoryId}`} className="hover:text-ink">
          {categoryName}
        </Link>{" "}
        / <span className="text-ink">{p.name}</span>
      </nav>

      <div className="grid gap-12 md:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden bg-line/40">
          {p.imageUrl ? (
            <Image
              src={`${process.env.API_URL}${p.imageUrl}`}
              alt={p.name}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-xs uppercase tracking-[0.15em] text-muted">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="font-display text-5xl">{p.name}</h1>

          {/* Price of the selected size */}
          <p className="mt-3 text-2xl">{money(selected.price)}</p>

          {/* Stock status of the selected size */}
          <p
            role="status"
            className={`mt-2 text-xs uppercase tracking-[0.15em] ${
              !inStock
                ? "text-red-600"
                : selected.stock <= LOW_STOCK_THRESHOLD
                ? "text-amber-700"
                : "text-green-700"
            }`}
          >
            {!inStock
              ? "Out of stock"
              : selected.stock <= LOW_STOCK_THRESHOLD
              ? `Only ${selected.stock} left`
              : "In stock"}
          </p>

          {/* Size selector */}
          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Size</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {options.map((o: any) => {
                const active = o.id === selected.id;
                const unavailable = o.stock === 0;
                return (
                  <Link
                    key={o.id}
                    href={`/shop/${p.id}?variant=${o.id}`}
                    replace
                    scroll={false}
                    aria-current={active ? "true" : undefined}
                    aria-label={
                      unavailable ? `${o.size}, sold out` : `${o.size}`
                    }
                    className={`min-w-24 border px-5 py-3 text-center text-sm transition ${
                      active
                        ? "border-ink bg-ink text-white"
                        : "border-line hover:border-gold"
                    } ${unavailable && !active ? "opacity-60" : ""}`}
                  >
                    <span className={`block ${unavailable ? "line-through" : ""}`}>
                      {o.size}
                    </span>
                    {unavailable && (
                      <span className="mt-1 block text-[10px] uppercase tracking-wider">
                        Sold out
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {p.description && (
            <p className="mt-8 font-light leading-relaxed text-muted">
              {p.description}
            </p>
          )}

          {/* key resets the button when the size changes */}
          {inStock ? (
            <AddButton
              key={selected.id}
              id={String(p.id)}
              variantId={selected.id}
              maxQty={selected.stock}
            />
          ) : (
            <button
              disabled
              className="mt-8 w-full cursor-not-allowed border border-line bg-line/40 px-6 py-4 text-sm uppercase tracking-[0.2em] text-muted"
            >
              Out of stock
            </button>
          )}

          <p className="mt-4 text-xs uppercase tracking-[0.15em] text-muted">
            Authentic decants · Island-wide delivery
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <>
          <h2 className="mb-8 mt-24 text-center font-display text-4xl">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}