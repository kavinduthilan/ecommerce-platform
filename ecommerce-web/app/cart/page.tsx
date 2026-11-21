import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { getProduct } from "@/lib/product";
import CartControls, { CheckoutButton } from "@/components/CartControls";
import { money } from "@/lib/money";

const FREE_OVER = 500;

// Total available across all inventory rows (empty array => 0)
const stockOf = (v: any): number =>
  (v.inventory ?? []).reduce(
    (sum: number, i: any) => sum + Number(i.availableQuantity ?? 0),
    0
  );

export default async function CartPage() {
  const raw = (await cookies()).get("aurelia-cart")?.value;
  let cart: Record<string, number> = {};
  try {
    cart = raw ? JSON.parse(raw) : {};
  } catch {}

  const items = Object.entries(cart).map(([key, q]) => {
    const [productId, variantId] = key.split(":");
    return { key, productId, variantId, q };
  });

  // fetch each product once, even if several of its variants are in the cart
  const productIds = [...new Set(items.map((i) => i.productId))];
  const fetched = await Promise.all(
    productIds.map((id) => getProduct(id).catch(() => null))
  );
  const productMap = new Map(productIds.map((id, i) => [id, fetched[i]]));

  const lines = items.flatMap(({ key, productId, variantId, q }) => {
    const p = productMap.get(productId);
    const variant = p?.productVariants?.find(
      (v: any) => String(v.id) === variantId
    );
    if (!p || !variant) return [];

    const available = stockOf(variant);
    return [
      {
        key,
        p,
        variant,
        q,
        unit: Number(variant.price),
        available,
        soldOut: available === 0,
        short: available > 0 && q > available,
      },
    ];
  });

  // Only lines that can actually be bought count towards the total
  const buyable = lines.filter((l) => !l.soldOut);
  const subtotal = buyable.reduce((s, l) => s + l.unit * Math.min(l.q, l.available), 0);
  const shipping = subtotal === 0 || subtotal >= FREE_OVER ? 0 : 25;

  const blocked = lines.some((l) => l.soldOut || l.short);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="font-display text-5xl">Your cart</h1>
      {!lines.length ? (
        <div className="mt-12 border border-line bg-card py-20 text-center">
          <p className="font-display text-3xl">Your cart is empty</p>
          <Link
            href="/shop"
            className="mt-8 inline-block bg-ink px-8 py-3.5 text-xs uppercase tracking-[0.25em] text-white hover:bg-gold-deep"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          {blocked && (
            <div
              role="alert"
              className="mt-8 border border-red-600/40 bg-red-50 p-5 text-sm text-red-700"
            >
              Some items are unavailable or have limited stock. Remove them or
              lower the quantity to continue to checkout.
            </div>
          )}

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
            <ul className="divide-y divide-line border-y border-line">
              {lines.map(
                ({ key, p, variant, q, unit, available, soldOut, short }) => (
                  <li
                    key={key}
                    className="grid grid-cols-[80px_1fr_auto] items-center gap-5 py-6"
                  >
                    <Link
                      href={`/shop/${p.id}`}
                      className={`relative block size-20 overflow-hidden bg-linear-to-br from-[#f4eee2] to-[#e6d8bd] ${
                        soldOut ? "opacity-50" : ""
                      }`}
                    >
                      {p.imageUrl && (
                        <Image
                          src={`${process.env.API_URL}${p.imageUrl}`}
                          alt={p.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </Link>
                    <div>
                      <Link
                        href={`/shop/${p.id}`}
                        className="font-display text-xl hover:text-gold-deep"
                      >
                        {variant.name}
                      </Link>
                      <p className="text-sm text-muted">
                        SKU {variant.sku} · {money(unit)}
                      </p>

                      {soldOut && (
                        <p className="mt-1 text-xs text-red-600">
                          Out of stock. Remove it to continue.
                        </p>
                      )}
                      {short && (
                        <p className="mt-1 text-xs text-red-600">
                          Only {available} left. Lower the quantity to continue.
                        </p>
                      )}
                      {!soldOut && !short && available <= 5 && (
                        <p className="mt-1 text-xs text-muted">
                          Only {available} left
                        </p>
                      )}

                      {/* max stops the + button going past available stock */}
                      <CartControls id={key} qty={q} max={available} />
                    </div>
                    <b
                      className={`font-medium ${
                        soldOut ? "text-muted line-through" : ""
                      }`}
                    >
                      {money(unit * q)}
                    </b>
                  </li>
                )
              )}
            </ul>

            <aside className="h-fit border border-line bg-card p-6">
              <h2 className="font-display text-2xl">Order summary</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd>{shipping ? money(shipping) : "Complimentary"}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
                  <dt>Total</dt>
                  <dd>{money(subtotal + shipping)}</dd>
                </div>
              </dl>
              {shipping > 0 && (
                <p className="mt-4 text-xs text-muted">
                  Add {money(FREE_OVER - subtotal)} more for complimentary
                  shipping.
                </p>
              )}
              <CheckoutButton disabled={blocked} />
            </aside>
          </div>
        </>
      )}
    </div>
  );
}