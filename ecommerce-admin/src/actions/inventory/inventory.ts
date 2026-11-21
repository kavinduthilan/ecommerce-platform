"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";
import {  Inventory } from "@/lib/type";
import {  z } from "zod";
import { Status } from "@/generated/prisma/enums";

const createInventorySchema = z.object({
  productVariantId: z.coerce.number(),
  quantity: z.number(),
  reversedQuantity: z.number(),
  availableQuantity: z.number(),
  reorderLevel: z.number(),
  status: z.nativeEnum(Status),
});



export async function getInventories(page: number, pageSize: number) {
  const [data, total] = await Promise.all([
    prisma.inventory.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        productVariant: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inventory.count(),
  ]);

  return {
    data,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createInventories(data: Inventory) {
  
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const input =  createInventorySchema.parse(data);

  await prisma.inventory.create({
    data: { 
      productVariantId: input.productVariantId,
      quantity: input.quantity,
      reversedQuantity: input.reversedQuantity,
      availableQuantity: input.availableQuantity,
      reorderLevel: input.reorderLevel,
      status: input.status,
      createdById: user.id
     },
  });

  revalidatePath("/inventory");
  return {success:true}
}

export async function updateInventory(id: number, data: Inventory) {

  const input = createInventorySchema.parse(data);
  
  await prisma.inventory.update({ where: { id }, data: {
    productVariantId: input.productVariantId,
      quantity: input.quantity,
      reversedQuantity: input.reversedQuantity,
      availableQuantity: input.availableQuantity,
      reorderLevel: input.reorderLevel,
      status: input.status,
  } });

  revalidatePath("/inventory");
  return {success:true};
}




