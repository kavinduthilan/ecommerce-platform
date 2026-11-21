"use server";
import { cookies } from "next/headers";
import { createCustomer } from "./customer";

export type CheckoutState = {
  ok?: boolean;
  orderId?: string;
  error?: string;
  values?: Record<string, string>;
};


export type OrderItemInput = {
  productId: number;
  productVariantId: number;
  quantity: number;
};



export type ApiOrder = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  discountAmount: string;
  taxAmount: string;
  notes: string | null;
  createdAt: string;
  orderItems?: {
    id: number;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    productVariant?: { id: number; name: string; sku: string };
  }[];
};




export type CreateOrderResult =
  | { ok: true; order: Pick<ApiOrder, "id" | "orderNumber"> }
  | { ok: false; error: string };

export async function createOrder(
  customerId: number,
  items: OrderItemInput[]
): Promise<CreateOrderResult> {
  try {
    const res = await fetch(`${process.env.API_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, items }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.message ?? "Could not place your order. Please try again." };
    }
    return { ok: true, order: data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function getOrder(orderNumber: string): Promise<ApiOrder | null> {
  try {
    const res = await fetch(
      `${process.env.API_URL}/api/orders/${encodeURIComponent(orderNumber)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function placeOrder(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const values = Object.fromEntries(
    ["name", "phone", "email", "address", "city", "notes"].map((k) => [k, String(fd.get(k) ?? "").trim()])
  ) as Record<string, string>;

  if (values.name.length < 2) return { error: "Please enter your name.", values };
  if (!/^[0-9+\s-]{9,15}$/.test(values.phone)) return { error: "Please enter a valid phone number.", values };
  if (values.address.length < 5) return { error: "Please enter your delivery address.", values };
  if (!values.city) return { error: "Please enter your city.", values };

  const raw = (await cookies()).get("aurelia-cart")?.value;
  let cart: Record<string, number> = {};
  try { cart = raw ? JSON.parse(raw) : {}; } catch {}

  const items = Object.entries(cart).flatMap(([key, quantity]) => {
    const [productId, variantId] = key.split(":");
    if (!variantId) return [];
    return [{ productId: Number(productId), productVariantId: Number(variantId), quantity }];
  });
  if (!items.length) return { error: "Your cart is empty.", values };

  const customer = await createCustomer({
    name: values.name,
      phone: Number(values.phone),
      email: values.email || undefined,
      address: values.address,
      city: values.city,
      notes: values.notes || undefined,
  });
  
  if (!customer.ok) return { error: customer.error, values };

  const result = await createOrder(customer.id, items);

  if (!result.ok) return { error: result.error, values };
  return { ok: true };
}