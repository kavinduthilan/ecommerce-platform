"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";
import {  ProductVariant } from "@/lib/type";
import {  z } from "zod";
import { Status } from "@/generated/prisma/enums";

const createProductVariantSchema = z.object({
     name: z.string(),
  productId: z.coerce.number(),
  sizeId: z.coerce.number(),
  sku: z.string().min(1),
  price: z.number(),
  costPrice: z.number(),
  status: z.nativeEnum(Status),
});



export async function getProductVariants(page: number, pageSize: number) {
  const [rows, total] = await Promise.all([
    prisma.productVariant.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        product: { select: { name: true } },
        size: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.productVariant.count(),
  ]);

  const data = rows.map((row) => ({
    ...row,
    price: row.price.toNumber(),
    costPrice: row.costPrice.toNumber(),
  }));

  return {
    data,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createProductVariant(data: ProductVariant) {
  
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const input =  createProductVariantSchema.parse(data);

  await prisma.productVariant.create({
    data: {
      name:input.name,
      sku: input.sku,
      productId: input.productId,
      sizeId: input.sizeId,
      price: input.price,
      costPrice: input.costPrice,
      status: input.status,
      createdById: user.id 
     },
  });

  revalidatePath("/product-variants");
  return {success:true}
}

export async function updateProductVariant(id: number, data: ProductVariant) {

  const input = createProductVariantSchema.parse(data);
  
  await prisma.productVariant.update({ where: { id }, data: {
     name: input.name,
    sku: input.sku,
    productId: input.productId,
    sizeId: input.sizeId,
    price: input.price,
    costPrice: input.costPrice,
    status: input.status
  } });

  revalidatePath("/product-variants");
  return {success:true};
}


export async function getActiveProductVariants(){
     return prisma.productVariant.findMany({
          where:  {status: "Active"},
          orderBy: { createdAt: "desc" },
          select: {
               id: true,
               name: true,
          },
  });
}

