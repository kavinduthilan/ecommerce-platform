"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";
import { StockMove } from "@/lib/type";
import { z } from "zod";
import { StockMoveType } from "@/generated/prisma/enums";

const createStockMoveSchema = z
  .object({
    productVariantId: z.coerce.number().int().positive(),
    type: z.nativeEnum(StockMoveType),
    quantity: z.number().int(),
    reference: z.string().trim().max(100).optional().nullable(),
    note: z.string().trim().max(500).optional().nullable(),
  })
  .refine((v) => v.type === "ADJUSTMENT" || v.quantity > 0, {
    message: "Quantity must be greater than 0",
    path: ["quantity"],
  })
  .refine((v) => v.quantity !== 0, {
    message: "Quantity cannot be 0",
    path: ["quantity"],
  });

/** How much a move changes the on-hand quantity. */
function toDelta(type: StockMoveType, quantity: number) {
  if (type === "IN") return quantity;
  if (type === "OUT") return -quantity;
  return quantity; // Adjustment: signed value entered by the user
}

export async function getStockMoves(page: number, pageSize: number) {
  const [data, total] = await Promise.all([
    prisma.stockMove.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        inventory: {
          select: { productVariant: { select: { name: true } } },
        },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.stockMove.count(),
  ]);

  return {
    data,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createStockMove(input: StockMove) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = createStockMoveSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid stock move");
  }

  const { productVariantId, type, quantity, reference, note } = parsed.data;
  const delta = toDelta(type, quantity);

  // Record the move and update inventory together, so they never drift apart.
  await prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findFirst({
      where: { productVariantId },
    });
    if (!inventory) {
      throw new Error("No inventory record exists for this product variant");
    }
    if (inventory.availableQuantity + delta < 0) {
      throw new Error("Not enough available stock for this move");
    }

    await tx.stockMove.create({
      data: {
        inventoryId: inventory.id,
        type,
        quantity,
        reference: reference || null,
        note: note || null,
        createdById: user.id,
      },
    });

    await tx.inventory.update({
      where: { id: inventory.id },
      data: {
        quantity: { increment: delta },
        availableQuantity: { increment: delta },
      },
    });
  });

  revalidatePath("/inventory/stock-moves");
}