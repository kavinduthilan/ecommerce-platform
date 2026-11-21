export type Variant = { id: number; name: string; sku: string; price: string };
export type Stock = {  id: number, quantity: number, reversedQuantity: number, availableQuantity: number };

export type ApiProduct = {
  id: number;
  name: string;
  description: string;
  category: { id: number; name: string };
  brand: { id: number; name: string };
  imageUrl: string;
  productVariants: Variant[];
  inventory: Stock[]
};

export async function getProducts(categoryId?: string): Promise<ApiProduct[]> {
  try {
    const qs = categoryId && categoryId !== "all" ? `?category=${categoryId}` : "";
    const res = await fetch(`${process.env.API_URL}/api/products${qs}`, {
      cache : "no-cache"
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}


export async function getProduct(id: string) {
  const res = await fetch(`${process.env.API_URL}/api/products/${id}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load product");
  return res.json();
}