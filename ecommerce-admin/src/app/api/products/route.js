import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category");

    const products = await prisma.product.findMany({
      where: {
        status: "Active",
        ...(categoryId && { categoryId: Number(categoryId) }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        imageUrl: true,
        productVariants: {
          where: { status: "Active" },
          select: {
            id: true,
            name: true,
            sku: true,
            size: { select: { id: true, name: true } },
            price: true,
            inventory: { select: { id: true, quantity: true, reversedQuantity: true, availableQuantity: true } },
          },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Product error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}