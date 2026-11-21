"use client";
import { useState } from "react";
import { useCart } from "./CartProvider";

export default function AddButton({
  id,
  variantId,
  maxQty = Infinity,
}: {
  id: string;
  variantId: string;
  maxQty?: number; // available stock for this variant
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const key = `${id}:${variantId}`; // "productId:variantId"

  const atMin = qty <= 1;
  const atMax = qty >= maxQty;

  const handleAdd = () => {
    add(key, Math.min(qty, maxQty));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="mt-8">
      <div className="flex gap-3">
        <div className="flex items-center border border-line bg-card">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={atMin}
            aria-label="Decrease quantity"
            className="size-12 hover:text-gold-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            &minus;
          </button>
          <span className="w-8 text-center" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={atMax}
            aria-label="Increase quantity"
            className="size-12 hover:text-gold-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 bg-ink text-xs uppercase tracking-[0.25em] text-white transition hover:bg-gold-deep"
        >
          {added ? "Added" : "Add to cart"}
        </button>
      </div>

      {atMax && Number.isFinite(maxQty) && (
        <p className="mt-2 text-xs text-muted">
          Maximum available quantity selected ({maxQty}).
        </p>
      )}
    </div>
  );
}