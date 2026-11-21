import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, status: "Active" },
      select: {
        id: true,
        name: true,
        description: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        imageUrl: true,
        productVariants: {
          where: { status: "Active" },
          orderBy: { price: "asc" },
          select: {
            id: true,
            name: true,
            size: { select: { id: true, name: true } },
            sku: true,
            price: true,
            inventory: { select: { id: true, quantity: true, reversedQuantity: true, availableQuantity: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}