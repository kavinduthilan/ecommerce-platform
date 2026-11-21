import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCartLines, getTotals } from "@/lib/cart";
import { money } from "@/lib/money";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata = { title: "Checkout" };

// Total available across all inventory rows (empty array => 0)
const stockOf = (v: any): number =>
  (v.inventory ?? []).reduce(
    (sum: number, i: any) => sum + Number(i.availableQuantity ?? 0),
    0
  );

export default async function CheckoutPage() {
  const lines = await getCartLines();
  if (!lines.length) redirect("/cart");
  const { subtotal, shipping, total } = getTotals(lines);

  // Flag lines the shop can't fulfil right now
  const checked = lines.map((l: any) => {
    const available = stockOf(l.variant);
    return {
      ...l,
      available,
      soldOut: available === 0,
      short: available > 0 && l.q > available,
    };
  });
  const problems = checked.filter((l: any) => l.soldOut || l.short);
  const blocked = problems.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="font-display text-5xl">Checkout</h1>

      {blocked && (
        <div
          role="alert"
          className="mt-8 border border-red-600/40 bg-red-50 p-5 text-sm text-red-700"
        >
          <p className="font-medium">
            Some items in your cart are no longer available.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {problems.map((l: any) => (
              <li key={l.key}>
                {l.variant.name}:{" "}
                {l.soldOut ? "out of stock" : `only ${l.available} left`}
              </li>
            ))}
          </ul>
          <Link href="/cart" className="mt-3 inline-block underline">
            Update your cart
          </Link>
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Disable submit inside the form when blocked */}
        <CheckoutForm disabled={blocked} />

        <aside className="h-fit border border-line bg-card p-6">
          <h2 className="font-display text-2xl">Your order</h2>

          <ul className="mt-5 divide-y divide-line">
            {checked.map(({ key, p, variant, q, unit, soldOut, short, available }: any) => (
              <li key={key} className="flex items-center gap-4 py-4">
                <div className="relative size-14 shrink-0 overflow-hidden bg-line/40">
                  {p.imageUrl && (
                    <Image
                      src={`${process.env.API_URL}${p.imageUrl}`}
                      alt={p.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{variant.name}</p>
                  <p className="text-xs text-muted">
                    Qty {q} · {money(unit)}
                  </p>
                  {(soldOut || short) && (
                    <p className="text-xs text-red-600">
                      {soldOut ? "Out of stock" : `Only ${available} left`}
                    </p>
                  )}
                </div>
                <span className="text-sm">{money(unit * q)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
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
              <dd>{money(total)}</dd>
            </div>
          </dl>

          <Link
            href="/cart"
            className="mt-5 block text-center text-xs uppercase tracking-[0.2em] text-muted hover:text-ink"
          >
            Edit cart
          </Link>
        </aside>
      </div>
    </div>
  );
}