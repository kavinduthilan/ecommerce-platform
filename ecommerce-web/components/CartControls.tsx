"use client";
import { useCart } from "./CartProvider";
import Link from "next/link";

export default function CartControls({
  id,
  qty,
  max,
}: {
  id: string;
  qty: number;
  max?: number; // available stock; omit for no limit
}) {
  const { change, remove } = useCart();
  const atMax = max !== undefined && qty >= max;

  return (
    <div className="mt-2 flex items-center gap-3 text-sm">
      <button
        onClick={() => change(id, -1)}
        aria-label="Decrease quantity"
        className="size-8 border border-line hover:border-ink"
      >
        &minus;
      </button>
      <span>{qty}</span>
      <button
        onClick={() => change(id, 1)}
        disabled={atMax}
        aria-label="Increase quantity"
        title={atMax ? "No more stock available" : undefined}
        className="size-8 border border-line hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line"
      >
        +
      </button>
      <button
        onClick={() => remove(id)}
        className="ml-3 text-xs uppercase tracking-[0.15em] text-muted underline hover:text-ink"
      >
        Remove
      </button>
    </div>
  );
}

export function CheckoutButton({ disabled = false }: { disabled?: boolean }) {
  const base =
    "mt-6 block w-full py-4 text-center text-xs uppercase tracking-[0.25em] text-white";

  if (disabled) {
    return (
      <span
        role="link"
        aria-disabled="true"
        className={`${base} cursor-not-allowed bg-ink opacity-50`}
      >
        Update cart to continue
      </span>
    );
  }

  return (
    <Link
      href="/checkout"
      className={`${base} bg-ink transition hover:bg-gold-deep`}
    >
      Proceed to checkout
    </Link>
  );
}