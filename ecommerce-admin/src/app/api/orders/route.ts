import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@lib/prisma";

const FREE_OVER = new Prisma.Decimal(500);
const SHIPPING_FEE = new Prisma.Decimal(25);

class BadRequest extends Error {}

const newOrderNumber = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

type ItemInput = { productId: number; productVariantId: number; quantity: number };

function parseItems(raw: unknown): ItemInput[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new BadRequest("Order must contain at least one item.");
  }
  return raw.map((r: any) => {
    const productId = Number(r?.productId);
    const productVariantId = Number(r?.productVariantId);
    const quantity = Number(r?.quantity);
    if (!Number.isInteger(productVariantId) || productVariantId < 1) {
      throw new BadRequest("Invalid product variant.");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new BadRequest("Invalid quantity.");
    }
    return { productId, productVariantId, quantity };
  });
}

// export async function POST(req: Request) {
//   try {
//     const body = await req.json().catch(() => null);

//     const customerId = Number(body?.customerId);


//     const items = parseItems(body?.items);

//     // prices come from the DB, never from the client
//     const variants = await prisma.productVariant.findMany({
//       where: { id: { in: items.map((i) => i.productVariantId) } },
//     });
//     const byId = new Map(variants.map((v) => [v.id, v]));

//     const lines = items.map((i) => {
//       const v = byId.get(i.productVariantId);
//       if (!v) throw new BadRequest(`Variant ${i.productVariantId} not found`);
//       const unitPrice = new Prisma.Decimal(v.price);
//       return {
//         productVariantId: v.id,
//         quantity: i.quantity,
//         unitPrice,
//         subtotal: unitPrice.mul(i.quantity),
        
//       };
//     });

//     const totalPrice = lines.reduce((s, l) => s.add(l.subtotal), new Prisma.Decimal(0));
//     const shipping = totalPrice.gte(FREE_OVER) ? new Prisma.Decimal(0) : SHIPPING_FEE;
//     const discountAmount = new Prisma.Decimal(0);
//     const taxAmount = new Prisma.Decimal(0);
//     const totalAmount = totalPrice.add(shipping).sub(discountAmount).add(taxAmount);

  
//     const order = await prisma.order.create({
//       data: {
//         orderNumber: newOrderNumber(),
//         customerId: customerId,
//         totalAmount,
//         discountAmount,
//         taxAmount,
//         notes: body?.notes ? String(body.notes) : null,
//         orderItems: { create: lines },
//       },
//       select: { id: true, orderNumber: true },
//     });

//     return NextResponse.json(order, { status: 201 });
//   } catch (error) {
//     if (error instanceof BadRequest) {
//       return NextResponse.json({ message: error.message }, { status: 400 });
//     }
//     console.error("order error:", error);
//     return NextResponse.json({ message: "Could not create order" }, { status: 500 });
//   }
// }


export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const customerId = Number(body?.customerId);
    if (!Number.isInteger(customerId)) throw new BadRequest("Invalid customerId");

    const rawItems = parseItems(body?.items);

    // merge duplicate variants so the same row isn't updated twice
    const merged = new Map<number, number>();
    for (const i of rawItems) {
      merged.set(i.productVariantId, (merged.get(i.productVariantId) ?? 0) + i.quantity);
    }
    const items = [...merged]
      .map(([productVariantId, quantity]) => ({ productVariantId, quantity }))
      .sort((a, b) => a.productVariantId - b.productVariantId); // consistent lock order, avoids deadlocks

    const order = await prisma.$transaction(async (tx) => {
      // prices come from the DB
      const variants = await tx.productVariant.findMany({
        where: { id: { in: items.map((i) => i.productVariantId) } },
      });
      const byId = new Map(variants.map((v) => [v.id, v]));

      const lines = items.map((i) => {
        const v = byId.get(i.productVariantId);
        if (!v) throw new BadRequest(`Variant ${i.productVariantId} not found`);
        const unitPrice = new Prisma.Decimal(v.price);
        return {
          productVariantId: v.id,
          quantity: i.quantity,
          unitPrice,
          subtotal: unitPrice.mul(i.quantity),
        };
      });

      const totalPrice = lines.reduce((s, l) => s.add(l.subtotal), new Prisma.Decimal(0));
      const shipping = totalPrice.gte(FREE_OVER) ? new Prisma.Decimal(0) : SHIPPING_FEE;
      const discountAmount = new Prisma.Decimal(0);
      const taxAmount = new Prisma.Decimal(0);
      const totalAmount = totalPrice.add(shipping).sub(discountAmount).add(taxAmount);

      const created = await tx.order.create({
        data: {
          orderNumber: newOrderNumber(),
          customerId,
          totalAmount,
          discountAmount,
          taxAmount,
          notes: body?.notes ? String(body.notes) : null,
          orderItems: { create: lines },
        },
        select: { id: true, orderNumber: true },
      });

      // reserve stock for each line
      for (const l of lines) {
        const inv = await tx.inventory.findFirst({
          where: { productVariantId: l.productVariantId, status: "Active" },
          select: { id: true },
        });
        if (!inv) throw new BadRequest(`No inventory for variant ${l.productVariantId}`);

        // atomic check-and-update: only succeeds if enough stock is still available
        const res = await tx.inventory.updateMany({
          where: { id: inv.id, availableQuantity: { gte: l.quantity } },
          data: {
            availableQuantity: { decrement: l.quantity },
            reversedQuantity: { increment: l.quantity },
          },
        });
        if (res.count === 0) {
          throw new BadRequest(`Insufficient stock for variant ${l.productVariantId}`);
        }

        await tx.stockMove.create({
          data: {
            inventoryId: inv.id,
            type: "OUT",
            quantity: l.quantity,
            reason: "Order placed (reserved)",
            referenceId: created.id,
            createdById: 1, 
          },
        });
      }

      return created;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof BadRequest) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("order error:", error);
    return NextResponse.json({ message: "Could not create order" }, { status: 500 });
  }
}