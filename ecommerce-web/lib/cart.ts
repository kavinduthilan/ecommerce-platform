import { cookies } from "next/headers";
import { getProduct } from "@/lib/product";

export const FREE_OVER = 500;
export const SHIPPING_FEE = 25;

export async function readCart(): Promise<Record<string, number>> {
  const raw = (await cookies()).get("aurelia-cart")?.value;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function getCartLines() {
  const cart = await readCart();
  const items = Object.entries(cart).map(([key, q]) => {
    const [productId, variantId] = key.split(":");
    return { key, productId, variantId, q };
  });

  const productIds = [...new Set(items.map((i) => i.productId))];
  const fetched = await Promise.all(productIds.map((id) => getProduct(id).catch(() => null)));
  const productMap = new Map(productIds.map((id, i) => [id, fetched[i]]));

  return items.flatMap(({ key, productId, variantId, q }) => {
    const p = productMap.get(productId);
    const variant = p?.productVariants?.find((v: any) => String(v.id) === variantId);
    if (!p || !variant) return [];
    return [{ key, p, variant, q, unit: Number(variant.price) }];
  });
}

export function getTotals(lines: { unit: number; q: number }[]) {
  const subtotal = lines.reduce((s, l) => s + l.unit * l.q, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_OVER ? 0 : SHIPPING_FEE;
  return { subtotal, shipping, total: subtotal + shipping };
}