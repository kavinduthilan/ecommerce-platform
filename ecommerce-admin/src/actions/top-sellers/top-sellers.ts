import "server-only";
import { prisma } from "@lib/prisma";

export type TopSeller = {
  id: number; // product id
  name: string;
  description: string;
  imageUrl: string;
  category: { id: number; name: string };
  brand: { id: number; name: string };
  productVariants: { id: number; name: string; sku: string; price: number }[];
  sold: number;
};

export async function getTopSellers(limit = 4): Promise<TopSeller[]> {
  // Units sold per variant, ignoring cancelled and refunded orders
  const grouped = await prisma.orderItem.groupBy({
    by: ["productVariantId"],
    where: { order: { status: { notIn: ["CANCELLED", "REFUNDED"] } } },
    _sum: { quantity: true },
  });

  if (grouped.length === 0) return [];

  // Map variants to their products so sales can be summed per product
  const variantRows = await prisma.productVariant.findMany({
    where: { id: { in: grouped.map((g) => g.productVariantId) } },
    select: { id: true, productId: true },
  });
  const productOfVariant = new Map(variantRows.map((v) => [v.id, v.productId]));

  const soldByProduct = new Map<number, number>();
  for (const g of grouped) {
    const productId = productOfVariant.get(g.productVariantId);
    if (productId === undefined) continue;
    soldByProduct.set(
      productId,
      (soldByProduct.get(productId) ?? 0) + (g._sum.quantity ?? 0)
    );
  }

  const topIds = [...soldByProduct.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0]) 
    .slice(0, limit)
    .map(([id]) => id);

  if (topIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: topIds }, status: "Active" },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      category: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      productVariants: {
        where: { status: "Active" },
        select: { id: true, name: true, sku: true, price: true },
      },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  // Keep the ranking order; drop any product that is no longer active
  return topIds.flatMap((id) => {
    const p = byId.get(id);
    if (!p) return [];
    return [
      {
        id: p.id,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl ?? "",
        category: p.category,
        brand: p.brand,
        productVariants: p.productVariants.map((v) => ({
          ...v,
          price: v.price.toNumber(), // Decimal -> number so the card and priceRange can use it
        })),
        sold: soldByProduct.get(id) ?? 0,
      },
    ];
  });
}