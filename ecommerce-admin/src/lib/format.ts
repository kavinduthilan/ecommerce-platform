export const money = (n: number | string) =>
  "Rs. " + Number(n).toLocaleString("en-LK");

export function priceRange(
  variants?: { price: number | string }[] | null
) {
  const prices = (variants ?? [])
    .map((v) => Number(v.price))
    .filter((n) => Number.isFinite(n));

  if (prices.length === 0) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return min === max ? money(min) : `${money(min)} – ${money(max)}`;
}