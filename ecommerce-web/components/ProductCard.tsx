import Link from "next/link";
import Image from "next/image";
import { ApiProduct } from "@/lib/product";
import { priceRange } from "@/lib/money";

export default function ProductCard({ p }: { p: ApiProduct }) {
  const price = priceRange(p.productVariants);
  const href = `/shop/${p.id}`;

  return (
    <article>
      <Link href={href} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-linear-to-br from-[#f4eee2] to-[#e6d8bd]">
          {p.imageUrl && (
            <Image
              src={`${process.env.API_URL}${p.imageUrl}`}
              alt={p.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          )}
        </div>
        <h3 className="mt-4 font-display text-xl">{p.name}</h3>
        <p className="text-sm text-muted">{price ?? "Price unavailable"}</p>
      </Link>
      <Link
        href={href}
        aria-label={`Select options for ${p.name}`}
        className="mt-3 block w-full border border-ink py-2.5 text-center text-xs uppercase tracking-[0.2em] transition hover:bg-ink hover:text-white"
      >
        View options
      </Link>
    </article>
  );
}