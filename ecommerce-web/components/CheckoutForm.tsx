"use client";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { placeOrder, type CheckoutState } from "@/lib/order";

const field =
  "mt-2 w-full border border-line bg-card px-4 py-3 text-sm outline-none transition focus:border-gold";
const label = "text-xs uppercase tracking-[0.1em] text-muted";

export default function CheckoutForm({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const { clear } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});

  useEffect(() => {
    if (state.ok) {
      clear();
      router.replace(`/order-success${state.orderId ? `?id=${state.orderId}` : ""}`);
    }
  }, [state.ok, state.orderId, clear, router]);

  const v = state.values ?? {};

  return (
    <form action={action} className="space-y-2">
      <h2 className="font-display text-2xl">Delivery details</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Full name</span>
          <input name="name" defaultValue={v.name} required autoComplete="name" className={field} />
        </label>
        <label className="block">
          <span className={label}>Phone</span>
          <input name="phone" defaultValue={v.phone} required type="tel" autoComplete="tel" className={field} />
        </label>
      </div>

      <label className="block">
        <span className={label}>Email (optional)</span>
        <input name="email" defaultValue={v.email} type="email" autoComplete="email" className={field} />
      </label>

      <label className="block">
        <span className={label}>Address</span>
        <input name="address" defaultValue={v.address} required autoComplete="street-address" className={field} />
      </label>

      <label className="block">
        <span className={label}>City</span>
        <input name="city" defaultValue={v.city} required autoComplete="address-level2" className={field} />
      </label>

      <label className="block">
        <span className={label}>Order notes (optional)</span>
        <textarea name="notes" defaultValue={v.notes} rows={3} className={field} />
      </label>

      <div className="border border-line bg-card p-5">
        <p className={label}>Payment</p>
        <p className="mt-2 text-sm">Cash on delivery</p>
      </div>

      {state.error && (
        <div role="alert" className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{state.error}</p>
          <Link href="/cart" className="mt-2 inline-block underline">
            Review your cart
          </Link>
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || pending || state.ok}
        className="w-full bg-ink py-4 text-xs uppercase tracking-[0.25em] text-white transition hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled
          ? "Update cart to continue"
          : pending
          ? "Placing order…"
          : "Place order"}
      </button>
    </form>
  );
}